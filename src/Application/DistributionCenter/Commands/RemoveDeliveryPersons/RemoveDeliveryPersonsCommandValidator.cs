namespace Smart_Routes.Application.DistributionCenters.Commands.RemoveDeliveryPersons;

public class RemoveDeliveryPersonsCommandValidator : AbstractValidator<RemoveDeliveryPersonsCommand>
{
    public RemoveDeliveryPersonsCommandValidator()
    {
        RuleFor(x => x.DistributionCenterId)
            .GreaterThan(0);

        RuleFor(x => x.DeliveryPersonIds)
            .NotEmpty()
            .Must(ids => ids.All(id => !string.IsNullOrWhiteSpace(id)))
            .WithMessage("DeliveryPersonIds cannot contain empty values.");
    }
}
