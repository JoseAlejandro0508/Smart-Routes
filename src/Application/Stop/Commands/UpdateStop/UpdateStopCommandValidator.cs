namespace Smart_Routes.Application.Stops.Commands.UpdateStop;

/// <summary>Same rules as creating a stop, plus a valid stop id.</summary>
public class UpdateStopCommandValidator : AbstractValidator<UpdateStopCommand>
{
    public UpdateStopCommandValidator()
    {
        RuleFor(x => x.StopId)
            .GreaterThan(0);

        RuleFor(x => x.Address)
            .NotEmpty()
            .MaximumLength(300)
            .Must(address => !string.IsNullOrWhiteSpace(address));

        RuleFor(x => x.ZoneId)
            .GreaterThan(0);

        RuleFor(x => x.Latitude).InclusiveBetween(-90, 90).When(x => x.Latitude is not null);
        RuleFor(x => x.Longitude).InclusiveBetween(-180, 180).When(x => x.Longitude is not null);
        RuleFor(x => x)
            .Must(x => (x.Latitude is null) == (x.Longitude is null))
            .WithMessage("Latitude and Longitude must be sent together.");
    }
}
