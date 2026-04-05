using Microsoft.AspNetCore.Mvc;
using search_service.Services;

namespace search_service.Controllers
{
    [ApiController]
    [Route("search")]
    public class SearchController(SearchService searchService) : ControllerBase
    {
        // GET /search - basic search (all approved)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var results = await searchService.SearchAsync(
                null, null, null, null,
                null, null, null, null);
            return Ok(results);
        }

        // GET /search/filter?country=...&company=...
        [HttpGet("filter")]
        public async Task<IActionResult> Search(
            [FromQuery] string? country,
            [FromQuery] string? company,
            [FromQuery] string? role,
            [FromQuery] string? level,
            [FromQuery] decimal? minAmount,
            [FromQuery] decimal? maxAmount,
            [FromQuery] int? minExperience,
            [FromQuery] int? maxExperience)
        {
            var results = await searchService.SearchAsync(
                country, 
                company, 
                role, 
                level,
                minAmount,
                maxAmount,
                minExperience,
                maxExperience);

            return Ok(results);
        }
    }
}
