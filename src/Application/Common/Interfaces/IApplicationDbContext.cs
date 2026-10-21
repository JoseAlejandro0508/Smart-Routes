using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<TodoList> TodoLists { get; }

    DbSet<TodoItem> TodoItems { get; }

    DbSet<Administrator> Administrators { get; }

    DbSet<LogisticsCoordinator> LogisticsCoordinators { get; }

    DbSet<DeliveryPerson> DeliveryPersons { get; }

    DbSet<OperationsSupervisor> OperationsSupervisors { get; }

    DbSet<DistributionCenter> DistributionCenters { get; }

    DbSet<Zone> Zones { get; }

    DbSet<CenterZone> CenterZones { get; }

    DbSet<CoordinatorCenter> CoordinatorCenters { get; }

    DbSet<DeliveryPersonCenter> DeliveryPersonCenters { get; }

    DbSet<Stop> Stops { get; }

    DbSet<Order> Orders { get; }

    DbSet<BalanceCriterion> BalanceCriteria { get; }

    DbSet<Route> Routes { get; }

    DbSet<RouteStop> RouteStops { get; }

    DbSet<BalanceParameter> BalanceParameters { get; }

    DbSet<RouteOrder> RouteOrders { get; }

    DbSet<RouteParameter> RouteParameters { get; }

    DbSet<Review> Reviews { get; }

    DbSet<ReviewParameter> ReviewParameters { get; }

    DbSet<DeliveryRecord> DeliveryRecords { get; }

    DbSet<Rescheduling> Reschedulings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
