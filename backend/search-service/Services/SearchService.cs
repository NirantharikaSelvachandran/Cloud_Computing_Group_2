using Microsoft.EntityFrameworkCore;
using search_service.Data;
using search_service.DTO;
using search_service.Models;

namespace search_service.Services
{
    public class SearchService(SearchDbContext db)
    {
        private static SalaryResponse ToResponse(Salary s) => new()
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

        public async Task<List<SalaryResponse>> SearchAsync(
        string? country,
        string? company,
        string? role,
        string? level,
        decimal? minAmount,
        decimal? maxAmount,
        int? minExperience,
        int? maxExperience)
        {
            IQueryable<Salary> query = db.Submissions;

            // Only approved
            query = query.Where(s => s.Status == "APPROVED");

            if (!string.IsNullOrWhiteSpace(country))
                query = query.Where(s => s.Country == country);

            if (!string.IsNullOrWhiteSpace(company))
                query = query.Where(s => s.Company == company);

            if (!string.IsNullOrWhiteSpace(role))
                query = query.Where(s => s.Role == role);

            if (!string.IsNullOrWhiteSpace(level))
                query = query.Where(s => s.Level == level);

            if (minAmount.HasValue)
                query = query.Where(s => s.Amount >= minAmount.Value);

            if (maxAmount.HasValue)
                query = query.Where(s => s.Amount <= maxAmount.Value);

            if (minExperience.HasValue)
                query = query.Where(s => s.ExperienceYears >= minExperience.Value);

            if (maxExperience.HasValue)
                query = query.Where(s => s.ExperienceYears <= maxExperience.Value);

            var results = await query
                .OrderByDescending(s => s.SubmittedAt)
                .ToListAsync();

            return results.Select(ToResponse).ToList();
        }
    }
}
