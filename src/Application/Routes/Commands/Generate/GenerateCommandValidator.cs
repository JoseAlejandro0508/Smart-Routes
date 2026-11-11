namespace Smart_Routes.Application.Routes.Commands.Generate;

public class GenerateCommandValidator : AbstractValidator<GenerateCommand>
{
    public GenerateCommandValidator()
    {
        RuleFor(x => x.ScheduledDate)
            .NotEmpty()
            .GreaterThanOrEqualTo(DateTime.Today);

        RuleFor(x => x.DeliveryPersonId)
            .NotEmpty()
            .Must(id => !string.IsNullOrWhiteSpace(id));

        RuleFor(x => x.DistributionCenterId)
            .GreaterThan(0);

        RuleFor(x => x.BalanceCriterionId)
            .GreaterThan(0);
    }
}
