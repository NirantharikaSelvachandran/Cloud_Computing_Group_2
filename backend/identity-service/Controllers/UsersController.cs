using System.Security.Claims;
using identity_service.DTO;
using identity_service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace identity_service.Controllers;

/// <summary>
/// User profile management. All endpoints require a valid JWT access token.
/// </summary>
[ApiController]
[Route("identity/users")]
[Produces("application/json")]
[Authorize]
public class UsersController(IdentityService identityService) : ControllerBase
{
    // ── GET /identity/users/me ───────────────────────────────────────────────

    /// <summary>Get the authenticated user's profile.</summary>
    /// <remarks>
    /// Returns public profile information for the currently authenticated user.
    /// Email and other identity data are never included in salary responses –
    /// this endpoint is the only place they are surfaced.
    /// </remarks>
    /// <response code="200">User profile returned.</response>
    /// <response code="401">Missing or invalid JWT.</response>
    /// <response code="404">User account no longer exists.</response>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserProfileResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var profile = await identityService.GetProfileAsync(userId.Value);
        if (profile is null) return NotFound(new MessageResponse { Message = "User not found." });

        return Ok(profile);
    }

    // ── PUT /identity/users/me/password ──────────────────────────────────────

    /// <summary>Change the authenticated user's password.</summary>
    /// <remarks>
    /// Requires the current password for verification. On success, all existing
    /// refresh tokens are revoked and a new login is required.
    /// </remarks>
    /// <response code="200">Password changed; all sessions revoked.</response>
    /// <response code="400">Current password incorrect or validation error.</response>
    /// <response code="401">Missing or invalid JWT.</response>
    [HttpPut("me/password")]
    [ProducesResponseType(typeof(MessageResponse), 200)]
    [ProducesResponseType(typeof(MessageResponse), 400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var (success, error) = await identityService.ChangePasswordAsync(userId.Value, request);
        if (!success)
            return BadRequest(new MessageResponse { Message = error! });

        return Ok(new MessageResponse { Message = "Password changed. Please log in again." });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
