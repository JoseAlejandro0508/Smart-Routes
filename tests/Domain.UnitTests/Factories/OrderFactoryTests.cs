using Smart_Routes.Domain.Enums;
using Smart_Routes.Domain.Factories;
using NUnit.Framework;
using Shouldly;

namespace Smart_Routes.Domain.UnitTests.Factories;

public class OrderFactoryTests
{
    [Test]
    public void CreateTrimsDescriptionAndInitializesOrderAsPending()
    {
        var factory = new OrderFactory();
        var entryDate = new DateOnly(2026, 10, 27);
        var deadline = new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.Zero);

        var order = factory.Create(
            "  Package 42  ",
            DeliveryType.Parcel,
            OrderPriority.Urgent,
            3.25m,
            entryDate,
            deadline,
            "coordinator-1",
            7,
            12);

        order.Description.ShouldBe("Package 42");
        order.Status.ShouldBe(OrderStatus.Pending);
        order.DeliveryType.ShouldBe(DeliveryType.Parcel);
        order.Priority.ShouldBe(OrderPriority.Urgent);
        order.WeightKg.ShouldBe(3.25m);
        order.EntryDate.ShouldBe(entryDate);
        order.DeadlineAt.ShouldBe(deadline);
        order.EntryCoordinatorId.ShouldBe("coordinator-1");
        order.DistributionCenterId.ShouldBe(7);
        order.StopId.ShouldBe(12);
    }
}