namespace salary_service.DTO;

public class SalaryResponse
{
    public Guid Id { get; set; }
    public string Country { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;  // "Anonymous" if anonymize=true
    public string Role { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Period { get; set; } = string.Empty;
    public int? ExperienceYears { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string Status { get; set; } = string.Empty;
}
