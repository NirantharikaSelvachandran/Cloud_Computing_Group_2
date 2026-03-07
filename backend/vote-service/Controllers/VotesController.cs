using Microsoft.AspNetCore.Mvc;
using vote_service.DTO;
using vote_service.Services;

namespace vote_service.Controllers;

[ApiController]
[Route("votes")]
public class VotesController(VoteService voteService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Vote(VoteRequest request)
    {
        var success = await voteService.AddVote(
            request.SalaryId,
            request.UserId,
            request.VoteType
        );

        if (!success)
            return BadRequest("User already voted");

        return Ok(new { message = "Vote recorded" });
    }

    [HttpGet("{salaryId}")]
    public IActionResult GetVotes(Guid salaryId)
    {
        var up = voteService.CountUpVotes(salaryId);
        var down = voteService.CountDownVotes(salaryId);

        return Ok(new
        {
            salaryId,
            upvotes = up,
            downvotes = down
        });
    }
}