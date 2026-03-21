using Microsoft.EntityFrameworkCore;
using stats_service.Data;
using stats_service.DTO;

namespace stats_service.Services;

public class StatsService(StatsDbContext db)
{
    public async Task<StatsResponse?> GetStatsAsync(
        string? country,
        string? role,
        string? currency,
        string? period)
    {
        var query = db.Submissions
            .Where(s => s.Status == "APPROVED");

        if (!string.IsNullOrWhiteSpace(country))
            query = query.Where(s => s.Country.ToLower() == country.ToLower().Trim());

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(s => s.Role.ToLower() == role.ToLower().Trim());

        if (!string.IsNullOrWhiteSpace(currency))
            query = query.Where(s => s.Currency.ToUpper() == currency.ToUpper().Trim());

        if (!string.IsNullOrWhiteSpace(period))
            query = query.Where(s => s.Period.ToLower() == period.ToLower().Trim());

        var amounts = await query
            .OrderBy(s => s.Amount)
            .Select(s => s.Amount)
            .ToListAsync();

        if (amounts.Count == 0)
            return null;

        return new StatsResponse
        {
            Count = amounts.Count,
            Currency = currency?.ToUpper().Trim(),
            Period = period?.ToLower().Trim(),
            Average = Math.Round(amounts.Average(), 2),
            Median = Percentile(amounts, 50),
            P25 = Percentile(amounts, 25),
            P75 = Percentile(amounts, 75),
            P90 = Percentile(amounts, 90)
        };
    }

    private static decimal Percentile(List<decimal> sorted, double p)
    {
        double index = (p / 100.0) * (sorted.Count - 1);
        int lower = (int)Math.Floor(index);
        int upper = (int)Math.Ceiling(index);
        if (lower == upper) return sorted[lower];
        decimal fraction = (decimal)(index - lower);
        return Math.Round(sorted[lower] + fraction * (sorted[upper] - sorted[lower]), 2);
    }
}
