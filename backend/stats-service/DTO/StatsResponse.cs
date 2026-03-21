namespace stats_service.DTO;

public class StatsResponse
{
    public int Count { get; set; }
    public string? Currency { get; set; }
    public string? Period { get; set; }
    public decimal Average { get; set; }
    public decimal Median { get; set; }
    public decimal P25 { get; set; }
    public decimal P75 { get; set; }
    public decimal P90 { get; set; }
}
