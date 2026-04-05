namespace vote_service.DTO;

public class VoteResponse
{
    public bool Success { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
}