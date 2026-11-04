namespace Smart_Routes.Application.DistributionCenters.Commands.AddCoveredZone;

public class AddCoveredZoneCommandValidator : AbstractValidator<AddCoveredZoneCommand>
{
    public AddCoveredZoneCommandValidator()
    {
        RuleFor(cz => cz.ZoneIds)
            .Must(x => !x.Any(z => z <= 0))
            .NotEmpty();
        RuleFor(cz => cz.DistributionCenterId)
            .GreaterThan(0)
            .NotEmpty();

    }
}
