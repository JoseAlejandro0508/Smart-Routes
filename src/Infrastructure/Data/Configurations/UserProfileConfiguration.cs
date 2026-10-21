using Smart_Routes.Domain.Common;
using Smart_Routes.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Smart_Routes.Infrastructure.Data.Configurations;

/// <summary>
/// Shared configuration for the USUARIO subtypes: the primary key is also a foreign key
/// to the Identity users table (1:1 relationship of the ISA hierarchy).
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

        // Users are never deleted, only deactivated (section 3.4).
        builder.HasOne<ApplicationUser>()
            .WithOne()
            .HasForeignKey<TProfile>(p => p.Id)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
