using Microsoft.EntityFrameworkCore;
using vote_service.Data;
using vote_service.Models;

namespace vote_service.Services;

public class VoteService(VoteDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration)
{
    public async Task<bool> AddVote(Guid salaryId, Guid userId, string voteType, string token)
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
                await ApproveSalary(salaryId, token);
            }
        }

        return true;
    }

    public async Task<int> CountUpVotes(Guid salaryId)
    {
        return await db.Votes
            .CountAsync(v => v.SalaryId == salaryId && v.VoteType == "UP");
    }

    public async Task<int> CountDownVotes(Guid salaryId)
    {
        return await db.Votes
            .CountAsync(v => v.SalaryId == salaryId && v.VoteType == "DOWN");
    }
    
    private async Task ApproveSalary(Guid salaryId, string token)
    {
        var salaryServiceUrl = configuration["Services:SalaryService"] 
                               ?? throw new Exception("SalaryService URL not configured");

        var client = httpClientFactory.CreateClient();
        
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await client.PutAsync(
            $"{salaryServiceUrl}/salary/submissions/{salaryId}/approve",
            null
        );

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception("Failed to approve salary");
        }
    }
}