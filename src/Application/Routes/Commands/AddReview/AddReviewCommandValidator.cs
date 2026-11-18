using Smart_Routes.Application.BalanceCriterions.Commands.Generate;

namespace Smart_Routes.Application.Routes.Commands.AddReview;

public class AddReviewCommandValidator : AbstractValidator<AddReviewCommand>
{
    public AddReviewCommandValidator()
    {
        RuleFor(x => x.RouteId)
            .GreaterThan(0);

        RuleFor(x => x.Decision)
            .Must(decision => decision is not Domain.Enums.ReviewDecision.Pending)
            .WithMessage("Decision must be Approved or Rejected.");

        When(x => x.BalanceCritertiaId.HasValue, () =>
        {
            RuleFor(x => x.BalanceCritertiaId)
                .GreaterThan(0)
                .WithMessage("Balance criteria ID must be greater than 0.");
            
        });
        When(x => x.Decision == Domain.Enums.ReviewDecision.Approved, () =>
        {
            RuleFor(x => x.BalanceCritertiaId)
                .Null()
                .WithMessage("Balance criteria ID must be null when approving a route.");
            RuleFor(x => x.BalanceCriteria)
                .Null()
                .WithMessage("A new balance criterion cannot be sent when approving a route.");
        });
        When(x => x.Decision == Domain.Enums.ReviewDecision.Rejected, () =>
        {
            // A rejection asks for a re-confection: with an existing criterion or a new one, not both.
            RuleFor(x => x)
                .Must(x => (x.BalanceCritertiaId is not null) != (x.BalanceCriteria is not null))
                .WithMessage("When rejecting, send either an existing balance criterion ID or a new balance criterion.");
        });

        When(x => x.BalanceCriteria is not null, () =>
        {
            RuleFor(x => x.BalanceCriteria!).SetValidator(new BalanceCriterionRequestDtoValidator());
        });


        RuleFor(x => x.Observations)
            .NotEmpty()
            .When(x => x.Decision == Domain.Enums.ReviewDecision.Rejected)
            .WithMessage("Observations must be provided when rejecting a route.");

    }
}