using Microsoft.AspNetCore.Identity;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
namespace Smart_Routes.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
public class UserWithRoles : IUser
{
    public string? Id { get; set; }
    public List<string>? Roles { get; set; }
}
public class MyRoleManager : IRoleManager
{
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;
    public MyRoleManager(RoleManager<IdentityRole> roleManager, UserManager<ApplicationUser> userManager)
    {
        _roleManager = roleManager;
        _userManager = userManager;
    }

    public async Task<List<string>> AddUserRoleAsync(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) throw new NotFoundException(userId, "UserTable");
        await _userManager.AddToRoleAsync(user, role);
        return await GetUserRoleAsync(userId);
    }

    public async Task<List<string>> GetUserRoleAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) throw new NotFoundException(userId, "UserTable");

        var roles = await _userManager.GetRolesAsync(user!);


        return [.. roles];

    }
    public async Task<List<IUser>> GetAllUsersRolesAsync()
    {
        var user = await _userManager.Users.ToListAsync();
        List<IUser> usersWithRoles = new List<IUser>();
        foreach (var u in user)
        {
            var roles = await _userManager.GetRolesAsync(u);
            usersWithRoles.AddRange(new UserWithRoles{
                Id = u.Id,
                Roles = [.. roles]
            });
        }

        return usersWithRoles;

    }

    public async Task<List<string>> RemoveUserRoleAsync(string userId, string role)
    {

        var user = await _userManager.FindByIdAsync(userId) ?? throw new NotFoundException(userId, "UserTable");
        await _userManager.RemoveFromRoleAsync(user, role);
        return await GetUserRoleAsync(userId);
        
    }
}               