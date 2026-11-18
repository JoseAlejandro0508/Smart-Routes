using NUnit.Framework;
using Shouldly;
using Smart_Routes.Application.BalanceCriterions;
using Smart_Routes.Application.Common.Models;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.UnitTests.BalanceCriteria;

public class BalanceCriterionBuilderTests
{
    [Test]
    public void BuildCopiesEveryParameterIncludingTheTargetDeliveryType()
    {
        var parameters = new[]
        {
            new CustomBalancedParameterDto { Name = "Peso", Metric = BalanceMetric.TotalWeight, Operator = ComparisonOperator.LessThanOrEqual, AppliedValue = 100 },
            new CustomBalancedParameterDto { Name = "Documentos", Metric = BalanceMetric.DeliveryTypeProportion, Operator = ComparisonOperator.GreaterThanOrEqual, AppliedValue = 0.3m, DeliveryType = DeliveryType.Documents }
        };

        var criterion = BalanceCriterionBuilder.Build("Mixto", "Peso y documentos", parameters, "coordinator-1");

        criterion.Name.ShouldBe("Mixto");
        criterion.AuthorCoordinatorId.ShouldBe("coordinator-1");
        criterion.Parameters.Count.ShouldBe(2);
        criterion.Parameters[0].TargetDeliveryType.ShouldBeNull();
        criterion.Parameters[1].TargetDeliveryType.ShouldBe(DeliveryType.Documents);
        criterion.Parameters[1].AppliedValue.ShouldBe(0.3m);
    }

    [Test]
    public void BuildWithoutAuthorCreatesAPredefinedCriterion()
    {
        var criterion = BalanceCriterionBuilder.Build("Base", "Sin autor", [], authorCoordinatorId: null);

        criterion.IsPredefined.ShouldBeTrue();
    }
}
