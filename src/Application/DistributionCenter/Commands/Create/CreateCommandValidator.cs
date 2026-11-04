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
            
    }
}
