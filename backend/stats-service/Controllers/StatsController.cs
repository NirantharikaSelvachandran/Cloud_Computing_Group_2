using Microsoft.AspNetCore.Mvc;
using stats_service.Services;

namespace stats_service.Controllers;

[ApiController]
[Route("stats")]
public class StatsController(StatsService statsService) : ControllerBase
{
    // GET /stats?country=Sri Lanka&role=Software Engineer&currency=LKR&period=monthly
    [HttpGet]
    public async Task<IActionResult> GetStats(
        [FromQuery] string? country,
        [FromQuery] string? role,
        [FromQuery] string? currency,
        [FromQuery] string? period)
    {
        var result = await statsService.GetStatsAsync(country, role, currency, period);

        if (result is null)
            return NotFound(new { message = "No approved salary data found for the given filters." });

        return Ok(result);
    }
}
