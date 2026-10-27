using Smart_Routes.Application.Common.Exceptions;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Smart_Routes.Domain.Factories;

namespace Smart_Routes.Application.Orders.Commands.CreateOrder;

/// <summary>Command to register a delivery order for an authorized distribution center.</summary>
[Authorize(Roles = Roles.LogisticsCoordinator)]
public record CreateOrderCommand : IRequest<int>
{
    /// <summary>Order description, used together with the other key fields to prevent duplicates.</summary>
    public string Description { get; init; } = string.Empty;

    /// <summary>Kind of delivery, such as parcel, documents or perishable goods.</summary>
    public DeliveryType DeliveryType { get; init; }

    /// <summary>Operational priority assigned to the order.</summary>
    public OrderPriority Priority { get; init; }

    /// <summary>Order weight in kilograms.</summary>
    public decimal WeightKg { get; init; }

    /// <summary>Calendar date when the order was entered.</summary>
    public DateOnly EntryDate { get; init; }

    /// <summary>Latest allowed delivery date and time.</summary>
    public DateTimeOffset DeadlineAt { get; init; }

    /// <summary>Distribution center where the order is registered.</summary>
    public int DistributionCenterId { get; init; }

    /// <summary>Destination stop for the delivery.</summary>
    public int StopId { get; init; }
}

/// <summary>Validates authorization and business relationships, then persists a new order.</summary>
public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, int>
{
    private readonly IOrderRepository _orderRepository;
    private readonly OrderFactory _orderFactory;
    private readonly IUser _user;

    public CreateOrderCommandHandler(IOrderRepository orderRepository, OrderFactory orderFactory, IUser user)
    {
        _orderRepository = orderRepository;
        _orderFactory = orderFactory;
        _user = user;
    }

    public async Task<int> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var coordinatorId = _user.Id ?? throw new UnauthorizedAccessException();
        var isAuthorizedForCenter = await _orderRepository.IsCoordinatorAuthorizedForCenterAsync(
            coordinatorId,
            request.DistributionCenterId,
            cancellationToken);

        if (!isAuthorizedForCenter)
        {
            throw new ForbiddenAccessException();
        }

        var stopZoneId = await _orderRepository.GetStopZoneIdAsync(request.StopId, cancellationToken);

        if (stopZoneId is null)
        {
            throw new NotFoundException(request.StopId.ToString(), nameof(Stop));
        }

        var centerCoversStop = await _orderRepository.DoesCenterCoverZoneAsync(
            request.DistributionCenterId,
            stopZoneId.Value,
            cancellationToken);

        if (!centerCoversStop)
        {
            throw new Smart_Routes.Application.Common.Exceptions.ValidationException(
            [new FluentValidation.Results.ValidationFailure(
                nameof(request.StopId),
                "The selected stop is outside the distribution center's coverage.")]);
        }

        var description = request.Description.Trim();
        var duplicateExists = await _orderRepository.ExistsAsync(
            request.DistributionCenterId,
            request.StopId,
            request.DeliveryType,
            description,
            request.EntryDate,
            cancellationToken);

        if (duplicateExists)
        {
            throw new ConflictException("An order with the same center, stop, delivery type, description and entry date already exists.");
        }

        var order = _orderFactory.Create(
            description,
            request.DeliveryType,
            request.Priority,
            request.WeightKg,
            request.EntryDate,
            request.DeadlineAt,
            coordinatorId,
            request.DistributionCenterId,
            request.StopId);

        _orderRepository.Add(order);
        try
        {
            await _orderRepository.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var duplicateCreatedConcurrently = await _orderRepository.ExistsAsync(
                request.DistributionCenterId,
                request.StopId,
                request.DeliveryType,
                description,
                request.EntryDate,
                cancellationToken);

            if (duplicateCreatedConcurrently)
            {
                throw new ConflictException("An order with the same center, stop, delivery type, description and entry date already exists.");
            }

            throw;
        }

        return order.Id;
    }
}