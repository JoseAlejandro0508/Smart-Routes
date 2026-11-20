using Smart_Routes.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Smart_Routes.Domain.Constants;

using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Application.LogisticsCordinators.Commands.CreateLogisticsCordinator;
using Smart_Routes.Application.DeliveryPersons.Commands.CreateDeliveryPerson;
using Smart_Routes.Application.OperationsSupervisors.Commands.CreateOperationsSupervisor;

namespace Smart_Routes.Web.Endpoints;

public class Admin : IEndpointGroup
{
    public static string RoutePrefix => "/api/admin/manage-roles";

    public static void Map(RouteGroupBuilder groupBuilder)
    {
        var adminOnly = new AuthorizeAttribute { Roles = Roles.Administrator };
        var planners = new AuthorizeAttribute { Roles = $"{Roles.Administrator},{Roles.LogisticsCoordinator},{Roles.OperationsSupervisor}" };

        groupBuilder.MapPost(CreateDeliveryPerson, "create-delivery-person").RequireAuthorization(adminOnly);
        groupBuilder.MapPost(CreateOperationsSupervisor, "create-operations-supervisor").RequireAuthorization(adminOnly);
        groupBuilder.MapPost(CreateLogisticsCordinator, "create-logistics-cordinator").RequireAuthorization(adminOnly);
        groupBuilder.MapPost(CreateDeliveryPersonFull, "create-delivery-person-full").RequireAuthorization(adminOnly);
        groupBuilder.MapPost(CreateCoordinatorFull, "create-coordinator-full").RequireAuthorization(adminOnly);
        groupBuilder.MapPost(CreateSupervisorFull, "create-supervisor-full").RequireAuthorization(adminOnly);

        groupBuilder.MapGet(ListUsers, "users").RequireAuthorization(adminOnly);
        groupBuilder.MapGet(ListDeliveryPersons, "delivery-persons").RequireAuthorization(planners);
        groupBuilder.MapGet(ListCoordinators, "coordinators").RequireAuthorization();
        groupBuilder.MapGet(ListSupervisors, "supervisors").RequireAuthorization(adminOnly);
        groupBuilder.MapPut(SetUserRole, "users/{userId}/role").RequireAuthorization(adminOnly);
    }

    [EndpointSummary("Add a Logistic Coordinator")]
    [EndpointDescription("Add a Logistic Coordinator role to the specified user associated with the provided userId")]
    public static async Task<Results<NoContent, BadRequest>> CreateLogisticsCordinator(ISender sender, CreateLogisticCordinatorCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Add a Delivery Person")]
    [EndpointDescription("Add a Delivery Person role to the specified user associated with the provided userId")]
    public static async Task<Results<NoContent, BadRequest>> CreateDeliveryPerson(ISender sender, CreateDeliveryPersonCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("Add a Operations Supervisor")]
    [EndpointDescription("Add a Operations Supervisor role to the specified user associated with the provided userId")]
    public static async Task<Results<NoContent, BadRequest>> CreateOperationsSupervisor(ISender sender, CreateOperationsSupervisorCommand request)
    {
        await sender.Send(request);
        return TypedResults.NoContent();
    }

    [EndpointSummary("List users with roles")]
    public static async Task<Ok<List<UserWithRoleDto>>> ListUsers(UserManager<ApplicationUser> userManager)
    {
        var users = await userManager.Users.AsNoTracking().OrderBy(u => u.Email).ToListAsync();
        var result = new List<UserWithRoleDto>(users.Count);
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new UserWithRoleDto(
                user.Id,
                user.Email ?? user.UserName ?? user.Id,
                BuildName(user),
                roles.FirstOrDefault() ?? string.Empty,
                user.Active));
        }

