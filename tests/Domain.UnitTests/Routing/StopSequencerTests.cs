using NUnit.Framework;
using Shouldly;
using Smart_Routes.Domain.Routing;

namespace Smart_Routes.Domain.UnitTests.Routing;

public class StopSequencerTests
{
    [Test]
    public void SequenceVisitsEveryStopExactlyOnce()
    {
        var cost = MatrixFromLine(0, 5, 2, 9, 4);

        var order = StopSequencer.Sequence(cost, returnToStart: true);

        order.OrderBy(i => i).ShouldBe([1, 2, 3, 4]);
    }

    [Test]
    public void SequenceFollowsTheLineFromTheStart()
    {
        // Points on a straight road: the start at 0 and stops at 5, 2, 9 and 4 km.
        var cost = MatrixFromLine(0, 5, 2, 9, 4);

        var order = StopSequencer.Sequence(cost, returnToStart: false);

        // Without going back, the cheapest open path visits them from nearest to farthest.
        order.ShouldBe([2, 4, 1, 3]);
    }

    [Test]
    public void TwoOptRemovesCrossingsOfNearestNeighbor()
    {
        // Square with the start at a corner. Nearest neighbor goes to the closest corner first
        // and can cross the square; 2-opt must leave the perimeter, whose cost is 4.
        var points = new[] { (0d, 0d), (0d, 1d), (1d, 1d), (1d, 0d) };
        var cost = Euclidean(points);

        var order = StopSequencer.Sequence(cost, returnToStart: true);

        StopSequencer.PathCost(order, cost, returnToStart: true).ShouldBe(4, tolerance: 1e-9);
    }

    [Test]
    public void SequenceRespectsOneWayCosts()
    {
        // From the start it is cheap to go 0 -> 1 -> 2, but 0 -> 2 -> 1 is expensive.
        var cost = new double[,]
        {
            { 0, 1, 1 },
            { 9, 0, 1 },
            { 1, 9, 0 }
        };

        var order = StopSequencer.Sequence(cost, returnToStart: true);

        order.ShouldBe([1, 2]);
        StopSequencer.PathCost(order, cost, returnToStart: true).ShouldBe(3);
    }

    [TestCase(1)]
    [TestCase(2)]
    public void SequenceHandlesTinyMatrices(int size)
    {
        var order = StopSequencer.Sequence(new double[size, size], returnToStart: true);

        order.Count.ShouldBe(size - 1);
    }

    [Test]
    public void SequenceRejectsNonSquareMatrices()
    {
        Should.Throw<ArgumentException>(() => StopSequencer.Sequence(new double[2, 3], returnToStart: true));
    }

    private static double[,] MatrixFromLine(params double[] positions)
    {
        var size = positions.Length;
        var cost = new double[size, size];
        for (var i = 0; i < size; i++)
        {
            for (var j = 0; j < size; j++)
            {
                cost[i, j] = Math.Abs(positions[i] - positions[j]);
            }
        }

        return cost;
    }

    private static double[,] Euclidean((double X, double Y)[] points)
    {
        var size = points.Length;
        var cost = new double[size, size];
        for (var i = 0; i < size; i++)
        {
            for (var j = 0; j < size; j++)
            {
                var dx = points[i].X - points[j].X;
                var dy = points[i].Y - points[j].Y;
                cost[i, j] = Math.Sqrt(dx * dx + dy * dy);
            }
        }

        return cost;
    }
}
