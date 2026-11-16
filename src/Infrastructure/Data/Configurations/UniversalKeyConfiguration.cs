using Smart_Routes.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Smart_Routes.Infrastructure.Data.Configurations;

/// <summary>
/// Row of the RK schema (informe 4.3): the key of the universal relation.
/// </summary>
/// <remarks>
/// RK has no meaning in the domain and the application never writes to it. It is part of the
/// design because, by Ullman's lemma, adding a schema that contains a key of the universal
/// relation is what gives the 3NF decomposition the lossless-join property.
/// </remarks>
public class UniversalKeyRow
{
    /// <summary>id_coordinador.</summary>
    public string CoordinatorId { get; set; } = string.Empty;

    /// <summary>id_centro.</summary>
    public int DistributionCenterId { get; set; }

    /// <summary>id_parametro.</summary>
    public int BalanceParameterId { get; set; }

    /// <summary>id_revision.</summary>
    public int ReviewId { get; set; }

    /// <summary>id_entrega.</summary>
    public int DeliveryRecordId { get; set; }

    /// <summary>id_reprogramacion.</summary>
    public int ReschedulingId { get; set; }
}

/// <summary>RK: table with the six-attribute key of the universal relation (informe 4.3).</summary>
public class UniversalKeyConfiguration : IEntityTypeConfiguration<UniversalKeyRow>
{
    public void Configure(EntityTypeBuilder<UniversalKeyRow> builder)
    {
        builder.ToTable("RK");

        builder.HasKey(k => new
        {
            k.CoordinatorId,
            k.DistributionCenterId,
            k.BalanceParameterId,
            k.ReviewId,
            k.DeliveryRecordId,
            k.ReschedulingId
        });

        builder.Property(k => k.CoordinatorId)
            .HasMaxLength(450);

        // Every attribute references the entity that owns it; deletes are restricted like the rest of the schema (3.4).
        builder.HasOne<LogisticsCoordinator>().WithMany().HasForeignKey(k => k.CoordinatorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<DistributionCenter>().WithMany().HasForeignKey(k => k.DistributionCenterId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<BalanceParameter>().WithMany().HasForeignKey(k => k.BalanceParameterId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Review>().WithMany().HasForeignKey(k => k.ReviewId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<DeliveryRecord>().WithMany().HasForeignKey(k => k.DeliveryRecordId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Rescheduling>().WithMany().HasForeignKey(k => k.ReschedulingId).OnDelete(DeleteBehavior.Restrict);
    }
}
