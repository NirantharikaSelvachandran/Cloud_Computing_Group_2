namespace vote_service.Models;

public class Vote
{
    public Guid Id { get; set; }
    public Guid SalaryId { get; set; }
    public Guid UserId { get; set; }
    public string VoteType { get; set; } = "UP";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}