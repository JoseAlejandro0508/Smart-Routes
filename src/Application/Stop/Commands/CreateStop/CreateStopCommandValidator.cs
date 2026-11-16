namespace Smart_Routes.Application.Stops.Commands.CreateStop;

public class CreateStopCommandValidator : AbstractValidator<CreateStopCommand>
{
    public CreateStopCommandValidator()
    {
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
