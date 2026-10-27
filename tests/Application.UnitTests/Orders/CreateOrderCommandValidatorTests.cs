using Smart_Routes.Application.Orders.Commands.CreateOrder;
using Smart_Routes.Domain.Enums;
using NUnit.Framework;
using Shouldly;

namespace Smart_Routes.Application.UnitTests.Orders;

public class CreateOrderCommandValidatorTests
{
    private readonly CreateOrderCommandValidator _validator = new();

    [Test]
    public void ValidOrderPassesValidation()
    {
        var result = _validator.Validate(new CreateOrderCommand
        {
            Description = "Package 42",
            DeliveryType = DeliveryType.Parcel,
            Priority = OrderPriority.Medium,
            WeightKg = 2.5m,
            EntryDate = new DateOnly(2026, 10, 27),
            DeadlineAt = new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.Zero),
            DistributionCenterId = 1,
            StopId = 1
        });

        result.IsValid.ShouldBeTrue();
    }

    [Test]
    public void NonPositiveWeightFailsValidation()
    {
        var result = _validator.Validate(new CreateOrderCommand
        {
            Description = "Package 42",
            DeliveryType = DeliveryType.Parcel,
            Priority = OrderPriority.Medium,
            WeightKg = 0,
            EntryDate = new DateOnly(2026, 10, 27),
            DeadlineAt = new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.Zero),
            DistributionCenterId = 1,
            StopId = 1
        });

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(error => error.PropertyName == nameof(CreateOrderCommand.WeightKg));
    }

    [Test]
    public void DeadlineBeforeEntryDateFailsValidation()
    {
        var result = _validator.Validate(new CreateOrderCommand
        {
            Description = "Package 42",
            DeliveryType = DeliveryType.Parcel,
            Priority = OrderPriority.Medium,
            WeightKg = 2.5m,
            EntryDate = new DateOnly(2026, 10, 27),
            DeadlineAt = new DateTimeOffset(2026, 10, 26, 12, 0, 0, TimeSpan.Zero),
            DistributionCenterId = 1,
            StopId = 1
        });

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(error => error.PropertyName == nameof(CreateOrderCommand.DeadlineAt));
    }
}