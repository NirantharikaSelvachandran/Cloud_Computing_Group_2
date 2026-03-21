using Microsoft.EntityFrameworkCore;
using salary_service.Models;

namespace salary_service.Data;

public class SalaryDbContext(DbContextOptions<SalaryDbContext> options) : DbContext(options)
{
    public DbSet<SalarySubmission> Submissions { get; set; }
}
