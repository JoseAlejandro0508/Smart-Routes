using System.Data;
using Smart_Routes.Application.Common.Models;
using Smart_Routes.Domain.Enums;

namespace Smart_Routes.Application.BalanceCriterions.Commands.Generate;
public class CreateCommandValidator:AbstractValidator<CreateBalanceCriterionCommand>
{
    public CreateCommandValidator()
    {
        RuleFor(cbc=> cbc.Name)
            .NotEmpty().WithMessage("UserId cannot be empty.")
            .MaximumLength(50).WithMessage("Name too long");
        RuleFor(cbc=>cbc.Description)
            .NotEmpty().WithMessage("Description cannot be empty.")
            .MaximumLength(200).WithMessage("Description too long");
        RuleFor(cbc=>cbc.CustomBalancedParameters)
            .NotEmpty().WithMessage("Parameters cannot be empty.")
            .Must(OnlyOnePerType).WithMessage("Only one parameter per type is allowed.")
            .Must(DeliveryPrportionWithDeliveryType).WithMessage("DeliveryTypeProportion must have a delivery type.")
            .Must(OneDeliveryTypePerProportion).WithMessage("Only one delivery type per proportion is allowed.")
            .Must(ValidProportions).WithMessage("The total proportion must be less than or equal to 1.");

    }
    public bool OnlyOnePerType(IList<CustomBalancedParameterDto> parameters)
    {
        Dictionary<BalanceMetric, int> typeCounts = new Dictionary<BalanceMetric, int>();
        foreach (CustomBalancedParameterDto parameter in parameters)
        {
            if (parameter.Metric == BalanceMetric.DeliveryTypeProportion)continue;
            if(!typeCounts.ContainsKey(parameter.Metric))
            {
                typeCounts[parameter.Metric]=0;

            }
            typeCounts[parameter.Metric]++;

            if (typeCounts[parameter.Metric] > 1)
            {
                return false;
            }

        }
        return true;
    }
    public bool DeliveryPrportionWithDeliveryType(IList<CustomBalancedParameterDto> parameters)
    {

        foreach (CustomBalancedParameterDto parameter in parameters)
        {
            if (parameter.Metric != BalanceMetric.DeliveryTypeProportion)continue;
            if(parameter.DeliveryType==null)return false;

        }
        return true;
    }
    public bool OneDeliveryTypePerProportion(IList<CustomBalancedParameterDto> parameters)
    {
        Dictionary<DeliveryType, int> typeCounts = new Dictionary<DeliveryType, int>();

        foreach (CustomBalancedParameterDto parameter in parameters)
        {
            if (parameter.Metric != BalanceMetric.DeliveryTypeProportion)continue;
            if(parameter.DeliveryType==null)continue;
            if(!typeCounts.ContainsKey(parameter.DeliveryType!.Value))
            {
                typeCounts[parameter.DeliveryType!.Value]=0;

            }
            typeCounts[parameter.DeliveryType!.Value]++;
            if (typeCounts[parameter.DeliveryType!.Value] > 1)
            {
                return false;
            }

        }
        return true;
    }
    public bool ValidProportions(IList<CustomBalancedParameterDto> parameters)
    {
        
        var totalProportion = parameters
            .Where(p => p.Metric == BalanceMetric.DeliveryTypeProportion)
            .Sum(p => p.AppliedValue);
        return totalProportion <= 1;

    }
}
