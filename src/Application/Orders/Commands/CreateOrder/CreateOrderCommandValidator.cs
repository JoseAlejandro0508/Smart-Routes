using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.Orders.Commands.CreateOrder;

/// <summary>Defines input constraints for creating a delivery order.</summary>
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(command => command.Description)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(command => command.DeliveryType)
            .IsInEnum();

        RuleFor(command => command.Priority)
            .IsInEnum();

        RuleFor(command => command.WeightKg)
            .GreaterThan(0);

        RuleFor(command => command.EntryDate)
            .NotEqual(default(DateOnly));

        RuleFor(command => command.DeadlineAt)
            .NotEqual(default(DateTimeOffset))
            .Must((command, deadline) => deadline.Date >= command.EntryDate.ToDateTime(TimeOnly.MinValue))
            .WithMessage("DeadlineAt must be on or after EntryDate.");

        RuleFor(command => command.DistributionCenterId)
            .GreaterThan(0);

        RuleFor(command => command.StopId)
            .GreaterThan(0);
    }
}