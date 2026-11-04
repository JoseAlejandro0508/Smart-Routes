namespace Smart_Routes.Application.DistributionCenters.Commands.RemoveLogisticsCoordinators;

public class RemoveLogisticsCoordinatorsCommandValidator : AbstractValidator<RemoveLogisticsCoordinatorsCommand>
{
    public RemoveLogisticsCoordinatorsCommandValidator()
    {
        RuleFor(x => x.DistributionCenterId)
            .GreaterThan(0);

        RuleFor(x => x.CoordinatorIds)
            .NotEmpty()
            .Must(ids => ids.All(id => !string.IsNullOrWhiteSpace(id)))
            .WithMessage("CoordinatorIds cannot contain empty values.");
    }
}
