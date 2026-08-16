using DatabaseDictionary.Core.Interfaces;
using DatabaseDictionary.Infrastructure.Data;
using DatabaseDictionary.Infrastructure.Repositories;
using DatabaseDictionary.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DatabaseDictionary")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:DatabaseDictionary in appsettings.json.");

builder.Services.AddSingleton<IDbConnectionFactory>(new SqlConnectionFactory(connectionString));
builder.Services.AddScoped<IHeaderRepository, HeaderRepository>();
builder.Services.AddScoped<IProgramUsageRepository, ProgramUsageRepository>();
builder.Services.AddSingleton<ITSqlGenerator, TSqlGenerator>();
builder.Services.AddScoped<ISchemaInspector, SchemaInspector>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

const string LocalAppCorsPolicy = "LocalAppCorsPolicy";
builder.Services.AddCors(options =>
{
    // This API only ever binds to localhost for a single-user desktop app (Electron renderer as the sole
    // client), so an open local CORS policy carries no realistic cross-origin risk here.
    options.AddPolicy(LocalAppCorsPolicy, policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(LocalAppCorsPolicy);
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

await SchemaInitializer.EnsureCreatedAsync(connectionString);

app.Run();
