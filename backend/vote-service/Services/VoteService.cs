using Microsoft.EntityFrameworkCore;
using vote_service.Data;
using vote_service.DTO;
using vote_service.Models;

namespace vote_service.Services;

public class VoteService(VoteDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration)
{
    public async Task<VoteResponse> AddVote(Guid salaryId, Guid userId, string voteType, string token)
    {
        var exists = await CheckSalaryExists(salaryId, token);

        if (!exists)
        {            
            return new VoteResponse
            {
                Success = false,
                ErrorMessage = "Salary Details not found"
            };
        }
        
        voteType = voteType.ToUpper();

        if (voteType != "UP" && voteType != "DOWN")
        {
            return new VoteResponse
            {
                Success = false,
                ErrorMessage = "Invalid vote type"
            };
        }

        var existing = await db.Votes
            .FirstOrDefaultAsync(v => v.SalaryId == salaryId && v.UserId == userId);

        if (existing != null)
        {
          
            if (existing.VoteType == voteType)
            {
                return new VoteResponse
                {
                    Success = false,
                    ErrorMessage = "Vote already exists"
                };
            }
            
            existing.VoteType = voteType;
        }
        else
        {
            // New vote
            var vote = new Vote
            {
                Id = Guid.NewGuid(),
                SalaryId = salaryId,
                UserId = userId,
                VoteType = voteType
            };

            db.Votes.Add(vote);
        }

        await db.SaveChangesAsync();

        // Check approval threshold
        if (voteType != "UP") return new VoteResponse { Success = true };
        {
            var upvotes = await db.Votes
                .CountAsync(v => v.SalaryId == salaryId && v.VoteType == "UP");

            var threshold = configuration.GetValue<int>("VoteSettings:ApprovalThreshold");

            if (upvotes < threshold) return new VoteResponse { Success = true };
            
            var response = await ApproveSalary(salaryId, token);

            if (!response.Success)
            {
                return response;
            }
        }

        return new VoteResponse { Success = true };
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
    
    private async Task<VoteResponse> ApproveSalary(Guid salaryId, string token)
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
            return new VoteResponse
            {
                Success = false,
                ErrorMessage = "Failed to approve salary submission"
            };
        }
        
        return new VoteResponse { Success = true };
    }
    
    private async Task<bool> CheckSalaryExists(Guid salaryId,  string token)
    {
        var salaryServiceUrl = configuration["Services:SalaryService"]
                               ?? throw new Exception("SalaryService URL not configured");

        var client = httpClientFactory.CreateClient();
        
        
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync(
            $"{salaryServiceUrl}/salary/{salaryId}"
        );

        return response.IsSuccessStatusCode;
    }
}