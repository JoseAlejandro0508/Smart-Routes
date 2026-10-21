namespace Smart_Routes.Domain.Entities;

/// <summary>
/// REVISION_PARAMETRO (N:M relationship INDICA_PARAMETRO). Composite PK (id_revision, id_parametro).
/// Only recorded on rejected reviews.
/// </summary>
public class ReviewParameter
{
    public int ReviewId { get; set; }

    public Review Review { get; set; } = null!;

    public int BalanceParameterId { get; set; }

    public BalanceParameter BalanceParameter { get; set; } = null!;

    /// <summary>valor_indicado: value the supervisor asks the new route to apply; in [0, 1] for a delivery type proportion.</summary>
    public decimal IndicatedValue { get; set; }
}
