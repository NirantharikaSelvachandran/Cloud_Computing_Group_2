using vote_service.Data;
using vote_service.Models;

namespace vote_service.Services;

public class VoteService(VoteDbContext db)
{
    public async Task<bool> AddVote(Guid salaryId, Guid userId, string voteType)
    {
        var existing = db.Votes
            .FirstOrDefault(v => v.SalaryId == salaryId && v.UserId == userId);

        if (existing != null)
        {
            return false;
        }

        var vote = new Vote
        {
            Id = Guid.NewGuid(),
            SalaryId = salaryId,
            UserId = userId,
            VoteType = voteType
        };

        db.Votes.Add(vote);
        await db.SaveChangesAsync();

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
}