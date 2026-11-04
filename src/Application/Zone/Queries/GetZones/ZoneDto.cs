using Smart_Routes.Domain.Entities;
namespace Smart_Routes.Application.Zones.Queries.GetZones;
public class ZoneDto
{
    public int Id { get; init; }

    public string? Name { get; init; }
    private class Mapping : Profile
    {
        public Mapping()
        {
            CreateMap<Zone, ZoneDto>();
        }
    }

}