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
            
        });
        When(x => x.Decision == Domain.Enums.ReviewDecision.Rejected, () =>
        {
            RuleFor(x => x.BalanceCritertiaId)
                .NotNull()
                .WithMessage("Balance criteria ID must not be null when rejecting a route.");
            
        });


        RuleFor(x => x.Observations)
            .NotEmpty()
            .When(x => x.Decision == Domain.Enums.ReviewDecision.Rejected)
            .WithMessage("Observations must be provided when rejecting a route.");

    }
}