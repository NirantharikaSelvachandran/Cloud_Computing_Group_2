namespace search_service.DTO
{
    public class SalaryResponse
    {
        public Guid Id { get; set; }
        public string Country { get; set; }
        public string Company { get; set; }
        public string Role { get; set; }
        public string Level { get; set; }
        public string Currency { get; set; }
        public decimal Amount { get; set; }
        public string Period { get; set; }
        public int? ExperienceYears { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string Status { get; set; }
    }
}
