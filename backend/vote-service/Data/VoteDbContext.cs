using Microsoft.EntityFrameworkCore;
using vote_service.Models;

namespace vote_service.Data;

public class VoteDbContext(DbContextOptions<VoteDbContext> options) : DbContext(options)
{
    public DbSet<Vote> Votes { get; set; }
}