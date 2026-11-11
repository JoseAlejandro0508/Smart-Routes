namespace Smart_Routes.Application.Routes.Commands.GetRouteByFilter;

public class GetRouteByFilterCommandValidator : AbstractValidator<GetRouteByFilter>
{
    public GetRouteByFilterCommandValidator()
    {
        When(x => x.Id.HasValue, () =>
        {
            RuleFor(x => x.Id)
                .Must(id => id is > 0);
        });

        When(x => x.DistributionCenterId.HasValue, () =>
        {
            RuleFor(x => x.DistributionCenterId)
                .Must(id => id is > 0);
        });

        When(x => x.BalanceCriterionId.HasValue, () =>
        {
            RuleFor(x => x.BalanceCriterionId)
                .Must(id => id is > 0);
        });

        When(x => !string.IsNullOrWhiteSpace(x.DeliveryPersonId), () =>
        {
            RuleFor(x => x.DeliveryPersonId)
                .Must(value => !string.IsNullOrWhiteSpace(value));
        });

        When(x => !string.IsNullOrWhiteSpace(x.LogisticCoordiantorId), () =>
        {
            RuleFor(x => x.LogisticCoordiantorId)
                .Must(value => !string.IsNullOrWhiteSpace(value));
        });

        When(x => x.ScheduleBefore.HasValue && x.ScheduleLast.HasValue, () =>
        {
            RuleFor(x => x.ScheduleBefore)
                .LessThanOrEqualTo(x => x.ScheduleLast)
                .WithMessage("ScheduleBefore must be less than or equal to ScheduleLast.");
        });
    }
}
