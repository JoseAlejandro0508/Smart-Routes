using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Smart_Routes.Infrastructure.Data.Configurations;

/// <summary>PARADA.</summary>
public class StopConfiguration : IEntityTypeConfiguration<Stop>
{
    public void Configure(EntityTypeBuilder<Stop> builder)
    {
        builder.Property(s => s.Address)
            .HasMaxLength(300)
            .IsRequired();

        builder.HasOne(s => s.Zone)
            .WithMany(z => z.Stops)
            .HasForeignKey(s => s.ZoneId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>PEDIDO.</summary>
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.Property(o => o.Description)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(o => o.WeightKg)
            .HasPrecision(10, 2);

        builder.Property(o => o.EntryCoordinatorId)
            .HasMaxLength(450);

        builder.HasOne(o => o.EntryCoordinator)
            .WithMany(c => c.EnteredOrders)
            .HasForeignKey(o => o.EntryCoordinatorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.DistributionCenter)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.DistributionCenterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Stop)
            .WithMany(s => s.Orders)
            .HasForeignKey(o => o.StopId)
            .OnDelete(DeleteBehavior.Restrict);

        // Duplicate prevention (RF-17, 3.1): same center, stop, delivery type, description and entry day.
        builder.HasIndex(o => new { o.DistributionCenterId, o.StopId, o.DeliveryType, o.Description, o.EntryDate })
            .IsUnique();

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Orders_WeightKg", "[WeightKg] > 0");
            t.HasCheckConstraint("CK_Orders_DeadlineAt", "CAST([DeadlineAt] AS date) >= [EntryDate]");
        });
    }
}

/// <summary>REGISTRO_ENTREGA.</summary>
public class DeliveryRecordConfiguration : IEntityTypeConfiguration<DeliveryRecord>
{
    public void Configure(EntityTypeBuilder<DeliveryRecord> builder)
    {
        builder.Property(d => d.Observations)
            .HasMaxLength(1000);

        // Composite FK to RUTA_PEDIDO (3.4): attempts can only be recorded for orders that belong to the route.
        // Being one-to-one, EF creates the unique index on (RouteId, OrderId) required by 3.1.
        builder.HasOne(d => d.RouteOrder)
            .WithOne(ro => ro.DeliveryRecord)
            .HasForeignKey<DeliveryRecord>(d => new { d.RouteId, d.OrderId })
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>REPROGRAMACION.</summary>
public class ReschedulingConfiguration : IEntityTypeConfiguration<Rescheduling>
{
    public void Configure(EntityTypeBuilder<Rescheduling> builder)
    {
        builder.Property(r => r.Reason)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(r => r.ResolverCoordinatorId)
            .HasMaxLength(450);

        // Composite FK to RUTA_PEDIDO; unique, so at most one request per order-in-route (3.1).
        builder.HasOne(r => r.RouteOrder)
            .WithOne(ro => ro.Rescheduling)
            .HasForeignKey<Rescheduling>(r => new { r.RouteId, r.OrderId })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ResolverCoordinator)
            .WithMany(c => c.AssignedReschedulings)
            .HasForeignKey(r => r.ResolverCoordinatorId)
            .OnDelete(DeleteBehavior.Restrict);

        var resolved = (int)ReschedulingStatus.Resolved;

        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_Reschedulings_Resolution",
                $"([Status] = {resolved} AND [ManualResult] IS NOT NULL AND [ResolutionDate] IS NOT NULL) OR " +
                $"([Status] <> {resolved} AND [ManualResult] IS NULL AND [ResolutionDate] IS NULL)");
            t.HasCheckConstraint(
                "CK_Reschedulings_ResolutionDate",
                "[ResolutionDate] IS NULL OR [ResolutionDate] > [RequestDate]");
        });
    }
}
