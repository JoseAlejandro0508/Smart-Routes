using System.Reflection;
using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Smart_Routes.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<TodoList> TodoLists => Set<TodoList>();

    public DbSet<TodoItem> TodoItems => Set<TodoItem>();

    public DbSet<Administrator> Administrators => Set<Administrator>();

    public DbSet<LogisticsCoordinator> LogisticsCoordinators => Set<LogisticsCoordinator>();

    public DbSet<DeliveryPerson> DeliveryPersons => Set<DeliveryPerson>();

    public DbSet<OperationsSupervisor> OperationsSupervisors => Set<OperationsSupervisor>();

    public DbSet<DistributionCenter> DistributionCenters => Set<DistributionCenter>();

    public DbSet<Zone> Zones => Set<Zone>();

    public DbSet<CenterZone> CenterZones => Set<CenterZone>();

    public DbSet<CoordinatorCenter> CoordinatorCenters => Set<CoordinatorCenter>();

    public DbSet<DeliveryPersonCenter> DeliveryPersonCenters => Set<DeliveryPersonCenter>();

    public DbSet<Stop> Stops => Set<Stop>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<BalanceCriterion> BalanceCriteria => Set<BalanceCriterion>();

    public DbSet<Route> Routes => Set<Route>();

    public DbSet<RouteStop> RouteStops => Set<RouteStop>();

    public DbSet<RouteCriterion> RouteCriteria => Set<RouteCriterion>();

    public DbSet<DeliveryRecord> DeliveryRecords => Set<DeliveryRecord>();

    public DbSet<Rescheduling> Reschedulings => Set<Rescheduling>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
