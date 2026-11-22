using NUnit.Framework;
using Shouldly;
using Smart_Routes.Application.Stops.Commands.UpdateStop;
using Smart_Routes.Application.Stops.Queries.GetStops;

namespace Smart_Routes.Application.UnitTests.Stops;

public class StopValidatorsTests
{
    private readonly UpdateStopCommandValidator _update = new();
    private readonly GetStopsQueryValidator _list = new();

    [Test]
    public void UpdateWithAddressAndZoneIsValid()
    {
        _update.Validate(new UpdateStopCommand { StopId = 4, Address = "Calle 23 y L", ZoneId = 2 }).IsValid.ShouldBeTrue();
    }

    [Test]
    public void UpdateWithBothCoordinatesIsValid()
    {
        _update.Validate(new UpdateStopCommand { StopId = 4, Address = "Calle 23 y L", ZoneId = 2, Latitude = 23.138, Longitude = -82.386 })
            .IsValid.ShouldBeTrue();
    }

    [TestCase(0, "Calle 23", 2)]
    [TestCase(4, "   ", 2)]
    [TestCase(4, "Calle 23", 0)]
    public void UpdateRejectsMissingData(int stopId, string address, int zoneId)
    {
        _update.Validate(new UpdateStopCommand { StopId = stopId, Address = address, ZoneId = zoneId }).IsValid.ShouldBeFalse();
    }

    [Test]
    public void UpdateRejectsOnlyOneCoordinate()
    {
        _update.Validate(new UpdateStopCommand { StopId = 4, Address = "Calle 23", ZoneId = 2, Latitude = 23.1 }).IsValid.ShouldBeFalse();
    }

    [Test]
    public void UpdateRejectsCoordinatesOutOfRange()
    {
        _update.Validate(new UpdateStopCommand { StopId = 4, Address = "Calle 23", ZoneId = 2, Latitude = 95, Longitude = -82.3 })
            .IsValid.ShouldBeFalse();
    }

    [Test]
    public void ListWithoutZoneOrWithAValidZoneIsValid()
    {
        _list.Validate(new GetStopsQuery()).IsValid.ShouldBeTrue();
        _list.Validate(new GetStopsQuery(3)).IsValid.ShouldBeTrue();
    }

    [Test]
    public void ListRejectsANonPositiveZone()
    {
        _list.Validate(new GetStopsQuery(0)).IsValid.ShouldBeFalse();
    }
}
