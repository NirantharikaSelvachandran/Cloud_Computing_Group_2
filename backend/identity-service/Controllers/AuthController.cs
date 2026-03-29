using identity_service.DTO;
using identity_service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace identity_service.Controllers;

/// <summary>
/// Authentication endpoints: register, login, token refresh, logout, and token validation.
/// </summary>
[ApiController]
[Route("identity/auth")]
[Produces("application/json")]
public class AuthController(IdentityService identityService) : ControllerBase
{
    // ── POST /identity/auth/register ─────────────────────────────────────────

    /// <summary>Register a new user account.</summary>
    /// <remarks>
    /// No prior login is required. On success, returns a JWT access token and a
    /// refresh token. Passwords are stored as bcrypt hashes – plain text is never
    /// persisted.
    /// </remarks>
    /// <response code="201">Registration successful; tokens returned.</response>
    /// <response code="400">Validation errors or email already taken.</response>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), 201)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var (success, error, response) = await identityService.RegisterAsync(request);
        if (!success)
            return BadRequest(new { message = error });

        return StatusCode(201, response);
    }

    // ── POST /identity/auth/login ────────────────────────────────────────────

    /// <summary>Authenticate with email and password.</summary>
    /// <remarks>
    /// Returns a short-lived JWT access token (default 60 min) and a long-lived
    /// refresh token (default 30 days). The access token must be supplied as
    /// <c>Authorization: Bearer &lt;token&gt;</c> on protected endpoints.
    /// </remarks>
    /// <response code="200">Login successful; tokens returned.</response>
    /// <response code="401">Invalid credentials or deactivated account.</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(typeof(MessageResponse), 401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var (success, error, response) = await identityService.LoginAsync(request);
        if (!success)
            return Unauthorized(new MessageResponse { Message = error! });

        return Ok(response);
    }

    // ── POST /identity/auth/refresh ──────────────────────────────────────────

    /// <summary>Exchange a refresh token for a new access + refresh token pair.</summary>
    /// <remarks>
    /// The old refresh token is immediately revoked (token rotation). Store the
    /// new refresh token returned in the response.
    /// </remarks>
    /// <response code="200">New token pair issued.</response>
    /// <response code="401">Refresh token invalid, expired, or already revoked.</response>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(typeof(MessageResponse), 401)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var (success, error, response) = await identityService.RefreshAsync(request.RefreshToken);
        if (!success)
            return Unauthorized(new MessageResponse { Message = error! });

        return Ok(response);
    }

    // ── POST /identity/auth/logout ───────────────────────────────────────────

    /// <summary>Revoke a refresh token (logout).</summary>
    /// <remarks>
    /// Calling this invalidates the supplied refresh token so it cannot be used
    /// again. The access token will remain valid until it expires naturally.
    /// </remarks>
    /// <response code="200">Refresh token revoked.</response>
    /// <response code="400">Token not found.</response>
    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(MessageResponse), 200)]
    [ProducesResponseType(typeof(MessageResponse), 400)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        var revoked = await identityService.RevokeAsync(request.RefreshToken);
        if (!revoked)
            return BadRequest(new MessageResponse { Message = "Token not found." });

        return Ok(new MessageResponse { Message = "Logged out successfully." });
    }

    // ── GET /identity/auth/validate ──────────────────────────────────────────

    /// <summary>Validate a JWT access token (internal use by BFF / other services).</summary>
    /// <remarks>
    /// Pass the raw Bearer token in the <c>Authorization</c> header or supply the
    /// token string via the <c>token</c> query parameter. Returns the embedded
    /// <c>userId</c> and <c>email</c> if valid.
    /// </remarks>
    /// <response code="200">Validation result (check <c>isValid</c> field).</response>
    [HttpGet("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ValidateTokenResponse), 200)]
    public IActionResult Validate([FromQuery] string? token)
    {
        // Accept token from query param OR Authorization header
        var raw = token
            ?? Request.Headers.Authorization.FirstOrDefault()
            ?? string.Empty;

        var result = identityService.ValidateAccessToken(raw);
        return Ok(result);
    }
}