        return TypedResults.Ok(result);
    }

    [EndpointSummary("List delivery persons")]
    public static async Task<Ok<List<DeliveryPersonDto>>> ListDeliveryPersons(
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        var persons = await context.DeliveryPersons.AsNoTracking().ToListAsync();
        var users = await userManager.Users.AsNoTracking()
            .Where(u => persons.Select(p => p.Id).Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        var result = persons.Select(p => new DeliveryPersonDto(
                p.Id,
                users.TryGetValue(p.Id, out var u) ? (u.Email ?? u.UserName ?? p.Id) : p.Id,
                users.TryGetValue(p.Id, out var u2) ? BuildName(u2) : p.Id,
                p.DateOfBirth,
                p.Fleet))
            .OrderBy(p => p.Name)
            .ToList();

        return TypedResults.Ok(result);
    }

    [EndpointSummary("List logistics coordinators")]
    public static async Task<Ok<List<CoordinatorDto>>> ListCoordinators(
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        var coordinators = await context.LogisticsCoordinators
            .AsNoTracking()
            .Include(c => c.AuthorizedCenters)
            .ToListAsync();
        var users = await userManager.Users.AsNoTracking()
            .Where(u => coordinators.Select(c => c.Id).Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        var result = coordinators.Select(c => new CoordinatorDto(
                c.Id,
                users.TryGetValue(c.Id, out var u) ? (u.Email ?? u.UserName ?? c.Id) : c.Id,
                users.TryGetValue(c.Id, out var u2) ? BuildName(u2) : c.Id,
                c.Specialty,
                c.AuthorizedCenters.Select(ac => ac.DistributionCenterId).ToList()))
            .OrderBy(c => c.Name)
            .ToList();

        return TypedResults.Ok(result);
    }

    [EndpointSummary("List operations supervisors")]
    public static async Task<Ok<List<SupervisorDto>>> ListSupervisors(
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        var supervisors = await context.OperationsSupervisors.AsNoTracking().ToListAsync();
        var users = await userManager.Users.AsNoTracking()
            .Where(u => supervisors.Select(s => s.Id).Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        var result = supervisors.Select(s => new SupervisorDto(
                s.Id,
                users.TryGetValue(s.Id, out var u) ? (u.Email ?? u.UserName ?? s.Id) : s.Id,
                users.TryGetValue(s.Id, out var u2) ? BuildName(u2) : s.Id,
                s.ControlArea))
            .OrderBy(s => s.Name)
            .ToList();

        return TypedResults.Ok(result);
    }

    [EndpointSummary("Set a user's primary role")]
    public static async Task<Results<NoContent, NotFound, BadRequest<string>>> SetUserRole(
        string userId,
        [FromBody] SetUserRoleRequest request,
        UserManager<ApplicationUser> userManager)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return TypedResults.NotFound();

        var currentRoles = await userManager.GetRolesAsync(user);
        if (currentRoles.Count > 0)
        {
            var remove = await userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!remove.Succeeded) return TypedResults.BadRequest(string.Join("; ", remove.Errors.Select(e => e.Description)));
        }

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            var add = await userManager.AddToRoleAsync(user, request.Role);
            if (!add.Succeeded) return TypedResults.BadRequest(string.Join("; ", add.Errors.Select(e => e.Description)));
        }

        return TypedResults.NoContent();
    }

    private static string BuildName(ApplicationUser user)
    {
        var full = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrWhiteSpace(full) ? (user.Email ?? user.UserName ?? user.Id) : full;
    }

    [EndpointSummary("Create delivery person with user account")]
    public static async Task<Results<Created<string>, BadRequest<string>>> CreateDeliveryPersonFull(
        ISender sender,
        UserManager<ApplicationUser> userManager,
        IApplicationDbContext context,
        [FromBody] CreateDeliveryPersonFullRequest request)
    {
        var (user, error) = await CreateUserAsync(userManager, request.Email, request.Password, request.FirstName, request.LastName);
        if (error is not null || user is null) return TypedResults.BadRequest(error ?? "No se pudo crear el usuario.");

        try
        {
            await sender.Send(new CreateDeliveryPersonCommand
            {
                UserId = user.Id,
                BirthDay = request.BirthDay,
                Fleet = request.Fleet,
            });

            foreach (var centerId in request.DistributionCenterIds.Distinct())
            {
                context.DeliveryPersonCenters.Add(new Smart_Routes.Domain.Entities.DeliveryPersonCenter
                {
                    DeliveryPersonId = user.Id,
                    DistributionCenterId = centerId,
                });
            }

            if (request.DistributionCenterIds.Count > 0)
            {
                await context.SaveChangesAsync(CancellationToken.None);
            }

            return TypedResults.Created($"/api/admin/manage-roles/delivery-persons/{user.Id}", user.Id);
        }
        catch (Exception ex)
        {
            await userManager.DeleteAsync(user);
            return TypedResults.BadRequest(ex.Message);
        }
    }

    [EndpointSummary("Create logistics coordinator with user account")]
    public static async Task<Results<Created<string>, BadRequest<string>>> CreateCoordinatorFull(
        ISender sender,
        UserManager<ApplicationUser> userManager,
        IApplicationDbContext context,
        [FromBody] CreateCoordinatorFullRequest request)
    {
        var (user, error) = await CreateUserAsync(userManager, request.Email, request.Password, request.FirstName, request.LastName);
        if (error is not null || user is null) return TypedResults.BadRequest(error ?? "No se pudo crear el usuario.");

        try
        {
            await sender.Send(new CreateLogisticCordinatorCommand
            {
                UserId = user.Id,
                Speciality = request.Specialty,
            });

            foreach (var centerId in request.AuthorizedCenterIds.Distinct())
            {
                context.CoordinatorCenters.Add(new Smart_Routes.Domain.Entities.CoordinatorCenter
                {
                    CoordinatorId = user.Id,
                    DistributionCenterId = centerId,
                });
            }

            if (request.AuthorizedCenterIds.Count > 0)
            {
                await context.SaveChangesAsync(CancellationToken.None);
            }

            return TypedResults.Created($"/api/admin/manage-roles/coordinators/{user.Id}", user.Id);
        }
        catch (Exception ex)
        {
            await userManager.DeleteAsync(user);
            return TypedResults.BadRequest(ex.Message);
        }
    }

    [EndpointSummary("Create operations supervisor with user account")]
    public static async Task<Results<Created<string>, BadRequest<string>>> CreateSupervisorFull(
        ISender sender,
        UserManager<ApplicationUser> userManager,
        [FromBody] CreateSupervisorFullRequest request)
    {
        var (user, error) = await CreateUserAsync(userManager, request.Email, request.Password, request.FirstName, request.LastName);
        if (error is not null || user is null) return TypedResults.BadRequest(error ?? "No se pudo crear el usuario.");

        try
        {
            await sender.Send(new CreateOperationsSupervisorCommand
            {
                UserId = user.Id,
                ControlArea = request.ControlArea,
            });

            return TypedResults.Created($"/api/admin/manage-roles/supervisors/{user.Id}", user.Id);
        }
        catch (Exception ex)
        {
            await userManager.DeleteAsync(user);
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<(ApplicationUser? User, string? Error)> CreateUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string password,
        string? firstName,
        string? lastName)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return (null, "Email y contraseña son obligatorios.");
        }

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            return (null, "Ya existe un usuario con ese correo.");
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Active = true,
            EmailConfirmed = true,
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            return (null, string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        return (user, null);
    }
}

public sealed record UserWithRoleDto(string Id, string Email, string Name, string Role, bool Active);
public sealed record DeliveryPersonDto(string Id, string Email, string Name, DateOnly DateOfBirth, string Fleet);
public sealed record CoordinatorDto(string Id, string Email, string Name, string Specialty, List<int> AuthorizedCenterIds);
public sealed record SupervisorDto(string Id, string Email, string Name, string ControlArea);
public sealed record SetUserRoleRequest(string Role);


public sealed record CreateDeliveryPersonFullRequest(
    string Email,
    string Password,
    string? FirstName,
    string? LastName,
    DateOnly BirthDay,
    string Fleet,
    List<int> DistributionCenterIds);

public sealed record CreateCoordinatorFullRequest(
    string Email,
    string Password,
    string? FirstName,
    string? LastName,
    string Specialty,
    List<int> AuthorizedCenterIds);

public sealed record CreateSupervisorFullRequest(
    string Email,
    string Password,
    string? FirstName,
    string? LastName,
    string ControlArea);
