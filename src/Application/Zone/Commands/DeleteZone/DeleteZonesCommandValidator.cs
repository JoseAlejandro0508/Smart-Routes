namespace Smart_Routes.Application.Zones.Commands.DeleteZone;

public class DeleteZoneCommandValidator : AbstractValidator<DeleteZoneCommand>
{
    public DeleteZoneCommandValidator()
    {
        RuleFor(v => v.ZoneId)
            .GreaterThan(0)
            .NotEmpty();
    }
}
