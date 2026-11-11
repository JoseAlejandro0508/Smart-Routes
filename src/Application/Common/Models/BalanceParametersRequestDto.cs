
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.Common.Models;
public class CustomBalancedParameterDto
{
    public  string Name { get; init; }=string.Empty;
    public required BalanceMetric Metric { get; init; }
    public required ComparisonOperator Operator { get; init; }
    public required decimal AppliedValue { get; init; }
    public DeliveryType? DeliveryType { get; init; }

}
public class BalanceCriterionRequestDto
{
    public required string Name { get; init; }
    public required string Description { get; init; }


    public required IList<CustomBalancedParameterDto> CustomBalancedParameters { get; init; }

}