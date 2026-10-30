using Smart_Routes.Application.Common.Exceptions;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Orders.Commands.CreateOrder;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Smart_Routes.Domain.Factories;
using Moq;
using NUnit.Framework;
using Shouldly;

namespace Smart_Routes.Application.UnitTests.Orders;

public class CreateOrderCommandHandlerTests
{
    private Mock<IOrderRepository> _repository = null!;
    private Mock<IUser> _user = null!;
    private CreateOrderCommandHandler _handler = null!;

    [SetUp]
    public void SetUp()
    {
        _repository = new Mock<IOrderRepository>();
        _user = new Mock<IUser>();
        _user.SetupGet(user => user.Id).Returns("coordinator-1");
        _handler = new CreateOrderCommandHandler(_repository.Object, new OrderFactory(), _user.Object);
    }

    [Test]
    public async Task HandleCreatesOrderForAuthorizedCoordinator()
    {
        var command = CreateValidCommand();
        _repository.Setup(repository => repository.IsCoordinatorAuthorizedForCenterAsync("coordinator-1", 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _repository.Setup(repository => repository.GetStopZoneIdAsync(12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(4);
        _repository.Setup(repository => repository.DoesCenterCoverZoneAsync(7, 4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _repository.Setup(repository => repository.ExistsAsync(
                7, 12, DeliveryType.Parcel, "Package 42", new DateOnly(2026, 10, 27), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _repository.Setup(repository => repository.Add(It.IsAny<Order>()))
            .Callback<Order>(order => order.Id = 42);
        _repository.Setup(repository => repository.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var orderId = await _handler.Handle(command, CancellationToken.None);

        orderId.ShouldBe(42);
        _repository.Verify(repository => repository.Add(It.Is<Order>(order =>
            order.Description == "Package 42"
                && order.EntryCoordinatorId == "coordinator-1"
                && order.Status == OrderStatus.Pending)), Times.Once);
        _repository.Verify(repository => repository.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task HandleRejectsCoordinatorWithoutCenterAuthorization()
    {
        _repository.Setup(repository => repository.IsCoordinatorAuthorizedForCenterAsync("coordinator-1", 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        await Should.ThrowAsync<ForbiddenAccessException>(() =>
            _handler.Handle(CreateValidCommand(), CancellationToken.None));

        _repository.Verify(repository => repository.Add(It.IsAny<Order>()), Times.Never);
    }

    [Test]
    public async Task HandleRejectsDuplicateOrder()
    {
        var command = CreateValidCommand();
        _repository.Setup(repository => repository.IsCoordinatorAuthorizedForCenterAsync("coordinator-1", 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _repository.Setup(repository => repository.GetStopZoneIdAsync(12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(4);
        _repository.Setup(repository => repository.DoesCenterCoverZoneAsync(7, 4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _repository.Setup(repository => repository.ExistsAsync(
                7, 12, DeliveryType.Parcel, "Package 42", new DateOnly(2026, 10, 27), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        await Should.ThrowAsync<ConflictException>(() =>
            _handler.Handle(command, CancellationToken.None));

        _repository.Verify(repository => repository.Add(It.IsAny<Order>()), Times.Never);
    }

    private static CreateOrderCommand CreateValidCommand()
    {
        return new CreateOrderCommand
        {
            Description = " Package 42 ",
            DeliveryType = DeliveryType.Parcel,
            Priority = OrderPriority.Medium,
            WeightKg = 2.5m,
            EntryDate = new DateOnly(2026, 10, 27),
            DeadlineAt = new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.Zero),
            DistributionCenterId = 7,
            StopId = 12
        };
    }
}