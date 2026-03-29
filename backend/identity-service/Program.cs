using System.Text;
using identity_service.Data;
using identity_service.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ── Database ────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<IdentityDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// ── Application services ────────────────────────────────────────────────────
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<identity_service.Services.IdentityService>();

// ── Controllers ─────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// ── JWT Authentication ───────────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "identity-service",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "techsalary-platform",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── Swagger / OpenAPI ────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TechSalary – Identity Service",
        Version = "v1",
        Description = """
            Manages user accounts, authentication tokens, and authorization for the
            TechSalary community platform.

            **Privacy guarantee:** email addresses and password hashes are stored only
            in the `identity` schema and are never exposed to other microservices.
            Other services receive only an opaque `userId`.
            """,
        Contact = new OpenApiContact { Name = "TechSalary Platform" }
    });

    // Enable XML doc comments for richer Swagger descriptions
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        c.IncludeXmlComments(xmlPath);

    // Add JWT bearer input to Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token. Example: `eyJhbGci...`"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ── Schema & table initialisation (runs on every startup) ───────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

    db.Database.ExecuteSqlRaw("CREATE SCHEMA IF NOT EXISTS identity");

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS identity.users (
            id             UUID          PRIMARY KEY,
            email          VARCHAR(320)  NOT NULL UNIQUE,
            password_hash  TEXT          NOT NULL,
            created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
            is_active      BOOLEAN       NOT NULL DEFAULT TRUE
        )
    """);

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS identity.refresh_tokens (
            id          UUID      PRIMARY KEY,
            user_id     UUID      NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
            token       TEXT      NOT NULL UNIQUE,
            expires_at  TIMESTAMP NOT NULL,
            created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
            is_revoked  BOOLEAN   NOT NULL DEFAULT FALSE
        )
    """);
}

// ── Middleware pipeline ──────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Identity Service v1");
    c.RoutePrefix = "swagger";               // available at /swagger
    c.DisplayRequestDuration();
    c.EnableDeepLinking();
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Simple health-check probe (used by Kubernetes readiness/liveness probes)
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "identity-service" }))
   .WithTags("Health")
   .ExcludeFromDescription();

app.Run();
