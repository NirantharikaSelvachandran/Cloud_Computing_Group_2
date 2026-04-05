using Microsoft.EntityFrameworkCore;
using search_service.Data;
using search_service.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<SearchDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddScoped<SearchService>();

var app = builder.Build();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();