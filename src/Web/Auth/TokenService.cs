using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Smart_Routes.Infrastructure.Identity;

namespace Smart_Routes.Web.Auth;

/// <summary>Par de tokens emitido al iniciar sesión o renovar la sesión.</summary>
public sealed record TokenPair(string AccessToken, string RefreshToken, int ExpiresIn);

/// <summary>Genera y valida los JWT de acceso y los tokens de desafío de segundo factor.</summary>
public sealed class TokenService
{
    private readonly JwtOptions _options;
    private readonly RefreshTokenStore _refreshTokens;

    public TokenService(IOptions<JwtOptions> options, RefreshTokenStore refreshTokens)
    {
        _options = options.Value;
        _refreshTokens = refreshTokens;
    }

    /// <summary>Emite un token de acceso y un token de refresco para el usuario.</summary>
    public TokenPair CreateTokens(ApplicationUser user, IEnumerable<string> roles)
    {
        var accessToken = CreateAccessToken(user, roles, TimeSpan.FromMinutes(_options.AccessTokenMinutes));
        var refreshToken = _refreshTokens.Create(user.Id, TimeSpan.FromDays(_options.RefreshTokenDays));
        return new TokenPair(accessToken, refreshToken, (int)TimeSpan.FromMinutes(_options.AccessTokenMinutes).TotalSeconds);
    }

    /// <summary>Emite un token temporal que solo sirve para completar el segundo factor.</summary>
    public string CreateTwoFactorChallenge(ApplicationUser user) =>
        CreateAccessToken(user, [], TimeSpan.FromMinutes(5), purpose: "2fa");

    /// <summary>Valida un token de desafío y devuelve el usuario asociado.</summary>
    public ClaimsPrincipal? ValidateTwoFactorChallenge(string token)
    {
        try
        {
            var principal = new JwtSecurityTokenHandler().ValidateToken(token, ValidationParameters(), out _);
            return principal.FindFirst("purpose")?.Value == "2fa" ? principal : null;
        }
        catch
        {
            return null;
        }
    }

    private string CreateAccessToken(
        ApplicationUser user,
        IEnumerable<string> roles,
        TimeSpan lifetime,
        string? purpose = null)
    {
        var now = DateTime.UtcNow;
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, DisplayName(user)),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        if (!string.IsNullOrWhiteSpace(purpose))
        {
            claims.Add(new Claim("purpose", purpose));
        }

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key)),
            SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now,
            expires: now.Add(lifetime),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }

    private TokenValidationParameters ValidationParameters() => new()
    {
        ValidateIssuer = true,
        ValidIssuer = _options.Issuer,
        ValidateAudience = true,
        ValidAudience = _options.Audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30),
        NameClaimType = ClaimTypes.Name,
        RoleClaimType = ClaimTypes.Role
    };

    /// <summary>Nombre visible del usuario, con respaldo en el correo.</summary>
    public static string DisplayName(ApplicationUser user)
    {
        var name = string.Join(' ', new[] { user.FirstName, user.LastName }.Where(part => !string.IsNullOrWhiteSpace(part)));
        return !string.IsNullOrWhiteSpace(name) ? name : user.UserName ?? user.Email ?? "Usuario";
    }
}
