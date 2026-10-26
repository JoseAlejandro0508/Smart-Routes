using Smart_Routes.Domain.Constants;
namespace Smart_Routes.Application.DeliveryPersons.Commands.CreateDeliveryPerson;

public class CreateDeliveryPersonCommandValidator : AbstractValidator<CreateDeliveryPersonCommand>
{
    public CreateDeliveryPersonCommandValidator()
    {

        RuleFor(usr => usr.UserId)
            .NotEmpty().WithMessage("UserId cannot be empty.");

        RuleFor(usr => usr.BirthDay)
            .NotEmpty().WithMessage("BirthDay cannot be empty.");
        RuleFor(usr => usr.Fleet)
            .NotEmpty().WithMessage("Fleet cannot be empty.");
    }
}
