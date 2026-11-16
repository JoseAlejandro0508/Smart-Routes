using Smart_Routes.Domain.Constants;
namespace Smart_Routes.Application.DeliveryPersons.Commands.CreateDeliveryPerson;

public class CreateDeliveryPersonCommandValidator : AbstractValidator<CreateDeliveryPersonCommand>
{
    public CreateDeliveryPersonCommandValidator()
    {

        RuleFor(usr => usr.UserId)
            .NotEmpty().WithMessage("UserId cannot be empty.");

        // edad >= 18 (informe 3.2): the age is derived from the birth date, so it is checked here and in the database.
        RuleFor(usr => usr.BirthDay)
            .NotEmpty().WithMessage("BirthDay cannot be empty.")
            .Must(birthDay => birthDay.AddYears(18) <= DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("The delivery person must be at least 18 years old.");
        RuleFor(usr => usr.Fleet)
            .NotEmpty().WithMessage("Fleet cannot be empty.");
    }
}
