using Microsoft.EntityFrameworkCore;
using stats_service.Data;
using stats_service.DTO;

namespace stats_service.Services;

public class StatsService(StatsDbContext db)
{
    // 1 unit of currency = X LKR
    private static readonly Dictionary<string, decimal> ToLkr = new(StringComparer.OrdinalIgnoreCase)
    {
        ["LKR"] = 1m,
        ["USD"] = 300m,
        ["EUR"] = 330m,
        ["GBP"] = 385m,
        ["INR"] = 3.6m,
        ["AUD"] = 192m,
        ["CAD"] = 218m,
    };

    // Multiplier to convert any period to monthly
    private static readonly Dictionary<string, decimal> ToMonthly = new(StringComparer.OrdinalIgnoreCase)
    {
        ["monthly"] = 1m,
        ["yearly"]  = 1m / 12m,
        ["hourly"]  = 160m,   // ~160 working hours/month
    };

    // Convert from monthly LKR to the desired output period
    private static readonly Dictionary<string, decimal> FromMonthly = new(StringComparer.OrdinalIgnoreCase)
    {
        ["monthly"] = 1m,
        ["yearly"]  = 12m,
        ["hourly"]  = 1m / 160m,
    };

    /// <summary>Normalise a submission amount to monthly LKR.</summary>
    private static decimal? ToMonthlyLkr(decimal amount, string currency, string period)
    {
        if (!ToLkr.TryGetValue(currency, out var lkrRate)) return null;
        if (!ToMonthly.TryGetValue(period, out var periodRate)) return null;
        return amount * lkrRate * periodRate;
    }

    public async Task<StatsResponse?> GetStatsAsync(
        string? country,
        string? role,
        string? outputCurrency,
        string? outputPeriod)
    {
        var targetCurrency = string.IsNullOrWhiteSpace(outputCurrency) ? "LKR" : outputCurrency.ToUpper().Trim();
        var targetPeriod   = string.IsNullOrWhiteSpace(outputPeriod)   ? "monthly" : outputPeriod.ToLower().Trim();

        if (!ToLkr.ContainsKey(targetCurrency))
            targetCurrency = "LKR";
        if (!FromMonthly.ContainsKey(targetPeriod))
            targetPeriod = "monthly";

        var query = db.Submissions.Where(s => s.Status == "APPROVED");

        if (!string.IsNullOrWhiteSpace(country))
            query = query.Where(s => s.Country.ToLower().Contains(country.ToLower().Trim()));

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(s => s.Role.ToLower().Contains(role.ToLower().Trim()));

        var submissions = await query
            .Select(s => new { s.Amount, s.Currency, s.Period })
            .ToListAsync();

        // Step 1: normalise everything to monthly LKR
        var monthlyLkrAmounts = submissions
            .Select(s => ToMonthlyLkr(s.Amount, s.Currency, s.Period))
            .Where(a => a.HasValue)
            .Select(a => a!.Value)
            .OrderBy(a => a)
            .ToList();

        if (monthlyLkrAmounts.Count == 0)
            return null;

        // Step 2: convert results from monthly LKR → target currency + target period
        var lkrRate      = ToLkr[targetCurrency];
        var periodFactor = FromMonthly[targetPeriod];
        decimal Convert(decimal monthlyLkr) =>
            Math.Round(monthlyLkr / lkrRate * periodFactor, 2);

        return new StatsResponse
        {
            Count    = monthlyLkrAmounts.Count,
            Currency = targetCurrency,
            Period   = targetPeriod,
            Average  = Convert(monthlyLkrAmounts.Average()),
            Median   = Convert(Percentile(monthlyLkrAmounts, 50)),
            P25      = Convert(Percentile(monthlyLkrAmounts, 25)),
            P75      = Convert(Percentile(monthlyLkrAmounts, 75)),
            P90      = Convert(Percentile(monthlyLkrAmounts, 90)),
        };
    }

    private static decimal Percentile(List<decimal> sorted, double p)
    {
        double index = (p / 100.0) * (sorted.Count - 1);
        int lower = (int)Math.Floor(index);
        int upper = (int)Math.Ceiling(index);
        if (lower == upper) return sorted[lower];
        decimal fraction = (decimal)(index - lower);
        return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
    }
}
