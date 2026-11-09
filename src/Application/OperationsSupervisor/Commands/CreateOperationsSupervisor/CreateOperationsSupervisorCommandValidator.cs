using Smart_Routes.Domain.Constants;
namespace Smart_Routes.Application.OperationsSupervisors.Commands.CreateOperationsSupervisor;

public class CreateOperationsSupervisorCommandValidator : AbstractValidator<CreateOperationsSupervisorCommand>
{
    public CreateOperationsSupervisorCommandValidator()
    {

        RuleFor(usr => usr.UserId)
            .NotEmpty().WithMessage("UserId cannot be empty.");
        RuleFor(usr => usr.ControlArea)
            .NotEmpty().WithMessage("ControlArea cannot be empty.");

    }
}
