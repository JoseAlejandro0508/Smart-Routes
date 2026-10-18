using Smart_Routes.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Smart_Routes.Infrastructure.Data.Configurations;

/// <summary>RUTA.</summary>
public class RouteConfiguration : IEntityTypeConfiguration<Route>
{
    public void Configure(EntityTypeBuilder<Route> builder)
    {
        builder.Property(r => r.VehicleCapacity)
            .HasPrecision(10, 2);

        builder.Property(r => r.CoordinatorId)
            .HasMaxLength(450);

        builder.Property(r => r.SupervisorId)
            .HasMaxLength(450);

        builder.Property(r => r.DeliveryPersonId)
            .HasMaxLength(450);

        builder.HasOne(r => r.Coordinator)
            .WithMany(c => c.GeneratedRoutes)
            .HasForeignKey(r => r.CoordinatorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.DistributionCenter)
            .WithMany(c => c.Routes)
            .HasForeignKey(r => r.DistributionCenterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Supervisor)
            .WithMany(s => s.ReviewedRoutes)
            .HasForeignKey(r => r.SupervisorId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.DeliveryPerson)
            .WithMany(d => d.Routes)
            .HasForeignKey(r => r.DeliveryPersonId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // Restricciones temporales y semánticas de la sección 3 expresables en la propia tabla.
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Routes_VehicleCapacity", "[VehicleCapacity] > 0");
            t.HasCheckConstraint("CK_Routes_ValidationDate", "[ValidationDate] IS NULL OR [ValidationDate] > [CreationDate]");
            t.HasCheckConstraint("CK_Routes_ScheduledDate", "[ScheduledDate] >= CAST([CreationDate] AS date)");
        });
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
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(rs => rs.Stop)
            .WithMany(s => s.RouteStops)
            .HasForeignKey(rs => rs.StopId)
            .OnDelete(DeleteBehavior.Restrict);

        // Dentro de una misma ruta, orden_visita no se repite (3.1).
        builder.HasIndex(rs => new { rs.RouteId, rs.VisitOrder })
            .IsUnique();

        builder.ToTable(t => t.HasCheckConstraint("CK_RouteStops_VisitOrder", "[VisitOrder] > 0"));
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
    }
}

/// <summary>RUTA_CRITERIO.</summary>
public class RouteCriterionConfiguration : IEntityTypeConfiguration<RouteCriterion>
{
    public void Configure(EntityTypeBuilder<RouteCriterion> builder)
    {
        builder.HasKey(rc => new { rc.RouteId, rc.BalanceCriterionId });

        builder.Property(rc => rc.ConfigurationParameters)
            .IsRequired();

        builder.HasOne(rc => rc.Route)
            .WithMany(r => r.RouteCriteria)
            .HasForeignKey(rc => rc.RouteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(rc => rc.BalanceCriterion)
            .WithMany(c => c.RouteCriteria)
            .HasForeignKey(rc => rc.BalanceCriterionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
