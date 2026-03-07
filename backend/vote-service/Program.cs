using Microsoft.EntityFrameworkCore;
using vote_service.Data;
using vote_service.Services;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<VoteDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddScoped<VoteService>();

var app = builder.Build();

app.MapControllers();

app.Run();