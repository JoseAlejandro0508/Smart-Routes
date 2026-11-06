namespace Smart_Routes.Application.DistributionCenters.Queries.GetById;

public class GetByIdCommandValidator : AbstractValidator<GetByIdQuery>
{
    public GetByIdCommandValidator()
    {
        RuleFor(q => q.DCid)
            .GreaterThan(0)
            .NotEmpty();
    }
}
