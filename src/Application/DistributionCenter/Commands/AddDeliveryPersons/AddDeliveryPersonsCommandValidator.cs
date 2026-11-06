namespace Smart_Routes.Application.DistributionCenters.Commands.AddDeliveryPersons;

public class AddDeliveryPersonsCommandValidator : AbstractValidator<AddDeliveryPersonsCommand>
{
    public AddDeliveryPersonsCommandValidator()
    {
        RuleFor(x => x.DistributionCenterId)
            .GreaterThan(0);

        RuleFor(x => x.DeliveryPersonIds)
            .NotEmpty()
            .Must(ids => ids.All(id => !string.IsNullOrWhiteSpace(id)))
            .WithMessage("DeliveryPersonIds cannot contain empty values.");
    }
}
