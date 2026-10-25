using Smart_Routes.Domain.Constants;

namespace Smart_Routes.Application.Common.Interfaces;
public interface IRoleManager
{
    public Task<List<string>> AddUserRoleAsync(string userId, string role);
    public Task<List<string>> RemoveUserRoleAsync(string userId, string role);
    public Task<List<string>> GetUserRoleAsync(string userId);
    public Task<List<IUser>> GetAllUsersRolesAsync();

}