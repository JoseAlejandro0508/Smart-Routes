using NUnit.Framework;
using Shouldly;
using Smart_Routes.Application.Common.Models;
using Smart_Routes.Application.Routes.Commands.AddReview;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.UnitTests.Routes;

public class AddReviewCommandValidatorTests
{
    private readonly AddReviewCommandValidator _validator = new();

    private static BalanceCriterionRequestDto NewCriterion() => new()
    {
        Name = "Re-confección",
        Description = "Menos peso",
        CustomBalancedParameters =
        [
            new CustomBalancedParameterDto { Name = "Peso", Metric = BalanceMetric.TotalWeight, Operator = ComparisonOperator.LessThanOrEqual, AppliedValue = 80 }
        ]
    };

    [Test]
    public void ApprovalWithoutCriterionIsValid()
    {
        var result = _validator.Validate(new AddReviewCommand { RouteId = 1, Decision = ReviewDecision.Approved });

        result.IsValid.ShouldBeTrue();
    }

    [Test]
    public void RejectionWithAnExistingCriterionIsValid()
    {
        var result = _validator.Validate(new AddReviewCommand { RouteId = 1, Decision = ReviewDecision.Rejected, Observations = "Demasiado peso", BalanceCritertiaId = 3 });

        result.IsValid.ShouldBeTrue();
    }

    [Test]
    public void RejectionWithANewCriterionIsValid()
    {
        var result = _validator.Validate(new AddReviewCommand { RouteId = 1, Decision = ReviewDecision.Rejected, Observations = "Demasiado peso", BalanceCriteria = NewCriterion() });

        result.IsValid.ShouldBeTrue();
    }

    [Test]
    public void RejectionWithoutAnyCriterionFails()
    {
        var result = _validator.Validate(new AddReviewCommand { RouteId = 1, Decision = ReviewDecision.Rejected, Observations = "Demasiado peso" });

        result.IsValid.ShouldBeFalse();
    }

    [Test]
    public void RejectionWithBothCriteriaFails()
    {
        var result = _validator.Validate(new AddReviewCommand { RouteId = 1, Decision = ReviewDecision.Rejected, Observations = "Demasiado peso", BalanceCritertiaId = 3, BalanceCriteria = NewCriterion() });

        result.IsValid.ShouldBeFalse();
    }

    [Test]
    public void ApprovalWithANewCriterionFails()
    {
        var result = _validator.Validate(new AddReviewCommand { RouteId = 1, Decision = ReviewDecision.Approved, BalanceCriteria = NewCriterion() });

        result.IsValid.ShouldBeFalse();
    }

    [Test]
    public void NewCriterionWithoutParametersFails()
    {
        var criterion = new BalanceCriterionRequestDto { Name = "Vacío", Description = "Sin parámetros", CustomBalancedParameters = [] };

        var result = _validator.Validate(new AddReviewCommand { RouteId = 1, Decision = ReviewDecision.Rejected, Observations = "x", BalanceCriteria = criterion });

        result.IsValid.ShouldBeFalse();
    }
}
