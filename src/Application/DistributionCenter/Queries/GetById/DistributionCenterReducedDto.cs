namespace Smart_Routes.Application.DistributionCenters.Queries.GetById;

public class DistributionCenterExtendedDto
{
    public int Id { get; init; }
    public string? Name { get; init; }
    public string? LogisticsProgram { get; init; }
    public IList<int>? CoveredZones { get; set; }
    public IList<string>? AuthorizedCoordinators { get; set; }
    public IList<string>? AssignedDeliveryPersons { get; set; }
    public IList<int>? Orders { get; set; }
    public IList<int>? Routes { get; set; }


}
