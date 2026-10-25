using Smart_Routes.Domain.Constants;

namespace Smart_Routes.Application.UserRoles.Commands.UpdateUserRole;

public class UpdateUserRoleCommandValidator : AbstractValidator<UpdateUserRoleCommand>
{
    public UpdateUserRoleCommandValidator()
    {
        RuleFor(usr => usr.Role)
            .NotEmpty().Must(role => Roles.IsValidRole(role!)).WithMessage("Invalid role. Valid roles are: Administrator, LogisticsCoordinator, OperationsSupervisor, DeliveryPerson.");
        RuleFor(usr => usr.UserId)
            .NotEmpty().WithMessage("UserId cannot be empty.");
    }
}
