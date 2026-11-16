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

        RuleFor(command => command)
            .Must(command => command.StopId.HasValue != (command.Stop is not null))
            .WithMessage("Provide either an existing StopId or stop details.");

        RuleFor(command => command.StopId)
            .GreaterThan(0)
            .When(command => command.StopId.HasValue);

        When(command => command.Stop is not null, () =>
        {
            RuleFor(command => command.Stop!.Address)
                .NotEmpty()
                .MaximumLength(300);

            RuleFor(command => command.Stop!.ZoneId)
                .GreaterThan(0);
        });
    }
}