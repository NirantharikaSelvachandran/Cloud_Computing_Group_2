using System.ComponentModel.DataAnnotations.Schema;

namespace stats_service.Models;

[Table("submissions", Schema = "salary")]
public class SalaryRecord
{
    public Guid Id { get; set; }

    [Column("country")]
    public string Country { get; set; } = "";

    [Column("company")]
    public string Company { get; set; } = "";

    [Column("role")]
    public string Role { get; set; } = "";

    [Column("level")]
    public string Level { get; set; } = "";

    [Column("currency")]
    public string Currency { get; set; } = "";

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("period")]
    public string Period { get; set; } = "";

    [Column("experience_years")]
    public int? ExperienceYears { get; set; }

    [Column("submitted_at")]
    public DateTime SubmittedAt { get; set; }

    [Column("status")]
    public string Status { get; set; } = "";

    [Column("anonymize")]
    public bool Anonymize { get; set; }
}
