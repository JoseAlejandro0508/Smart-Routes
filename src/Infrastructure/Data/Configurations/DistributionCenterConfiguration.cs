using Smart_Routes.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Smart_Routes.Infrastructure.Data.Configurations;

/// <summary>CENTRO_DISTRIBUCION.</summary>
public class DistributionCenterConfiguration : IEntityTypeConfiguration<DistributionCenter>
{
    public void Configure(EntityTypeBuilder<DistributionCenter> builder)
    {
        builder.Property(c => c.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(c => c.LogisticsProgram)
            .HasMaxLength(200)
            .IsRequired();
    }
}

/// <summary>ZONA.</summary>
public class ZoneConfiguration : IEntityTypeConfiguration<Zone>
{
    public void Configure(EntityTypeBuilder<Zone> builder)
    {
        builder.Property(z => z.Name)
            .HasMaxLength(200)
            .IsRequired();
    }
}

/// <summary>CENTRO_ZONA.</summary>
public class CenterZoneConfiguration : IEntityTypeConfiguration<CenterZone>
{
    public void Configure(EntityTypeBuilder<CenterZone> builder)
    {
        builder.HasKey(cz => new { cz.DistributionCenterId, cz.ZoneId });

        builder.HasOne(cz => cz.DistributionCenter)
            .WithMany(c => c.CoveredZones)
            .HasForeignKey(cz => cz.DistributionCenterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cz => cz.Zone)
            .WithMany(z => z.CoveringCenters)
            .HasForeignKey(cz => cz.ZoneId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>COORDINADOR_CENTRO.</summary>
public class CoordinatorCenterConfiguration : IEntityTypeConfiguration<CoordinatorCenter>
{
    public void Configure(EntityTypeBuilder<CoordinatorCenter> builder)
    {
        builder.HasKey(cc => new { cc.CoordinatorId, cc.DistributionCenterId });

        builder.Property(cc => cc.CoordinatorId)
            .HasMaxLength(450);

        builder.HasOne(cc => cc.Coordinator)
            .WithMany(c => c.AuthorizedCenters)
            .HasForeignKey(cc => cc.CoordinatorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cc => cc.DistributionCenter)
            .WithMany(c => c.AuthorizedCoordinators)
            .HasForeignKey(cc => cc.DistributionCenterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>REPARTIDOR_CENTRO.</summary>
public class DeliveryPersonCenterConfiguration : IEntityTypeConfiguration<DeliveryPersonCenter>
{
    public void Configure(EntityTypeBuilder<DeliveryPersonCenter> builder)
    {
        builder.HasKey(dc => new { dc.DeliveryPersonId, dc.DistributionCenterId });

        builder.Property(dc => dc.DeliveryPersonId)
            .HasMaxLength(450);

        builder.HasOne(dc => dc.DeliveryPerson)
            .WithMany(d => d.AssignedCenters)
            .HasForeignKey(dc => dc.DeliveryPersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(dc => dc.DistributionCenter)
            .WithMany(c => c.AssignedDeliveryPersons)
            .HasForeignKey(dc => dc.DistributionCenterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
