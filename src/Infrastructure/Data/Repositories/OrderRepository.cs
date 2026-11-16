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

    public Task<Stop?> GetStopByIdAsync(int stopId, CancellationToken cancellationToken)
    {
        return _context.Stops.SingleOrDefaultAsync(stop => stop.Id == stopId, cancellationToken);
    }

    public Task<Stop?> GetStopByAddressAndZoneAsync(string address, int zoneId, CancellationToken cancellationToken)
    {
        return _context.Stops
            .OrderBy(stop => stop.Id)
            .FirstOrDefaultAsync(
                stop => stop.Address == address && stop.ZoneId == zoneId,
                cancellationToken);
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
        return _context.Orders
            .Include(order => order.DistributionCenter)
            .Include(order => order.Stop)
                .ThenInclude(stop => stop.Zone)
            .SingleOrDefaultAsync(order => order.Id == orderId, cancellationToken);
    }

    public async Task<(IReadOnlyList<Order> Orders, int TotalCount)> GetForCoordinatorAsync(
        string coordinatorId,
        int? centerId,
        int? zoneId,
        DeliveryType? deliveryType,
        OrderPriority? priority,
        OrderStatus? status,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = _context.Orders
            .AsNoTracking()
            .Where(order => _context.CoordinatorCenters.Any(assignment =>
                assignment.CoordinatorId == coordinatorId
                    && assignment.DistributionCenterId == order.DistributionCenterId));

        if (centerId.HasValue)
        {
            query = query.Where(order => order.DistributionCenterId == centerId.Value);
        }

        if (zoneId.HasValue)
        {
            query = query.Where(order => order.Stop.ZoneId == zoneId.Value);
        }

        if (deliveryType.HasValue)
        {
            query = query.Where(order => order.DeliveryType == deliveryType.Value);
        }

        if (priority.HasValue)
        {
            query = query.Where(order => order.Priority == priority.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(order => order.Status == status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var offset = (int)Math.Min((long)(pageNumber - 1) * pageSize, int.MaxValue);
        var orders = await query
            .Include(order => order.DistributionCenter)
            .Include(order => order.Stop)
                .ThenInclude(stop => stop.Zone)
            .OrderBy(order => order.Id)
            .Skip(offset)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (orders, totalCount);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}