using System.ComponentModel.DataAnnotations;

namespace identity_service.DTO;

// ---------- Requests ----------

public class RegisterRequest
{
    /// <summary>User's email address (must be unique)</summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>Password – minimum 8 characters</summary>
    [Required]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    /// <summary>Registered email address</summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>Account password</summary>
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    /// <summary>A valid, non-revoked refresh token</summary>
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    /// <summary>Current (old) password</summary>
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    /// <summary>New password – minimum 8 characters</summary>
    [Required]
    [MinLength(8, ErrorMessage = "New password must be at least 8 characters.")]
    public string NewPassword { get; set; } = string.Empty;
}

// ---------- Responses ----------

public class AuthResponse
{
    /// <summary>Short-lived JWT access token</summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>Long-lived opaque refresh token</summary>
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>Seconds until the access token expires</summary>
    public int ExpiresIn { get; set; }

    /// <summary>Authenticated user's unique identifier</summary>
    public Guid UserId { get; set; }
}

public class UserProfileResponse
{
    /// <summary>User's unique identifier</summary>
    public Guid Id { get; set; }

    /// <summary>User's email address</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Account creation timestamp (UTC)</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Whether the account is currently active</summary>
    public bool IsActive { get; set; }
}

public class ValidateTokenResponse
{
    /// <summary>Whether the supplied token is valid</summary>
    public bool IsValid { get; set; }

    /// <summary>User ID extracted from the token (null if invalid)</summary>
    public Guid? UserId { get; set; }

    /// <summary>Email extracted from the token (null if invalid)</summary>
    public string? Email { get; set; }
}

public class MessageResponse
{
    public string Message { get; set; } = string.Empty;
}
