using Microsoft.EntityFrameworkCore;
using search_service.Models;

namespace search_service.Data
{
    public class SearchDbContext(DbContextOptions<SearchDbContext> options) : DbContext(options)
    {
        public DbSet<Salary> Submissions { get; set; }
    }
}
