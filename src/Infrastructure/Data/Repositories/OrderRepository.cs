using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Smart_Routes.Infrastructure.Data.Repositories;

/// <summary>EF Core implementation of order persistence operations.</summary>
public sealed class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;

    public OrderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<bool> IsCoordinatorAuthorizedForCenterAsync(
        string coordinatorId,
        int centerId,
        CancellationToken cancellationToken)
    {
        return _context.CoordinatorCenters.AnyAsync(
            assignment => assignment.CoordinatorId == coordinatorId
                && assignment.DistributionCenterId == centerId,
            cancellationToken);
    }

    public Task<int?> GetStopZoneIdAsync(int stopId, CancellationToken cancellationToken)
    {
        return _context.Stops
            .Where(stop => stop.Id == stopId)
            .Select(stop => (int?)stop.ZoneId)
            .SingleOrDefaultAsync(cancellationToken);
    }

    public Task<bool> DoesCenterCoverZoneAsync(int centerId, int zoneId, CancellationToken cancellationToken)
    {
        return _context.CenterZones.AnyAsync(
            coverage => coverage.DistributionCenterId == centerId && coverage.ZoneId == zoneId,
            cancellationToken);
    }

    public Task<bool> ExistsAsync(
        int centerId,
        int stopId,
        DeliveryType deliveryType,
        string description,
        DateOnly entryDate,
        CancellationToken cancellationToken)
    {
        return _context.Orders.AnyAsync(order =>
            order.DistributionCenterId == centerId
                && order.StopId == stopId
                && order.DeliveryType == deliveryType
                && order.Description == description
                && order.EntryDate == entryDate,
            cancellationToken);
    }

    public void Add(Order order)
    {
        _context.Orders.Add(order);
    }

    public Task<Order?> GetByIdAsync(int orderId, CancellationToken cancellationToken)
    {
        return _context.Orders.SingleOrDefaultAsync(order => order.Id == orderId, cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}