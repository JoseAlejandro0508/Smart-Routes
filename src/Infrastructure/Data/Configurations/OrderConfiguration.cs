using Smart_Routes.Domain.Entities;
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

        builder.Property(o => o.CoordinatorId)
            .HasMaxLength(450);

        builder.HasOne(o => o.Coordinator)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CoordinatorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.DistributionCenter)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.DistributionCenterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Stop)
            .WithMany(s => s.Orders)
            .HasForeignKey(o => o.StopId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Route)
            .WithMany(r => r.Orders)
            .HasForeignKey(o => o.RouteId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // Antiduplicados (RF-18). La combinación es la de ejemplo del informe (3.1):
        // ajustarla cuando el administrador fije la regla de negocio definitiva.
        builder.HasIndex(o => new { o.DistributionCenterId, o.StopId, o.DeliveryType, o.Description })
            .IsUnique();
    }
}

/// <summary>REGISTRO_ENTREGA.</summary>
public class DeliveryRecordConfiguration : IEntityTypeConfiguration<DeliveryRecord>
{
    public void Configure(EntityTypeBuilder<DeliveryRecord> builder)
    {
        builder.Property(d => d.Observations)
            .HasMaxLength(1000);

        // 1:0..1 con PEDIDO: el índice único sobre OrderId lo genera EF por ser uno a uno.
        builder.HasOne(d => d.Order)
            .WithOne(o => o.DeliveryRecord)
            .HasForeignKey<DeliveryRecord>(d => d.OrderId)
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

        builder.Property(r => r.DeliveryPersonId)
            .HasMaxLength(450);

        builder.Property(r => r.CoordinatorId)
            .HasMaxLength(450);

        // 1:0..1 con REGISTRO_ENTREGA: cada entrega genera como máximo una reprogramación.
        builder.HasOne(r => r.DeliveryRecord)
            .WithOne(d => d.Rescheduling)
            .HasForeignKey<Rescheduling>(r => r.DeliveryRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.DeliveryPerson)
            .WithMany(d => d.RequestedReschedulings)
            .HasForeignKey(r => r.DeliveryPersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Coordinator)
            .WithMany(c => c.AssignedReschedulings)
            .HasForeignKey(r => r.CoordinatorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Reschedulings_ResolutionDate",
            "[ResolutionDate] IS NULL OR [ResolutionDate] > [RequestDate]"));
    }
}
