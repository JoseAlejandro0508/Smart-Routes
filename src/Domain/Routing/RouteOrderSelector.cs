using Smart_Routes.Domain.Services;

namespace Smart_Routes.Domain.Routing;

/// <summary>An order that can be added to a route, with the data the selection needs.</summary>
/// <param name="OrderId">Order identifier.</param>
/// <param name="StopId">Destination stop.</param>
/// <param name="ZoneId">Zone of the destination stop.</param>
/// <param name="WeightKg">Order weight in kg.</param>
/// <param name="DeliveryType">Delivery type of the order.</param>
/// <param name="Priority">Order priority.</param>
/// <param name="DeadlineAt">Delivery deadline.</param>
public sealed record RouteCandidate(
    int OrderId,
    int StopId,
    int ZoneId,
    decimal WeightKg,
    DeliveryType DeliveryType,
    OrderPriority Priority,
    DateTimeOffset DeadlineAt);

/// <summary>Orders chosen for a route and how the result compares with each parameter of the criterion.</summary>
/// <param name="Selected">Chosen orders, in the order they were picked.</param>
/// <param name="Evaluations">Result of every parameter of the criterion on the chosen orders.</param>
public sealed record RouteSelection(
    IReadOnlyList<RouteCandidate> Selected,
    IReadOnlyList<RouteBalanceEvaluation> Evaluations)
{
    /// <summary>Whether every parameter of the criterion is satisfied.</summary>
    public bool SatisfiesCriterion => Evaluations.All(evaluation => evaluation.IsSatisfied);
}

/// <summary>
/// Chooses the orders of a route so that they respect the parameters of a balance criterion.
/// </summary>
/// <remarks>
/// Orders are considered from most to least urgent (priority, then deadline). An order is added
/// only if the route still respects every upper limit afterwards: parameters with "&lt;=" or "=" on
/// metrics that only grow (order count, weight, zones, stops), and delivery type proportions.
/// Lower limits ("&gt;=") cannot be enforced one order at a time, so they are reported in
/// <see cref="RouteSelection.Evaluations"/>. When a criterion asks for a minimum proportion of a
/// delivery type, orders of that type are considered first.
/// </remarks>
public sealed class RouteOrderSelector
{
    private readonly RouteBalanceParameterEvaluator _evaluator;

    /// <summary>Creates the selector with the evaluator that applies the metric strategies.</summary>
    /// <param name="evaluator">Evaluator of balance parameters.</param>
    public RouteOrderSelector(RouteBalanceParameterEvaluator evaluator)
    {
        _evaluator = evaluator;
    }

    /// <summary>Selects the orders of a route.</summary>
    /// <param name="candidates">Orders that may be added.</param>
    /// <param name="parameters">Parameters of the balance criterion, with their applied values.</param>
    /// <returns>The chosen orders and the evaluation of each parameter.</returns>
    public RouteSelection Select(IEnumerable<RouteCandidate> candidates, IReadOnlyCollection<BalanceParameter> parameters)
    {
        var minimumTypes = parameters
            .Where(p => p.Metric == BalanceMetric.DeliveryTypeProportion &&
                        p.Operator != ComparisonOperator.LessThanOrEqual &&
                        p.TargetDeliveryType is not null)
            .Select(p => p.TargetDeliveryType!.Value)
            .ToHashSet();

        var ordered = candidates
            .OrderBy(c => minimumTypes.Contains(c.DeliveryType) ? 0 : 1)
            .ThenByDescending(c => c.Priority)
            .ThenBy(c => c.DeadlineAt)
            .ThenBy(c => c.OrderId)
            .ToList();

        var selected = new List<RouteCandidate>();

        foreach (var candidate in ordered)
        {
            selected.Add(candidate);
            if (!RespectsLimits(selected, candidate, parameters))
            {
                selected.RemoveAt(selected.Count - 1);
            }
        }

        var snapshot = ToSnapshot(selected);
        var evaluations = parameters
            .Select(parameter => _evaluator.Evaluate(parameter, parameter.AppliedValue, snapshot))
            .ToList();

        return new RouteSelection(selected, evaluations);
    }

    /// <summary>Builds the metric snapshot of a set of orders.</summary>
    /// <param name="orders">Orders of the route.</param>
    /// <returns>The data the metric strategies need.</returns>
    public static RouteBalanceSnapshot ToSnapshot(IReadOnlyCollection<RouteCandidate> orders) =>
        new(
            orders.Select(o => o.DeliveryType).ToList(),
            orders.Select(o => o.ZoneId).Distinct().Count(),
            orders.Sum(o => o.WeightKg),
            orders.Select(o => o.StopId).Distinct().Count());

    private bool RespectsLimits(
        IReadOnlyCollection<RouteCandidate> selected,
        RouteCandidate added,
        IReadOnlyCollection<BalanceParameter> parameters)
    {
        var snapshot = ToSnapshot(selected);

        foreach (var parameter in parameters)
        {
            var evaluation = _evaluator.Evaluate(parameter, parameter.AppliedValue, snapshot);
            var actual = evaluation.ActualValue;
            var limit = parameter.AppliedValue;

            if (parameter.Metric == BalanceMetric.DeliveryTypeProportion)
            {
                var addedIsTarget = added.DeliveryType == parameter.TargetDeliveryType;
                var capsProportion = parameter.Operator is ComparisonOperator.LessThanOrEqual or ComparisonOperator.Equal;
                var floorsProportion = parameter.Operator is ComparisonOperator.GreaterThanOrEqual or ComparisonOperator.Equal;

                // An order of the target type raises the proportion; any other order lowers it.
                if (capsProportion && addedIsTarget && actual > limit)
                {
                    return false;
                }

                if (floorsProportion && !addedIsTarget && actual < limit)
                {
                    return false;
                }

                continue;
            }

            // The other metrics never decrease when an order is added, so "<=" and "=" are upper limits.
            var isUpperLimit = parameter.Operator is ComparisonOperator.LessThanOrEqual or ComparisonOperator.Equal;
            if (isUpperLimit && actual > limit)
            {
                return false;
            }
        }

        return true;
    }
}
