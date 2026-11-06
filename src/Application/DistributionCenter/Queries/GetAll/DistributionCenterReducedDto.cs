using Smart_Routes.Domain.Entities;

namespace Smart_Routes.Application.DistributionCenters.Queries.GetAll;
public class DistributionCenterReducedDto
{
    public int Id { get; init; }
    public string? Name { get; init; }
    public string? LogisticsProgram { get; init; } 
    private class Mapping : Profile
    {
        public Mapping()
        {
            CreateMap<DistributionCenter, DistributionCenterReducedDto>();
        }
    }
}