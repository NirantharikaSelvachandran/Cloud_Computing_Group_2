using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace identity_service.Models;

[Table("refresh_tokens", Schema = "identity")]
public class RefreshToken
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    [Required]
    public Guid UserId { get; set; }

    [Column("token")]
    [Required]
    public string Token { get; set; } = string.Empty;

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("is_revoked")]
    public bool IsRevoked { get; set; } = false;

    // Navigation
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
}
