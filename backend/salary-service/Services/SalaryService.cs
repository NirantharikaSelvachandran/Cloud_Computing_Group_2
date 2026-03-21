using Microsoft.EntityFrameworkCore;
using salary_service.Data;
using salary_service.DTO;
using salary_service.Models;

namespace salary_service.Services;

public class SalaryService(SalaryDbContext db)
{
    private static SalaryResponse ToResponse(SalarySubmission s) => new()
    {
        Id = s.Id,
        Country = s.Country,
        Company = s.Anonymize ? "Anonymous" : s.Company,
        Role = s.Role,
        Level = s.Level,
        Currency = s.Currency,
        Amount = s.Amount,
        Period = s.Period,
        ExperienceYears = s.ExperienceYears,
        SubmittedAt = s.SubmittedAt,
        Status = s.Status
    };

    public async Task<SalaryResponse> SubmitAsync(SubmitSalaryRequest request)
    {
        var submission = new SalarySubmission
        {
            Id = Guid.NewGuid(),
            Country = request.Country.Trim(),
            Company = request.Company.Trim(),
            Role = request.Role.Trim(),
            Level = request.Level.Trim(),
            Currency = request.Currency.Trim().ToUpper(),
            Amount = request.Amount,
            Period = request.Period.ToLower(),
            ExperienceYears = request.ExperienceYears,
            SubmittedAt = DateTime.UtcNow,
            Status = "PENDING",
            Anonymize = request.Anonymize
        };

        db.Submissions.Add(submission);
        await db.SaveChangesAsync();

        return ToResponse(submission);
    }

    public async Task<List<SalaryResponse>> GetAllAsync()
    {
        var submissions = await db.Submissions
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        return submissions.Select(ToResponse).ToList();
    }

    public async Task<SalaryResponse?> GetByIdAsync(Guid id)
    {
        var submission = await db.Submissions.FindAsync(id);
        return submission is null ? null : ToResponse(submission);
    }

    public async Task<List<SalaryResponse>> GetApprovedAsync()
    {
        var submissions = await db.Submissions
            .Where(s => s.Status == "APPROVED")
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        return submissions.Select(ToResponse).ToList();
    }

    public async Task<bool> ApproveAsync(Guid id)
    {
        var submission = await db.Submissions.FindAsync(id);
        if (submission is null) return false;

        submission.Status = "APPROVED";
        await db.SaveChangesAsync();
        return true;
    }
}
