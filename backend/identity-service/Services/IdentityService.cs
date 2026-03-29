using identity_service.Data;
using identity_service.DTO;
using identity_service.Models;
using Microsoft.EntityFrameworkCore;

namespace identity_service.Services;

public class IdentityService(IdentityDbContext db, TokenService tokenService, IConfiguration config)
{
    private readonly int _refreshTokenDays =
        int.TryParse(config["Jwt:RefreshTokenDays"], out var d) ? d : 30;

    // ── Register ──────────────────────────────────────────────────────────────

    public async Task<(bool success, string? error, AuthResponse? response)> RegisterAsync(RegisterRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email.ToLower()))
            return (false, "Email is already registered.", null);

        var user = new User
        {
            Email = req.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return (true, null, await IssueTokensAsync(user));
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public async Task<(bool success, string? error, AuthResponse? response)> LoginAsync(LoginRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower());
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return (false, "Invalid email or password.", null);

        if (!user.IsActive)
            return (false, "Account is deactivated.", null);

        return (true, null, await IssueTokensAsync(user));
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    public async Task<(bool success, string? error, AuthResponse? response)> RefreshAsync(string rawToken)
    {
        var existing = await db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == rawToken);

        if (existing is null || existing.IsRevoked || existing.ExpiresAt < DateTime.UtcNow)
            return (false, "Refresh token is invalid or expired.", null);

        // Rotate: revoke old, issue new
        existing.IsRevoked = true;
        await db.SaveChangesAsync();

        return (true, null, await IssueTokensAsync(existing.User!));
    }

    // ── Revoke (logout) ───────────────────────────────────────────────────────

    public async Task<bool> RevokeAsync(string rawToken)
    {
        var token = await db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == rawToken);
        if (token is null) return false;
        token.IsRevoked = true;
        await db.SaveChangesAsync();
        return true;
    }

    // ── Validate access token (internal endpoint for BFF / other services) ───

    public ValidateTokenResponse ValidateAccessToken(string bearerToken)
    {
        var token = bearerToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? bearerToken[7..]
            : bearerToken;

        var principal = tokenService.ValidateToken(token);
        if (principal is null)
            return new ValidateTokenResponse { IsValid = false };

        var userId = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var email = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value;

        return new ValidateTokenResponse
        {
            IsValid = true,
            UserId = Guid.TryParse(userId, out var uid) ? uid : null,
            Email = email
        };
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    public async Task<UserProfileResponse?> GetProfileAsync(Guid userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return null;
        return MapProfile(user);
    }

    // ── Change password ───────────────────────────────────────────────────────

    public async Task<(bool success, string? error)> ChangePasswordAsync(Guid userId, ChangePasswordRequest req)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return (false, "User not found.");

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
            return (false, "Current password is incorrect.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);

        // Revoke all existing refresh tokens on password change
        var tokens = db.RefreshTokens.Where(r => r.UserId == userId && !r.IsRevoked);
        await tokens.ForEachAsync(t => t.IsRevoked = true);

        await db.SaveChangesAsync();
        return (true, null);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<AuthResponse> IssueTokensAsync(User user)
    {
        var (accessToken, _) = tokenService.GenerateAccessToken(user);
        var rawRefresh = tokenService.GenerateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = rawRefresh,
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenDays)
        });
        await db.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = rawRefresh,
            ExpiresIn = tokenService.AccessTokenSeconds,
            UserId = user.Id
        };
    }

    private static UserProfileResponse MapProfile(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        CreatedAt = user.CreatedAt,
        IsActive = user.IsActive
    };
}
