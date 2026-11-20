using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace Smart_Routes.Web.Auth;

/// <summary>Entrada de un token de refresco vigente.</summary>
public sealed record RefreshTokenEntry(string UserId, DateTimeOffset ExpiresAt);

/// <summary>
/// Almacén en memoria de tokens de refresco. Es suficiente para el entorno de desarrollo
/// y permite rotación, revocación y cierre de sesión sin añadir una tabla nueva.
/// </summary>
public sealed class RefreshTokenStore
{
    private readonly ConcurrentDictionary<string, RefreshTokenEntry> _tokens = new(StringComparer.Ordinal);

    /// <summary>Crea un token opaco de refresco para el usuario indicado.</summary>
    public string Create(string userId, TimeSpan lifetime)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        _tokens[token] = new RefreshTokenEntry(userId, DateTimeOffset.UtcNow.Add(lifetime));
        return token;
    }

    /// <summary>Canjea un token de refresco una sola vez y devuelve el usuario asociado.</summary>
    public bool TryRedeem(string token, out string userId)
    {
        userId = string.Empty;
        if (!_tokens.TryRemove(token, out var entry))
        {
            return false;
        }

        if (entry.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return false;
        }

        userId = entry.UserId;
        return true;
    }

    /// <summary>Revoca un token concreto.</summary>
    public void Revoke(string token) => _tokens.TryRemove(token, out _);

    /// <summary>Revoca todos los tokens de un usuario (por ejemplo, al cambiar la contraseña).</summary>
    public void RevokeAll(string userId)
    {
        foreach (var pair in _tokens)
        {
            if (string.Equals(pair.Value.UserId, userId, StringComparison.Ordinal))
            {
                _tokens.TryRemove(pair.Key, out _);
            }
        }
    }
}
