using Smart_Routes.Domain.Constants;
namespace Smart_Routes.Application.UserRoles.Commands.DeleteUserRole;

public class DeleteUserRoleCommandValidator : AbstractValidator<DeleteUserRoleCommand>
{
    public DeleteUserRoleCommandValidator()
    {

        RuleFor(usr => usr.UserId)
            .NotEmpty().WithMessage("UserId cannot be empty.");
    }
}
