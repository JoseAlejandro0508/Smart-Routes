using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.Common.Interfaces;
public interface IRouteGenerator
{
    public Task GenerateAsync(int RouteId, CancellationToken cancellationToken);
    public Task RegenerateAsync(int ReviewId, CancellationToken cancellationToken);
}