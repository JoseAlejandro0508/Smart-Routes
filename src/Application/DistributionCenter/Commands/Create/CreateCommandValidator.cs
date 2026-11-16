namespace Smart_Routes.Application.DistributionCenters.Commands.Create;

public class CreateCommandValidator : AbstractValidator<CreateCommand>
{
    public CreateCommandValidator()
    {
        RuleFor(v => v.Name)
            .MaximumLength(200)
            .NotEmpty();
        RuleFor(v => v.LogisticProgram)
            .MaximumLength(200)
            .NotEmpty();

        RuleFor(v => v.Latitude).InclusiveBetween(-90, 90).When(v => v.Latitude is not null);
        RuleFor(v => v.Longitude).InclusiveBetween(-180, 180).When(v => v.Longitude is not null);
        RuleFor(v => v)
            .Must(v => (v.Latitude is null) == (v.Longitude is null))
            .WithMessage("Latitude and Longitude must be sent together.");
    }
}
