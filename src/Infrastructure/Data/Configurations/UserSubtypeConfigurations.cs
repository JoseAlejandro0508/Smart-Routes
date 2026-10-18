using Smart_Routes.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Smart_Routes.Infrastructure.Data.Configurations;

/// <summary>ADMINISTRADOR.</summary>
public class AdministratorConfiguration : UserProfileConfiguration<Administrator>
{
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
