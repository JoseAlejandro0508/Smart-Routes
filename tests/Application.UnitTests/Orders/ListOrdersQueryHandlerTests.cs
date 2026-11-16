using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Orders.Queries.ListOrders;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Moq;
using NUnit.Framework;
using Shouldly;

namespace Smart_Routes.Application.UnitTests.Orders;

public class ListOrdersQueryHandlerTests
{
    private Mock<IOrderRepository> _repository = null!;
    private Mock<IUser> _user = null!;
    private ListOrdersQueryHandler _handler = null!;

    [SetUp]
    public void SetUp()
    {
        _repository = new Mock<IOrderRepository>();
        _user = new Mock<IUser>();
        _user.SetupGet(user => user.Id).Returns("coordinator-1");
        _handler = new ListOrdersQueryHandler(_repository.Object, _user.Object);
    }

    [Test]
    public async Task HandleReturnsFilteredPageAndTotalCount()
    {
        var order = new Order
        {
            Id = 42,
            Description = "Package 42",
            DeliveryType = DeliveryType.Parcel,
            Priority = OrderPriority.Urgent,
            WeightKg = 2.5m,
            EntryDate = new DateOnly(2026, 10, 27),
            DeadlineAt = new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.Zero),
            Status = OrderStatus.Pending,
            DistributionCenterId = 7,
            StopId = 12,
            DistributionCenter = new DistributionCenter { Name = "Center 7" },
            Stop = new Stop
            {
                Address = "12 Main Street",
                Zone = new Zone { Name = "Zone 4" }
            }
        };
        var orders = (IReadOnlyList<Order>)[order];

        _repository.Setup(repository => repository.GetForCoordinatorAsync(
                "coordinator-1",
                7,
                4,
                DeliveryType.Parcel,
                OrderPriority.Urgent,
                OrderStatus.Pending,
                2,
                10,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((orders, 13));

        var response = await _handler.Handle(
            new ListOrdersQuery(7, 4, DeliveryType.Parcel, OrderPriority.Urgent, OrderStatus.Pending, 2, 10),
            CancellationToken.None);

        response.PageNumber.ShouldBe(2);
        response.PageSize.ShouldBe(10);
        response.TotalCount.ShouldBe(13);
        response.Items.Count.ShouldBe(1);
        response.Items[0].Id.ShouldBe(42);
        response.Items[0].DistributionCenterId.ShouldBe(7);
        response.Items[0].CenterName.ShouldBe("Center 7");
        response.Items[0].ZoneName.ShouldBe("Zone 4");
        response.Items[0].Address.ShouldBe("12 Main Street");
        _repository.Verify(repository => repository.GetForCoordinatorAsync(
            "coordinator-1",
            7,
            4,
            DeliveryType.Parcel,
            OrderPriority.Urgent,
            OrderStatus.Pending,
            2,
            10,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task HandleRejectsMissingAuthenticatedCoordinator()
    {
        _user.SetupGet(user => user.Id).Returns((string?)null);

        await Should.ThrowAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ListOrdersQuery(), CancellationToken.None));

        _repository.Verify(repository => repository.GetForCoordinatorAsync(
            It.IsAny<string>(),
            It.IsAny<int?>(),
            It.IsAny<int?>(),
            It.IsAny<DeliveryType?>(),
            It.IsAny<OrderPriority?>(),
            It.IsAny<OrderStatus?>(),
            It.IsAny<int>(),
            It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }
}
