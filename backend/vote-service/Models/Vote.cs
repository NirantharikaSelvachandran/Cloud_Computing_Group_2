using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace vote_service.Models;

[Table("votes", Schema = "community")]
public class Vote
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("salary_id")]
    public Guid SalaryId { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("vote_type")]
    public string VoteType { get; set; } = "UP";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}