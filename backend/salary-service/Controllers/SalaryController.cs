using Microsoft.AspNetCore.Mvc;
using salary_service.DTO;
using salary_service.Services;

namespace salary_service.Controllers;

[ApiController]
[Route("salary")]
public class SalaryController(SalaryService salaryService) : ControllerBase
{
    // POST /salary/submit - public, no login required
    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitSalaryRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await salaryService.SubmitAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    // GET /salary/submissions - all submissions (all statuses)
    [HttpGet("submissions")]
    public async Task<IActionResult> GetAll()
    {
        var results = await salaryService.GetAllAsync();
        return Ok(results);
    }

    // GET /salary/{id} - retrieve single submission
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await salaryService.GetByIdAsync(id);
        if (result is null) return NotFound(new { message = "Salary not found" });
        return Ok(result);
    }

    // GET /salary/approved - all approved submissions
    [HttpGet("approved")]
    public async Task<IActionResult> GetApproved()
    {
        var results = await salaryService.GetApprovedAsync();
        return Ok(results);
    }

    // PUT /salary/submissions/{id}/approve - internal, called by vote-service
    [HttpPut("submissions/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var success = await salaryService.ApproveAsync(id);
        if (!success) return NotFound(new { message = "Submission not found" });
        return Ok(new { message = "Submission approved" });
    }
}
