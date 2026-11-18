using Smart_Routes.Application.Common.Models;

namespace Smart_Routes.Application.BalanceCriterions.Commands.Generate;

/// <summary>
/// Validates a new balance criterion sent inside another request, such as a review that asks for
/// a re-confection. Applies the same rules as <see cref="CreateCommandValidator"/>.
/// </summary>
public class BalanceCriterionRequestDtoValidator : AbstractValidator<BalanceCriterionRequestDto>
{
    public BalanceCriterionRequestDtoValidator()
    {
        var rules = new CreateCommandValidator();

        RuleFor(c => c.Name)
            .NotEmpty().WithMessage("Name cannot be empty.")
            .MaximumLength(50).WithMessage("Name too long.");

        RuleFor(c => c.Description)
            .NotEmpty().WithMessage("Description cannot be empty.")
            .MaximumLength(200).WithMessage("Description too long.");

        RuleFor(c => c.CustomBalancedParameters)
            .NotEmpty().WithMessage("Parameters cannot be empty.")
            .Must(rules.OnlyOnePerType).WithMessage("Only one parameter per type is allowed.")
            .Must(rules.DeliveryPrportionWithDeliveryType).WithMessage("DeliveryTypeProportion must have a delivery type.")
            .Must(rules.OneDeliveryTypePerProportion).WithMessage("Only one delivery type per proportion is allowed.")
            .Must(rules.ValidProportions).WithMessage("The total proportion must be less than or equal to 1.");
    }
}
