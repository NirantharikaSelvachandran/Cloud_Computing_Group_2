using Microsoft.EntityFrameworkCore;
using vote_service.Data;
using vote_service.Models;

namespace vote_service.Services;

public class VoteService(VoteDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration)
{
    public async Task<bool> AddVote(Guid salaryId, Guid userId, string voteType)
    {
        voteType = voteType.ToUpper();

        if (voteType != "UP" && voteType != "DOWN")
            throw new Exception("Invalid vote type");

        var existing = await db.Votes
            .FirstOrDefaultAsync(v => v.SalaryId == salaryId && v.UserId == userId);

        if (existing != null)
            return false;

        var vote = new Vote
        {
            Id = Guid.NewGuid(),
            SalaryId = salaryId,
            UserId = userId,
            VoteType = voteType
        };

        db.Votes.Add(vote);
        await db.SaveChangesAsync();

        // Check approval threshold
        if (voteType != "UP") return true;
        {
            var upvotes = await db.Votes
                .CountAsync(v => v.SalaryId == salaryId && v.VoteType == "UP");

            var threshold = configuration.GetValue<int>("VoteSettings:ApprovalThreshold");

            if (upvotes >= threshold)
            {
                await ApproveSalary(salaryId);
            }
        }

        return true;
    }

    public int CountUpVotes(Guid salaryId)
    {
        return db.Votes.Count(v => v.SalaryId == salaryId && v.VoteType == "UP");
    }

    public int CountDownVotes(Guid salaryId)
    {
        return db.Votes.Count(v => v.SalaryId == salaryId && v.VoteType == "DOWN");
    }
    
    private async Task ApproveSalary(Guid salaryId)
    {
        var salaryServiceUrl = configuration["Services:SalaryService"];

        var client = httpClientFactory.CreateClient();

        await client.PutAsync($"{salaryServiceUrl}/salary/submissions/{salaryId}/approve", null);
    }
}