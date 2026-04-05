using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using salary_service.Data;
using salary_service.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<SalaryDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddScoped<SalaryService>();

// ── JWT Authentication ───────────────────────────────────────────────────────
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.Authority = builder.Configuration["Jwt:Authority"];
        options.Audience = builder.Configuration["Jwt:Audience"];
        options.RequireHttpsMetadata = false;
    });

builder.Services.AddAuthorization();

// ── Swagger ──────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Salary Submission Service API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
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
            []
        }
    });
});

var app = builder.Build();

// Ensure salary schema and table exist on startup (safe to run on every start)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SalaryDbContext>();
    db.Database.ExecuteSqlRaw("CREATE SCHEMA IF NOT EXISTS salary");
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS salary.submissions (
            id UUID PRIMARY KEY,
            country VARCHAR(100) NOT NULL,
            company VARCHAR(200) NOT NULL,
            role VARCHAR(200) NOT NULL,
            level VARCHAR(50) NOT NULL,
            currency VARCHAR(10) NOT NULL,
            amount NUMERIC(18,2) NOT NULL,
            period VARCHAR(20) NOT NULL,
            experience_years INT,
            submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            anonymize BOOLEAN NOT NULL DEFAULT FALSE
        )
    """);
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check probe (used by Kubernetes readiness/liveness probes)
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "salary-service" }));

app.Run();