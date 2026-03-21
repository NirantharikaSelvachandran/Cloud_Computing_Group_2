using System.ComponentModel.DataAnnotations;

namespace salary_service.DTO;

public class SubmitSalaryRequest
{
    [Required]
    public string Country { get; set; } = string.Empty;

    [Required]
    public string Company { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;

    [Required]
    public string Level { get; set; } = string.Empty;

    [Required]
    public string Currency { get; set; } = string.Empty;

    [Range(1, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }

    [Required]
    [RegularExpression("yearly|monthly|hourly", ErrorMessage = "Period must be yearly, monthly, or hourly")]
    public string Period { get; set; } = string.Empty;

    public int? ExperienceYears { get; set; }

    public bool Anonymize { get; set; } = false;
}
