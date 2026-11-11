using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.Common.Models;
using Smart_Routes.Application.Common.Security;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.Routes.Commands.AddReview;

[Authorize(Roles = $"{Roles.OperationsSupervisor}")]
public record AddReviewCommand : IRequest
{
    public required ReviewDecision Decision { get; init; }
    public string? Observations { get; init; }
    public int RouteId { get; init; }
    public BalanceCriterionRequestDto? BalanceCriteria { get; init; }
    public int? BalanceCritertiaId { get; init; }
}
public class AddReviewCommandHandler : IRequestHandler<AddReviewCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IUser _user;
    public readonly IRouteGenerator _routeGenerator;

    public AddReviewCommandHandler(IApplicationDbContext context, IUser user, IRouteGenerator routeGenerator)
    {
        _context = context;
        _user = user;
        _routeGenerator = routeGenerator;
    }

    public async Task Handle(AddReviewCommand request, CancellationToken cancellationToken)
    {
        var route = await _context.Routes.FindAsync(new object[] { request.RouteId }, cancellationToken);
        int? finalBalanceCriterionId = null;
        if (route == null)
        {
            throw new NotFoundException(nameof(Route), request.RouteId.ToString());
        }

        if (request.BalanceCritertiaId != null)
        {
            var balanceCriterion = await _context.BalanceCriteria.FindAsync(new object[] { request.BalanceCritertiaId }, cancellationToken);

            if (balanceCriterion == null)
            {
                throw new NotFoundException(nameof(BalanceCriterion), ((int)request.BalanceCritertiaId).ToString());
            }
            finalBalanceCriterionId = request.BalanceCritertiaId;

        }

        var review = new Review
        {
            Decision = request.Decision,
            Observations = request.Observations,
            RouteId = request.RouteId,
            SupervisorId = _user!.Id!,
            BalanceCriterioId = finalBalanceCriterionId,

        };

        await _context.Reviews.AddAsync(review, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        if (review.BalanceCriterioId != null)
        {
            await _routeGenerator.RegenerateAsync(review.Id, cancellationToken);
        }

    }
}