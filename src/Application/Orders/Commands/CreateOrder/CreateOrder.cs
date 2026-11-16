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

    /// <summary>Destination stop when it already exists.</summary>
    public int? StopId { get; init; }

    /// <summary>Destination stop to find or register using its address and zone.</summary>
    public CreateOrderStop? Stop { get; init; }
}

/// <summary>Destination details submitted by the orders client.</summary>
public sealed record CreateOrderStop(string Address, int ZoneId);

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

        var stop = request.StopId.HasValue
            ? await _orderRepository.GetStopByIdAsync(request.StopId.Value, cancellationToken)
            : null;

        if (request.StopId.HasValue && stop is null)
        {
            throw new NotFoundException(request.StopId.Value.ToString(), nameof(Stop));
        }

        var normalizedAddress = request.Stop?.Address.Trim();
        var stopZoneId = stop?.ZoneId ?? request.Stop!.ZoneId;
        var centerCoversStop = await _orderRepository.DoesCenterCoverZoneAsync(
            request.DistributionCenterId,
            stopZoneId,
            cancellationToken);

        if (!centerCoversStop)
        {
            throw new Smart_Routes.Application.Common.Exceptions.ValidationException(
            [new FluentValidation.Results.ValidationFailure(
                request.StopId.HasValue ? nameof(request.StopId) : nameof(request.Stop),
                "The selected stop is outside the distribution center's coverage.")]);
        }

        stop ??= await _orderRepository.GetStopByAddressAndZoneAsync(
            normalizedAddress!,
            stopZoneId,
            cancellationToken);
        stop ??= new Stop
        {
            Address = normalizedAddress!,
            ZoneId = stopZoneId
        };

        var description = request.Description.Trim();
        var duplicateExists = await _orderRepository.ExistsAsync(
            request.DistributionCenterId,
            stop.Id,
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
            stop.Id);
        order.Stop = stop;

        _orderRepository.Add(order);
        try
        {
            await _orderRepository.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var duplicateStop = stop.Id == 0
                ? await _orderRepository.GetStopByAddressAndZoneAsync(normalizedAddress!, stopZoneId, cancellationToken)
                : stop;
            var duplicateCreatedConcurrently = duplicateStop is not null
                && await _orderRepository.ExistsAsync(
                    request.DistributionCenterId,
                    duplicateStop.Id,
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