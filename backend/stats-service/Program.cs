using Microsoft.EntityFrameworkCore;
using stats_service.Data;
using stats_service.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<StatsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddScoped<StatsService>();

var app = builder.Build();

app.MapControllers();

app.Run();