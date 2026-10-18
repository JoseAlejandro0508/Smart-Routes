using Smart_Routes.Domain.Common;
using Smart_Routes.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Smart_Routes.Infrastructure.Data.Configurations;

/// <summary>
/// Configuración común a los subtipos de USUARIO: la clave primaria es a la vez clave foránea
/// hacia la tabla de usuarios de Identity (relación 1:1 de la jerarquía ISA).
/// </summary>
public abstract class UserProfileConfiguration<TProfile> : IEntityTypeConfiguration<TProfile>
    where TProfile : BaseUserProfile
{
    public virtual void Configure(EntityTypeBuilder<TProfile> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasMaxLength(450)
            .ValueGeneratedNever();

        // Los usuarios no se eliminan, se desactivan (sección 3.4).
        builder.HasOne<ApplicationUser>()
            .WithOne()
            .HasForeignKey<TProfile>(p => p.Id)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
