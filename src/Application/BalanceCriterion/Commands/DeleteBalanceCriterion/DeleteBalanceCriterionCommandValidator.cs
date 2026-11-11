namespace Smart_Routes.Application.BalanceCriterions.Commands.DeleteBalanceCriterion;

public class DeleteBalanceCriterionCommandValidator : AbstractValidator<DeleteBalanceCriterionCommand>
{
    public DeleteBalanceCriterionCommandValidator()
    {
        RuleFor(x => x.BalanceCriterionId)
            .GreaterThan(0);
    }
}
