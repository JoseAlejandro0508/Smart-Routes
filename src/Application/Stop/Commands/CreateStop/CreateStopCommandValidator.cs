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
    }
}
