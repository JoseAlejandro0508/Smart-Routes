namespace Smart_Routes.Application.DistributionCenters.Commands.RemoveCoveredZone;

public class RemoveCoveredZonesCommandValidator : AbstractValidator<RemoveCoveredZonesCommand>
{
    public RemoveCoveredZonesCommandValidator()
    {
        RuleFor(x => x.DistributionCenterId)
            .GreaterThan(0);

        RuleFor(x => x.ZoneIds)
            .NotEmpty()
            .Must(ids => ids.All(id => id > 0))
            .WithMessage("ZoneIds must contain only values greater than zero.");
    }
}
