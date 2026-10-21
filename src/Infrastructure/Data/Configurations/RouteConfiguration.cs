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
        builder.Property(r => r.VehicleCapacityKg)
            .HasPrecision(10, 2);

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
            t.HasCheckConstraint("CK_Routes_VehicleCapacityKg", "[VehicleCapacityKg] > 0");
            t.HasCheckConstraint("CK_Routes_ScheduledDate", "[ScheduledDate] >= CAST([CreationDate] AS date)");
        });
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

/// <summary>RUTA_PARAMETRO.</summary>
public class RouteParameterConfiguration : IEntityTypeConfiguration<RouteParameter>
{
    public void Configure(EntityTypeBuilder<RouteParameter> builder)
    {
        builder.HasKey(rp => new { rp.RouteId, rp.BalanceParameterId });

        builder.Property(rp => rp.AppliedValue)
            .HasPrecision(18, 4);

        builder.HasOne(rp => rp.Route)
            .WithMany(r => r.RouteParameters)
            .HasForeignKey(rp => rp.RouteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rp => rp.BalanceParameter)
            .WithMany(p => p.RouteParameters)
            .HasForeignKey(rp => rp.BalanceParameterId)
            .OnDelete(DeleteBehavior.Restrict);
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

        // Reviews of the same route have distinct dates, so the latest one is well defined (3.3).
        builder.HasIndex(r => new { r.RouteId, r.ReviewedAt })
            .IsUnique();

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Reviews_Observations",
            $"[Decision] <> {(int)ReviewDecision.Rejected} OR [Observations] IS NOT NULL"));
    }
}

/// <summary>REVISION_PARAMETRO.</summary>
public class ReviewParameterConfiguration : IEntityTypeConfiguration<ReviewParameter>
{
    public void Configure(EntityTypeBuilder<ReviewParameter> builder)
    {
        builder.HasKey(rp => new { rp.ReviewId, rp.BalanceParameterId });

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

        builder.HasOne(p => p.BalanceCriterion)
            .WithMany(c => c.Parameters)
            .HasForeignKey(p => p.BalanceCriterionId)
            .OnDelete(DeleteBehavior.Restrict);

        var proportion = (int)BalanceMetric.DeliveryTypeProportion;

        // tipo_entrega_objetivo is not null if and only if metrica = PROPORCION_TIPO (3.2).
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_BalanceParameters_TargetDeliveryType",
            $"([Metric] = {proportion} AND [TargetDeliveryType] IS NOT NULL) OR " +
            $"([Metric] <> {proportion} AND [TargetDeliveryType] IS NULL)"));
    }
}
