using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace search_service.Models
{
    [Table("submissions", Schema = "salary")]
    public class Salary
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
        public string Status { get; set; }  // PENDING / APPROVED
        public bool Anonymize { get; set; }
    }
}
