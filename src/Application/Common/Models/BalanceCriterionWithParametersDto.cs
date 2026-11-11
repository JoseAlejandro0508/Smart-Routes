using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.Common.Models;

public class BalanceCriterionWithParametersDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AuthorCoordinatorId { get; set; }
    public bool IsPredefined { get; set; }
    public List<BalanceParameterDto> Parameters { get; set; } = [];
}

public class BalanceParameterDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public BalanceMetric Metric { get; set; }
    public ComparisonOperator Operator { get; set; }
    public decimal AppliedValue { get; set; }
    public DeliveryType? TargetDeliveryType { get; set; }
    public int BalanceCriterionId { get; set; }
}
