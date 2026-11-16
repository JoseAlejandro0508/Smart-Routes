namespace Smart_Routes.Domain.Routing;

/// <summary>
/// Decides the visiting order of the stops of a route on a weighted graph.
/// </summary>
/// <remarks>
/// The graph is complete: node 0 is the start (the distribution center) and every other node is a stop.
/// The weight of edge [i, j] is the road cost of going from i to j (distance or time), and it can differ
/// from [j, i] because of one-way streets. The order is built with the nearest-neighbor heuristic and
/// then improved with 2-opt, which reverses segments while that lowers the total cost.
/// </remarks>
public static class StopSequencer
{
    private const int MaxImprovementRounds = 200;

    /// <summary>
    /// Computes a low-cost visiting order for nodes 1..n-1, starting from node 0.
    /// </summary>
    /// <param name="cost">Square cost matrix, indexed [from, to].</param>
    /// <param name="returnToStart">Whether the vehicle goes back to node 0 at the end.</param>
    /// <returns>The node indexes in visiting order, without node 0.</returns>
    public static IReadOnlyList<int> Sequence(double[,] cost, bool returnToStart)
    {
        var size = cost.GetLength(0);
        if (size != cost.GetLength(1))
        {
            throw new ArgumentException("The cost matrix must be square.", nameof(cost));
        }

        if (size <= 2)
        {
            return Enumerable.Range(1, Math.Max(0, size - 1)).ToList();
        }

        var order = NearestNeighbor(cost);
        return ImproveWithTwoOpt(order, cost, returnToStart);
    }

    /// <summary>
    /// Total cost of visiting the nodes in the given order, starting from node 0.
    /// </summary>
    /// <param name="order">Node indexes in visiting order, without node 0.</param>
    /// <param name="cost">Square cost matrix, indexed [from, to].</param>
    /// <param name="returnToStart">Whether the cost of going back to node 0 is included.</param>
    /// <returns>The sum of the edge costs along the path.</returns>
    public static double PathCost(IReadOnlyList<int> order, double[,] cost, bool returnToStart)
    {
        var total = 0d;
        var previous = 0;

        foreach (var node in order)
        {
            total += cost[previous, node];
            previous = node;
        }

        if (returnToStart && order.Count > 0)
        {
            total += cost[previous, 0];
        }

        return total;
    }

    private static List<int> NearestNeighbor(double[,] cost)
    {
        var size = cost.GetLength(0);
        var pending = new HashSet<int>(Enumerable.Range(1, size - 1));
        var order = new List<int>(size - 1);
        var current = 0;

        while (pending.Count > 0)
        {
            var next = pending.MinBy(node => (cost[current, node], node));
            order.Add(next);
            pending.Remove(next);
            current = next;
        }

        return order;
    }

    private static List<int> ImproveWithTwoOpt(List<int> order, double[,] cost, bool returnToStart)
    {
        var best = order;
        var bestCost = PathCost(best, cost, returnToStart);

        for (var round = 0; round < MaxImprovementRounds; round++)
        {
            var improved = false;

            for (var i = 0; i < best.Count - 1; i++)
            {
                for (var k = i + 1; k < best.Count; k++)
                {
                    var candidate = new List<int>(best);
                    candidate.Reverse(i, k - i + 1);

                    // The full cost is recomputed because the matrix may be asymmetric:
                    // reversing a segment also changes the cost of the edges inside it.
                    var candidateCost = PathCost(candidate, cost, returnToStart);
                    if (candidateCost + 1e-9 < bestCost)
                    {
                        best = candidate;
                        bestCost = candidateCost;
                        improved = true;
                    }
                }
            }

            if (!improved)
            {
                break;
            }
        }

        return best;
    }
}
