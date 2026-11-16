using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Smart_Routes.Infrastructure.Data.Configurations;

/// <summary>ADMINISTRADOR.</summary>
public class AdministratorConfiguration : UserProfileConfiguration<Administrator>
{
    public override void Configure(EntityTypeBuilder<Administrator> builder)
    {
        base.Configure(builder);

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Administrators_AccessLevel", DomainCheckConstraints.InEnum<AdminAccessLevels>("AccessLevel")));
    }
}

/// <summary>COORDINADOR_LOGISTICO.</summary>
public class LogisticsCoordinatorConfiguration : UserProfileConfiguration<LogisticsCoordinator>
{
    public override void Configure(EntityTypeBuilder<LogisticsCoordinator> builder)
    {
        base.Configure(builder);

        builder.Property(c => c.Specialty)
            .HasMaxLength(200)
            .IsRequired();
    }
}

/// <summary>REPARTIDOR.</summary>
public class DeliveryPersonConfiguration : UserProfileConfiguration<DeliveryPerson>
{
    public override void Configure(EntityTypeBuilder<DeliveryPerson> builder)
    {
        base.Configure(builder);

        builder.Property(d => d.Fleet)
            .HasMaxLength(100)
            .IsRequired();

        // edad >= 18 (informe 3.2), checked on the birth date when the row is inserted or updated.
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_DeliveryPersons_Adult", "DATEADD(year, 18, [DateOfBirth]) <= CAST(GETDATE() AS date)"));
    }
}

/// <summary>SUPERVISOR_OPERACIONES.</summary>
public class OperationsSupervisorConfiguration : UserProfileConfiguration<OperationsSupervisor>
{
    public override void Configure(EntityTypeBuilder<OperationsSupervisor> builder)
    {
        base.Configure(builder);

        builder.Property(s => s.ControlArea)
            .HasMaxLength(200)
            .IsRequired();
    }
}
