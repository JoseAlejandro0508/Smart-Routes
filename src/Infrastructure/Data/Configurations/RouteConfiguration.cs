using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Smart_Routes.Infrastructure.Data.Configurations;

/// <summary>RUTA.</summary>
public class RouteConfiguration : IEntityTypeConfiguration<Route>
{
    public void Configure(EntityTypeBuilder<Route> builder)
    {


        builder.Property(r => r.GeneratorCoordinatorId)
            .HasMaxLength(450);

        builder.Property(r => r.DeliveryPersonId)
            .HasMaxLength(450);

        builder.HasOne(r => r.GeneratorCoordinator)
            .WithMany(c => c.GeneratedRoutes)
            .HasForeignKey(r => r.GeneratorCoordinatorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.DistributionCenter)
            .WithMany(c => c.Routes)
            .HasForeignKey(r => r.DistributionCenterId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(r => r.BalanceCriterion)
            .WithMany(c => c.Routes)
            .HasForeignKey(r => r.BalanceCriterionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(r => r.DeliveryPerson)
            .WithMany(d => d.Routes)
            .HasForeignKey(r => r.DeliveryPersonId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // RECONFECCIONA: one-to-one, so EF creates a unique index on OriginReviewId,
        // filtered to non-null values (3.1: a review originates at most one new route).
        builder.HasOne(r => r.OriginReview)
            .WithOne(rv => rv.ReconfiguredRoute)
            .HasForeignKey<Route>(r => r.OriginReviewId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(t =>
        {

            // CreationDate was replaced by the audit column Created, so the check compares with it (3.3).
            t.HasCheckConstraint("CK_Routes_ScheduledDate", "CAST([ScheduledDate] AS date) >= CAST([Created] AS date)");
        });
    }
}

/// <summary>RUTA_PARAMETRO: criterion applied to a route.</summary>
/// <remarks>
/// Its configuration was removed when the applied values moved to <see cref="BalanceParameter"/>, but the table
/// is still in the model, and without a key EF Core cannot build it. The composite key keeps it valid.
/// </remarks>
public class RouteParameterConfiguration : IEntityTypeConfiguration<RouteParameter>
{
    public void Configure(EntityTypeBuilder<RouteParameter> builder)
    {
        builder.HasKey(rp => new { rp.RouteId, rp.BalanceCriterionId });

        builder.HasOne(rp => rp.Route)
            .WithMany()
            .HasForeignKey(rp => rp.RouteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rp => rp.BalanceCriterion)
            .WithMany()
            .HasForeignKey(rp => rp.BalanceCriterionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>RUTA_PEDIDO (ITEM_RUTA aggregation).</summary>
public class RouteOrderConfiguration : IEntityTypeConfiguration<RouteOrder>
{
    public void Configure(EntityTypeBuilder<RouteOrder> builder)
    {
        builder.HasKey(ro => new { ro.RouteId, ro.OrderId });

        // Deleting a route that was never reviewed removes its rows here (3.4).
        builder.HasOne(ro => ro.Route)
            .WithMany(r => r.RouteOrders)
            .HasForeignKey(ro => ro.RouteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ro => ro.Order)
            .WithMany(o => o.RouteOrders)
            .HasForeignKey(ro => ro.OrderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>RUTA_PARADA.</summary>
public class RouteStopConfiguration : IEntityTypeConfiguration<RouteStop>
{
    public void Configure(EntityTypeBuilder<RouteStop> builder)
    {
        builder.HasKey(rs => new { rs.RouteId, rs.StopId });

        builder.HasOne(rs => rs.Route)
            .WithMany(r => r.RouteStops)
            .HasForeignKey(rs => rs.RouteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rs => rs.Stop)
            .WithMany(s => s.RouteStops)
            .HasForeignKey(rs => rs.StopId)
            .OnDelete(DeleteBehavior.Restrict);

        // Alternate key (id_ruta, orden_visita): a visit position is not repeated within a route (3.1).
        builder.HasIndex(rs => new { rs.RouteId, rs.VisitOrder })
            .IsUnique();

        builder.ToTable(t => t.HasCheckConstraint("CK_RouteStops_VisitOrder", "[VisitOrder] >= 1"));
    }
}


/// <summary>REVISION.</summary>
public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.Property(r => r.Observations)
            .HasMaxLength(1000);

        builder.Property(r => r.SupervisorId)
            .HasMaxLength(450);

        builder.HasOne(r => r.Supervisor)
            .WithMany(s => s.Reviews)
            .HasForeignKey(r => r.SupervisorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Route)
            .WithMany(rt => rt.Reviews)
            .HasForeignKey(r => r.RouteId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasOne(r => r.BalanceCriterion)
            .WithMany(bc => bc.Reviews)
            .HasForeignKey(r => r.BalanceCriterioId)
            .OnDelete(DeleteBehavior.Restrict);


        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_Reviews_Observations",
                $"[Decision] <> {(int)ReviewDecision.Rejected} OR [Observations] IS NOT NULL");
            t.HasCheckConstraint(
                "CK_Reviews_Decision", DomainCheckConstraints.InEnum<ReviewDecision>("Decision"));
        });
    }
}

/// <summary>REVISION_PARAMETRO.</summary>
/*
public class ReviewParameterConfiguration : IEntityTypeConfiguration<ReviewParameter>
{
    public void Configure(EntityTypeBuilder<ReviewParameter> builder)
    {


        builder.Property(rp => rp.IndicatedValue)
            .HasPrecision(18, 4);

        builder.HasOne(rp => rp.Review)
            .WithMany(r => r.IndicatedParameters)
            .HasForeignKey(rp => rp.ReviewId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(rp => rp.BalanceParameter)
            .WithMany(p => p.ReviewParameters)
            .HasForeignKey(rp => rp.BalanceParameterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
*/

/// <summary>REVISION_PARAMETRO.</summary>
/// <remarks>
/// The previous configuration is commented out because <see cref="Review"/> no longer lists its parameters
/// (re-confection now points to a whole <see cref="BalanceCriterion"/>). The entity is still in the model
/// through <see cref="BalanceParameter.ReviewParameters"/>, so it needs a key for EF Core to build the model.
/// </remarks>
public class ReviewParameterKeyConfiguration : IEntityTypeConfiguration<ReviewParameter>
{
    public void Configure(EntityTypeBuilder<ReviewParameter> builder)
    {
        builder.HasKey(rp => new { rp.ReviewId, rp.BalanceParameterId });

        builder.Property(rp => rp.IndicatedValue)
            .HasPrecision(18, 4);

        builder.HasOne(rp => rp.Review)
            .WithMany()
            .HasForeignKey(rp => rp.ReviewId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(rp => rp.BalanceParameter)
            .WithMany(p => p.ReviewParameters)
            .HasForeignKey(rp => rp.BalanceParameterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>CRITERIO_EQUILIBRIO.</summary>
public class BalanceCriterionConfiguration : IEntityTypeConfiguration<BalanceCriterion>
{
    public void Configure(EntityTypeBuilder<BalanceCriterion> builder)
    {
        builder.Property(c => c.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(c => c.Description)
            .HasMaxLength(1000);

        builder.Property(c => c.AuthorCoordinatorId)
            .HasMaxLength(450);

        // Derived from the author, so it is not a column.
        builder.Ignore(c => c.IsPredefined);

        builder.HasOne(c => c.AuthorCoordinator)
            .WithMany(co => co.AuthoredCriteria)
            .HasForeignKey(c => c.AuthorCoordinatorId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>PARAMETRO.</summary>
public class BalanceParameterConfiguration : IEntityTypeConfiguration<BalanceParameter>
{
    public void Configure(EntityTypeBuilder<BalanceParameter> builder)
    {
        builder.Property(p => p.Name)
            .HasMaxLength(200)
            .IsRequired();

        // Proportions such as 0.3333 need four decimals.
        builder.Property(p => p.AppliedValue)
            .HasPrecision(18, 4);

        builder.HasOne(p => p.BalanceCriterion)
            .WithMany(c => c.Parameters)
            .HasForeignKey(p => p.BalanceCriterionId)
            .OnDelete(DeleteBehavior.Restrict);

        var proportion = (int)BalanceMetric.DeliveryTypeProportion;

        // tipo_entrega_objetivo is not null if and only if metrica = PROPORCION_TIPO (3.2).
        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_BalanceParameters_TargetDeliveryType",
                $"([Metric] = {proportion} AND [TargetDeliveryType] IS NOT NULL) OR " +
                $"([Metric] <> {proportion} AND [TargetDeliveryType] IS NULL)");
            t.HasCheckConstraint(
                "CK_BalanceParameters_Metric", DomainCheckConstraints.InEnum<BalanceMetric>("Metric"));
            t.HasCheckConstraint(
                "CK_BalanceParameters_Operator", DomainCheckConstraints.InEnum<ComparisonOperator>("Operator"));
            t.HasCheckConstraint(
                "CK_BalanceParameters_TargetDeliveryTypeDomain",
                DomainCheckConstraints.InEnum<DeliveryType>("TargetDeliveryType", nullable: true));

            // valor_aplicado in [0, 1] when the metric is a proportion (3.2). Since PR #53 the value lives
            // in this table, so the rule no longer needs a trigger.
            t.HasCheckConstraint(
                "CK_BalanceParameters_ProportionRange",
                $"[Metric] <> {proportion} OR ([AppliedValue] >= 0 AND [AppliedValue] <= 1)");
        });
    }
}
