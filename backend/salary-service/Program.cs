using Microsoft.EntityFrameworkCore;
using salary_service.Data;
using salary_service.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<SalaryDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddScoped<SalaryService>();

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

app.MapControllers();

app.Run();