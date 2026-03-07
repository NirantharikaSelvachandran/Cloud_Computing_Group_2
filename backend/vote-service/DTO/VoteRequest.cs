namespace vote_service.DTO;

public class VoteRequest
{
    public Guid SalaryId { get; set; }
    public Guid UserId { get; set; }
    public string VoteType { get; set; } = "UP";
}