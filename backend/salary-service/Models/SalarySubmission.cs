using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace salary_service.Models;

[Table("submissions", Schema = "salary")]
public class SalarySubmission
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("country")]
    [Required]
    public string Country { get; set; } = string.Empty;

    [Column("company")]
    [Required]
    public string Company { get; set; } = string.Empty;

    [Column("role")]
    [Required]
    public string Role { get; set; } = string.Empty;

    [Column("level")]
    [Required]
    public string Level { get; set; } = string.Empty;

    [Column("currency")]
    [Required]
    public string Currency { get; set; } = string.Empty;

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("period")]
    [Required]
    public string Period { get; set; } = string.Empty; // yearly | monthly | hourly

    [Column("experience_years")]
    public int? ExperienceYears { get; set; }

    [Column("submitted_at")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    [Column("status")]
    public string Status { get; set; } = "PENDING"; // PENDING | APPROVED

    [Column("anonymize")]
    public bool Anonymize { get; set; } = false;
}
