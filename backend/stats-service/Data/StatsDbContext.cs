using Microsoft.EntityFrameworkCore;
using stats_service.Models;

namespace stats_service.Data;

public class StatsDbContext(DbContextOptions<StatsDbContext> options) : DbContext(options)
{
    public DbSet<SalaryRecord> Submissions { get; set; }
}
