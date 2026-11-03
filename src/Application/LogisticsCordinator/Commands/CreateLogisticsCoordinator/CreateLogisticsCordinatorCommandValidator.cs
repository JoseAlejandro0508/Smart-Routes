using Smart_Routes.Domain.Constants;
namespace Smart_Routes.Application.LogisticsCordinators.Commands.CreateLogisticsCordinator;

public class CreateLogisticsCordinatorCommandValidator : AbstractValidator<CreateLogisticCordinatorCommand>
{
    public CreateLogisticsCordinatorCommandValidator()
    {

        RuleFor(usr => usr.UserId)
            .NotEmpty().WithMessage("UserId cannot be empty.");
        RuleFor(usr => usr.Speciality)
            .NotEmpty().WithMessage("Speciality cannot be empty.");

    }
}
