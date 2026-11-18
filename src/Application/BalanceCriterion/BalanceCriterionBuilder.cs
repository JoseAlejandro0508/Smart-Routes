using Smart_Routes.Application.Common.Models;
using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.BalanceCriterions;

/// <summary>
/// Builds a balance criterion with its parameters from request data.
/// </summary>
/// <remarks>
/// Shared by <c>CreateBalanceCriterionCommand</c> and by a review that defines a new criterion
/// for a re-confection, so both save the parameters the same way.
/// </remarks>
public static class BalanceCriterionBuilder
{
    /// <summary>Creates the criterion entity and its parameters, ready to be added to the context.</summary>
    /// <param name="name">Criterion name.</param>
    /// <param name="description">Criterion description.</param>
    /// <param name="parameters">Parameters with their metric, operator, applied value and target delivery type.</param>
    /// <param name="authorCoordinatorId">Coordinator who defines it, or null for a predefined criterion.</param>
    /// <returns>The criterion; saving it also saves its parameters.</returns>
    public static BalanceCriterion Build(
        string name,
        string description,
        IEnumerable<CustomBalancedParameterDto> parameters,
        string? authorCoordinatorId)
    {
        var criterion = new BalanceCriterion
        {
            Name = name,
            Description = description,
            AuthorCoordinatorId = authorCoordinatorId
        };

        foreach (var parameter in parameters)
        {
            criterion.Parameters.Add(new BalanceParameter
            {
                Name = parameter.Name,
                Metric = parameter.Metric,
                Operator = parameter.Operator,
                AppliedValue = parameter.AppliedValue,
                // Required by the database when the metric is a delivery type proportion.
                TargetDeliveryType = parameter.DeliveryType
            });
        }

        return criterion;
    }
}
