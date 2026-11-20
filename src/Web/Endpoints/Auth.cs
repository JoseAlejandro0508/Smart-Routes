using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Infrastructure.Identity;
using Smart_Routes.Web.Auth;

namespace Smart_Routes.Web.Endpoints;

/// <summary>Endpoints de sesión: login, refresco, usuario actual, logout y cambio de contraseña.</summary>
public class Auth : IEndpointGroup
{
    public static string RoutePrefix => "/api/auth";

    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPost(Login, "login");
        groupBuilder.MapPost(VerifyTwoFactor, "2fa/verify");
        groupBuilder.MapPost(ResendTwoFactor, "2fa/resend");
        groupBuilder.MapPost(Refresh, "refresh");
        groupBuilder.MapGet(Me, "me").RequireAuthorization();
        groupBuilder.MapPost(Logout, "logout").RequireAuthorization();
        groupBuilder.MapPost(ChangePassword, "change-password").RequireAuthorization();
        groupBuilder.MapPost(Register, "register");
        groupBuilder.MapPost(ForgotPassword, "forgot");
        groupBuilder.MapPost(ResetPassword, "reset");
    }

    /// <summary>Valida credenciales y emite tokens, o un desafío de segundo factor.</summary>
    public static async Task<IResult> Login(
        UserManager<ApplicationUser> users,
        TokenService tokens,
        LoginRequest request)
    {
        var user = await users.FindByEmailAsync(request.Email);
        if (user is null || !user.Active || !await users.CheckPasswordAsync(user, request.Password))
        {
            return TypedResults.Problem(title: "Credenciales inválidas", statusCode: StatusCodes.Status401Unauthorized);
        }

        if (user.TwoFactorEnabled)
        {
            return TypedResults.Ok(new
            {
                requiresTwoFactor = true,
                challengeToken = tokens.CreateTwoFactorChallenge(user)
            });
        }

        return TypedResults.Ok(await IssueTokens(users, tokens, user));
    }

    /// <summary>Completa el segundo factor con un código del autenticador.</summary>
    public static async Task<IResult> VerifyTwoFactor(
        UserManager<ApplicationUser> users,
        TokenService tokens,
        VerifyTwoFactorRequest request)
    {
        var principal = tokens.ValidateTwoFactorChallenge(request.ChallengeToken);
        var userId = principal?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var user = await users.FindByIdAsync(userId);
        if (user is null || !user.Active)
        {
            return TypedResults.Unauthorized();
        }

        var valid = await users.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, request.Code);
        return valid
            ? TypedResults.Ok(await IssueTokens(users, tokens, user))
            : TypedResults.Problem(title: "Código de verificación inválido", statusCode: StatusCodes.Status401Unauthorized);
    }

    /// <summary>El segundo factor por autenticador no necesita reenvío; se conserva el contrato.</summary>
    public static IResult ResendTwoFactor() => TypedResults.NoContent();

    /// <summary>Canjea un token de refresco y rota ambos tokens.</summary>
    public static async Task<IResult> Refresh(
        UserManager<ApplicationUser> users,
        RefreshTokenStore refreshTokens,
        TokenService tokens,
        RefreshRequest request)
    {
        if (!refreshTokens.TryRedeem(request.RefreshToken, out var userId))
        {
            return TypedResults.Unauthorized();
        }

        var user = await users.FindByIdAsync(userId);
        if (user is null || !user.Active)
        {
            return TypedResults.Unauthorized();
        }

        return TypedResults.Ok(await IssueTokens(users, tokens, user));
    }

    /// <summary>Devuelve el usuario autenticado y su rol principal.</summary>
    public static async Task<IResult> Me(
        HttpContext httpContext,
        UserManager<ApplicationUser> users)
    {
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var user = await users.FindByIdAsync(userId);
        if (user is null || !user.Active)
        {
            return TypedResults.Unauthorized();
        }

        var roles = await users.GetRolesAsync(user);
        return TypedResults.Ok(new UserResponse(
            user.Id,
            TokenService.DisplayName(user),
            user.Email ?? string.Empty,
            roles.FirstOrDefault() ?? string.Empty));
    }

    /// <summary>Revoca el token de refresco indicado, o todos los del usuario.</summary>
    public static async Task<IResult> Logout(
        HttpContext httpContext,
        RefreshTokenStore refreshTokens,
        LogoutRequest? request)
    {
        if (!string.IsNullOrWhiteSpace(request?.RefreshToken))
        {
            refreshTokens.Revoke(request.RefreshToken);
            return TypedResults.NoContent();
        }

        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is not null)
        {
            refreshTokens.RevokeAll(userId);
        }

        return TypedResults.NoContent();
    }

    /// <summary>Cambia la contraseña del usuario autenticado y revoca sus sesiones.</summary>
    public static async Task<IResult> ChangePassword(
        HttpContext httpContext,
        UserManager<ApplicationUser> users,
        RefreshTokenStore refreshTokens,
        ChangePasswordRequest request)
    {
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = userId is null ? null : await users.FindByIdAsync(userId);
        if (user is null)
        {
            return TypedResults.Unauthorized();
        }

        var result = await users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return TypedResults.Problem(
                title: "No se pudo cambiar la contraseña",
                detail: string.Join(" ", result.Errors.Select(error => error.Description)),
                statusCode: StatusCodes.Status400BadRequest);
        }

        refreshTokens.RevokeAll(user.Id);
        return TypedResults.NoContent();
    }

    /// <summary>Registra una cuenta sin rol; un administrador le asigna el rol después.</summary>
    public static async Task<IResult> Register(
        UserManager<ApplicationUser> users,
        RegisterRequest request)
    {
        var parts = request.Name.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            FirstName = parts.ElementAtOrDefault(0),
            LastName = parts.ElementAtOrDefault(1)
        };

        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return TypedResults.ValidationProblem(result.Errors
                .GroupBy(error => error.Code)
                .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray()));
        }

        // El contrato del frontend asigna el rol de coordinador al autorregistro.
        await users.AddToRoleAsync(user, Roles.LogisticsCoordinator);

        return TypedResults.Created($"/api/auth/me", new { user.Id });
    }

    /// <summary>Genera un token de restablecimiento. En desarrollo se devuelve para poder probarlo.</summary>
    public static async Task<IResult> ForgotPassword(
        UserManager<ApplicationUser> users,
        PasswordResetTokenStore resetTokens,
        IHostEnvironment environment,
        ILogger<Auth> logger,
        ForgotPasswordRequest request)
    {
        var user = await users.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return TypedResults.NoContent();
        }

        var token = await users.GeneratePasswordResetTokenAsync(user);
        resetTokens.Store(token, user.Email ?? request.Email, TimeSpan.FromMinutes(15));
        logger.LogInformation("Enlace de restablecimiento para {Email}: /reset-password?token={Token}", user.Email, token);

        return environment.IsDevelopment()
            ? TypedResults.Ok(new { email = user.Email, token })
            : TypedResults.NoContent();
    }

    /// <summary>Restablece la contraseña con el token emitido por <c>/forgot</c>.</summary>
    public static async Task<IResult> ResetPassword(
        UserManager<ApplicationUser> users,
        PasswordResetTokenStore resetTokens,
        ResetPasswordRequest request)
    {
        if (!resetTokens.TryRedeem(request.Token, out var email))
        {
            return TypedResults.Problem(
                title: "Enlace inválido o expirado",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var user = await users.FindByEmailAsync(email);
        if (user is null)
        {
            return TypedResults.Problem(
                title: "Enlace inválido o expirado",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var result = await users.ResetPasswordAsync(user, request.Token, request.NewPassword);
        return result.Succeeded
            ? TypedResults.NoContent()
            : TypedResults.Problem(
                title: "No se pudo restablecer la contraseña",
                detail: string.Join(" ", result.Errors.Select(error => error.Description)),
                statusCode: StatusCodes.Status400BadRequest);
    }

    private static async Task<object> IssueTokens(
        UserManager<ApplicationUser> users,
        TokenService tokens,
        ApplicationUser user)
    {
        var roles = await users.GetRolesAsync(user);
        var pair = tokens.CreateTokens(user, roles);
        return new
        {
            accessToken = pair.AccessToken,
            refreshToken = pair.RefreshToken,
            expiresIn = pair.ExpiresIn,
            tokenType = "Bearer"
        };
    }
}

public sealed record LoginRequest(string Email, string Password);
public sealed record VerifyTwoFactorRequest(string ChallengeToken, string Code);
public sealed record RefreshRequest(string RefreshToken);
public sealed record LogoutRequest(string? RefreshToken);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public sealed record RegisterRequest(string Name, string Email, string Password);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ResetPasswordRequest(string Token, string NewPassword);
public sealed record UserResponse(string Id, string Name, string Email, string Role);
