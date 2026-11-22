using System.Collections.Concurrent;

namespace Smart_Routes.Web.Auth;

/// <summary>Token de restablecimiento de contraseña de un solo uso.</summary>
public sealed record PasswordResetEntry(string Email, DateTimeOffset ExpiresAt);

/// <summary>
/// Almacén en memoria de tokens de restablecimiento. El token identifica al usuario,
/// igual que en el contrato del frontend, y se quema al usarse.
/// </summary>
public sealed class PasswordResetTokenStore
{
    private readonly ConcurrentDictionary<string, PasswordResetEntry> _tokens = new(StringComparer.Ordinal);

    /// <summary>Registra un token de Identity ya emitido para el correo indicado.</summary>
    public void Store(string token, string email, TimeSpan lifetime) =>
        _tokens[token] = new PasswordResetEntry(email, DateTimeOffset.UtcNow.Add(lifetime));

    /// <summary>Canjea el token y devuelve el correo asociado.</summary>
    public bool TryRedeem(string token, out string email)
    {
        email = string.Empty;
        if (!_tokens.TryRemove(token, out var entry) || entry.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return false;
        }

        email = entry.Email;
        return true;
    }
}
