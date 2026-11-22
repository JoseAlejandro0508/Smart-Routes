using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Domain.Enums;
using Smart_Routes.Domain.ValueObjects;
using Smart_Routes.Infrastructure.Identity;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Smart_Routes.Infrastructure.Data;

public static class InitialiserExtensions
{
    public static async Task InitialiseDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var initialiser = scope.ServiceProvider.GetRequiredService<ApplicationDbContextInitialiser>();

        await initialiser.InitialiseAsync();
        await initialiser.SeedAsync();
    }
}

public class ApplicationDbContextInitialiser
{
    private readonly ILogger<ApplicationDbContextInitialiser> _logger;
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public ApplicationDbContextInitialiser(ILogger<ApplicationDbContextInitialiser> logger, ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _logger = logger;
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task InitialiseAsync()
    {
        try
        {
            // Applies the pending migrations and keeps the data between runs.
            // Recreating the database on every start (EnsureDeleted + EnsureCreated) lost all data
            // and skipped the migrations, so the schema used in development was not the one deployed.
            await _context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while initialising the database.");
            throw;
        }
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedAsync();
            await SeedDemoDataAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    public async Task TrySeedAsync()
    {

        // Default roles
        var RoleList = new List<IdentityRole>
        {
            new IdentityRole(Roles.Administrator),
            new IdentityRole(Roles.LogisticsCoordinator),
            new IdentityRole(Roles.OperationsSupervisor),
            new IdentityRole(Roles.DeliveryPerson)
        };
        foreach (var role in RoleList)
        {
            if (_roleManager.Roles.All(r => r.Name != role.Name))
            {
                await _roleManager.CreateAsync(role);
            }

        }


        // Default users
        var administrator = new ApplicationUser { UserName = "administrator@localhost", Email = "administrator@localhost" };

        if (_userManager.Users.All(u => u.UserName != administrator.UserName))
        {
            await _userManager.CreateAsync(administrator, "Administrator1!");
            if (!string.IsNullOrWhiteSpace(Roles.Administrator))
            {
         
                await _userManager.AddToRolesAsync(administrator, new[] { Roles.Administrator });
            }
        }

        // Default data
        // Seed, if necessary
        if (!_context.TodoLists.Any())
        {
            _context.TodoLists.Add(new TodoList
            {
                Title = "Tasks",
                Colour = Colour.Green,
                Items =
                {
                    new TodoItem { Title = "Make a todo list 📃" },
                    new TodoItem { Title = "Check off the first item ✅" },
                    new TodoItem { Title = "Realise you've already done two things on the list! 🤯"},
                    new TodoItem { Title = "Reward yourself with a nice, long nap 🏆" },
                }
            });

            await _context.SaveChangesAsync();
        }
    }

    private async Task SeedDemoDataAsync()
    {
        var ana = await EnsureUserAsync("Ana", "Demo", "ana@demo.dev", "Password123!", Roles.LogisticsCoordinator);
        var carlos = await EnsureUserAsync("Carlos", "Demo", "carlos@demo.dev", "Password123!", Roles.Administrator);
        var sofia = await EnsureUserAsync("Sofía", "Demo", "sofia@demo.dev", "Password123!", Roles.OperationsSupervisor);
        var marco = await EnsureUserAsync("Marco", "Demo", "marco@demo.dev", "Password123!", Roles.DeliveryPerson);

        if (!_context.Administrators.Any(profile => profile.Id == carlos.Id))
        {
            _context.Administrators.Add(new Administrator { Id = carlos.Id, AccessLevel = AdminAccessLevels.Total });
        }

        if (!_context.LogisticsCoordinators.Any(profile => profile.Id == ana.Id))
        {
            _context.LogisticsCoordinators.Add(new LogisticsCoordinator { Id = ana.Id, Specialty = "Coordinación urbana" });
        }

        if (!_context.OperationsSupervisors.Any(profile => profile.Id == sofia.Id))
        {
            _context.OperationsSupervisors.Add(new OperationsSupervisor { Id = sofia.Id, ControlArea = "Centro Habana" });
        }

        if (!_context.DeliveryPersons.Any(profile => profile.Id == marco.Id))
        {
            _context.DeliveryPersons.Add(new DeliveryPerson
            {
                Id = marco.Id,
                DateOfBirth = new DateOnly(1995, 5, 20),
                Fleet = "Flota Centro"
            });
        }

        await _context.SaveChangesAsync();

        if (await _context.Zones.AnyAsync())
        {
            return;
        }

        var centro = new Zone { Name = "Centro" };
        var vedado = new Zone { Name = "Vedado" };
        var plaza = new Zone { Name = "Plaza" };
        _context.Zones.AddRange(centro, vedado, plaza);
        await _context.SaveChangesAsync();

        var center = new DistributionCenter
        {
            Name = "Centro Habana",
            LogisticsProgram = "Programa urbano",
            X = -82.374,
            Y = 23.132
        };
        center.CoveredZones.Add(new CenterZone { ZoneId = centro.Id });
        center.CoveredZones.Add(new CenterZone { ZoneId = vedado.Id });
        center.CoveredZones.Add(new CenterZone { ZoneId = plaza.Id });
        _context.DistributionCenters.Add(center);
        await _context.SaveChangesAsync();

        _context.CoordinatorCenters.Add(new CoordinatorCenter { CoordinatorId = ana.Id, DistributionCenterId = center.Id });
        _context.DeliveryPersonCenters.Add(new DeliveryPersonCenter { DeliveryPersonId = marco.Id, DistributionCenterId = center.Id });
        await _context.SaveChangesAsync();

        var stopCentro = new Stop { Address = "Calle 23 #456", ZoneId = centro.Id, X = -82.381, Y = 23.136 };
        var stopVedado = new Stop { Address = "Avenida 5ta #120", ZoneId = vedado.Id, X = -82.389, Y = 23.128 };
        var stopPlaza = new Stop { Address = "Calle 12 #78", ZoneId = plaza.Id, X = -82.395, Y = 23.125 };
        _context.Stops.AddRange(stopCentro, stopVedado, stopPlaza);
        await _context.SaveChangesAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var orders = new[]
        {
            new Order
            {
                Description = "Paquete de repuestos",
                DeliveryType = DeliveryType.Parcel,
                Priority = OrderPriority.Urgent,
                WeightKg = 4.5m,
                EntryDate = today,
                DeadlineAt = DateTimeOffset.UtcNow.AddDays(1),
                EntryCoordinatorId = ana.Id,
                DistributionCenterId = center.Id,
                StopId = stopCentro.Id
            },
            new Order
            {
                Description = "Documentos de contrato",
                DeliveryType = DeliveryType.Documents,
                Priority = OrderPriority.Medium,
                WeightKg = 0.3m,
                EntryDate = today,
                DeadlineAt = DateTimeOffset.UtcNow.AddDays(2),
                EntryCoordinatorId = ana.Id,
                DistributionCenterId = center.Id,
                StopId = stopVedado.Id
            },
            new Order
            {
                Description = "Productos refrigerados",
                DeliveryType = DeliveryType.Perishable,
                Priority = OrderPriority.Urgent,
                WeightKg = 8.2m,
                EntryDate = today,
                DeadlineAt = DateTimeOffset.UtcNow.AddDays(1),
                EntryCoordinatorId = ana.Id,
                DistributionCenterId = center.Id,
                StopId = stopPlaza.Id
            }
        };
        _context.Orders.AddRange(orders);
        await _context.SaveChangesAsync();

        var criterion = new BalanceCriterion
        {
            Name = "Equilibrio base",
            Description = "Criterio predefinido de equilibrio por tipo de entrega."
        };
        criterion.Parameters.Add(new BalanceParameter
        {
            Name = "Proporción de paquetería",
            Metric = BalanceMetric.DeliveryTypeProportion,
            Operator = ComparisonOperator.GreaterThanOrEqual,
            TargetDeliveryType = DeliveryType.Parcel,
            AppliedValue = 0.4m
        });
        criterion.Parameters.Add(new BalanceParameter
        {
            Name = "Cobertura de zonas",
            Metric = BalanceMetric.ZoneCount,
            Operator = ComparisonOperator.GreaterThanOrEqual,
            AppliedValue = 3m
        });
        _context.BalanceCriteria.Add(criterion);
        await _context.SaveChangesAsync();

        var route = new Route
        {
            ScheduledDate = DateTimeOffset.UtcNow.Date.AddDays(1),
            GeneratorCoordinatorId = ana.Id,
            DistributionCenterId = center.Id,
            DeliveryPersonId = marco.Id,
            BalanceCriterionId = criterion.Id
        };
        foreach (var order in orders)
        {
            route.RouteOrders.Add(new RouteOrder { OrderId = order.Id });
            // An order inside a route is no longer pending, so the generator does not take it again.
            order.Status = OrderStatus.InRoute;
        }
        route.RouteStops.Add(new RouteStop { StopId = stopCentro.Id, VisitOrder = 1 });
        route.RouteStops.Add(new RouteStop { StopId = stopVedado.Id, VisitOrder = 2 });
        route.RouteStops.Add(new RouteStop { StopId = stopPlaza.Id, VisitOrder = 3 });
        _context.Routes.Add(route);
        await _context.SaveChangesAsync();

        var delivered = route.RouteOrders.First(routeOrder => routeOrder.OrderId == orders[1].Id);
        delivered.DeliveryRecord = new DeliveryRecord
        {
            DeliveredAt = DateTimeOffset.UtcNow,
            Result = DeliveryResult.Successful,
            Observations = "Recibido en recepción"
        };
        orders[1].Status = OrderStatus.Delivered;

        route.Reviews.Add(new Review
        {
            Decision = ReviewDecision.Approved,
            Observations = "Criterios cumplidos",
            SupervisorId = sofia.Id,
            BalanceCriterioId = criterion.Id
        });

        await _context.SaveChangesAsync();
    }

    private async Task<ApplicationUser> EnsureUserAsync(string firstName, string lastName, string email, string password, string role)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                FirstName = firstName,
                LastName = lastName
            };

            var result = await _userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    $"No se pudo crear el usuario demo {email}: {string.Join("; ", result.Errors.Select(error => error.Description))}");
            }
        }

        if (!await _userManager.IsInRoleAsync(user, role))
        {
            await _userManager.AddToRoleAsync(user, role);
        }

        return user;
    }
}
