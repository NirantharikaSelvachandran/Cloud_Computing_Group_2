using Microsoft.AspNetCore.Mvc;
using vote_service.DTO;
using vote_service.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace vote_service.Controllers;

[Authorize]
[ApiController]
[Route("votes")]
public class VotesController(VoteService voteService) : ControllerBase
{
  
    [HttpPost]
    public async Task<IActionResult> Vote(VoteRequest request)
    {
        
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();
        
        var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        
        var success = await voteService.AddVote(
            request.SalaryId,
            userId,
            request.VoteType,
            token
        );

        if (!success.Success)
            return BadRequest(new { message = success.ErrorMessage });

        return Ok(new { message = "Vote recorded" });
    }

    [HttpGet("{salaryId}")]
    public async Task<IActionResult> GetVotes(Guid salaryId)
    {
        var up = await voteService.CountUpVotes(salaryId);
        var down = await voteService.CountDownVotes(salaryId);

        return Ok(new
        {
            salaryId,
            upvotes = up,
            downvotes = down
        });
    }
}