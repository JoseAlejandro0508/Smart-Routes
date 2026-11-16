using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Infrastructure.Data;
using Smart_Routes.Infrastructure.Data.Interceptors;
using Smart_Routes.Infrastructure.Data.Repositories;
using Smart_Routes.Infrastructure.Identity;
using Smart_Routes.Infrastructure.Maps;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static void AddInfrastructureServices(this IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString(Services.Database);
        Guard.Against.Null(connectionString, message: $"Connection string '{Services.Database}' not found.");

        builder.Services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();
        builder.Services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();

        builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
            options.UseSqlServer(connectionString);
            options.ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
        });

        builder.EnrichSqlServerDbContext<ApplicationDbContext>();

        builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        builder.Services.AddScoped<IOrderRepository, OrderRepository>();

        builder.Services.AddScoped<ApplicationDbContextInitialiser>();

        AddMapServices(builder);

        builder.Services.AddAuthentication(options =>
            {
                options.DefaultScheme = IdentityConstants.ApplicationScheme;
                options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
            })
            .AddIdentityCookies();

        builder.Services.AddAuthorizationBuilder();

        builder.Services
            .AddIdentityCore<ApplicationUser>(options => options.User.RequireUniqueEmail = true)
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders()
            .AddApiEndpoints();

        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddTransient<IIdentityService, IdentityService>();
    }

    /// <summary>
    /// Registers the OpenStreetMap services: OSRM for the road network and Nominatim for geocoding.
    /// </summary>
    private static void AddMapServices(IHostApplicationBuilder builder)
    {
        var section = builder.Configuration.GetSection(MapServicesOptions.SectionName);
        builder.Services.Configure<MapServicesOptions>(section);
        var options = section.Get<MapServicesOptions>() ?? new MapServicesOptions();

        builder.Services.AddMemoryCache();

        builder.Services.AddHttpClient<IRoadNetworkService, OsrmRoadNetworkService>(OsrmClient, client => ConfigureMapClient(client, options));
        builder.Services.AddHttpClient<IGeocodingService, NominatimGeocodingService>(NominatimClient, client => ConfigureMapClient(client, options));

        // ServiceDefaults adds a standard resilience handler to every HttpClient, with a 10 s attempt timeout.
        // The public OSRM server can take longer than that, so these clients get their own limits.
        foreach (var clientName in new[] { OsrmClient, NominatimClient })
        {
            builder.Services.Configure<HttpStandardResilienceOptions>($"{clientName}-standard", resilience =>
            {
                resilience.AttemptTimeout.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
                resilience.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds * 2 + 5);
                resilience.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(options.TimeoutSeconds * 2 + 5);
                resilience.Retry.MaxRetryAttempts = 1;
            });
        }
    }

    private const string OsrmClient = "osrm";
    private const string NominatimClient = "nominatim";

    private static void ConfigureMapClient(HttpClient client, MapServicesOptions options)
    {
        client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds * 2 + 10);
        client.DefaultRequestHeaders.UserAgent.ParseAdd(options.UserAgent);
        client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
    }
}
