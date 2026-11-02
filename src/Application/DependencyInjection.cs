using System.Reflection;
using Smart_Routes.Application.Common.Behaviours;
using Smart_Routes.Domain.Factories;
using Smart_Routes.Domain.Services;
using Microsoft.Extensions.Hosting;

namespace Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static void AddApplicationServices(this IHostApplicationBuilder builder)
    {
        builder.Services.AddAutoMapper(cfg => 
            cfg.AddMaps(Assembly.GetExecutingAssembly()));

        builder.Services.AddSingleton<OrderFactory>();

        builder.Services.AddSingleton<IRouteBalanceMetricStrategy, OrderCountStrategy>();
        builder.Services.AddSingleton<IRouteBalanceMetricStrategy, DeliveryTypeProportionStrategy>();
        builder.Services.AddSingleton<IRouteBalanceMetricStrategy, ZoneCountStrategy>();
        builder.Services.AddSingleton<IRouteBalanceMetricStrategy, TotalWeightStrategy>();
        builder.Services.AddSingleton<IRouteBalanceMetricStrategy, StopCountStrategy>();
        builder.Services.AddSingleton<RouteBalanceMetricCalculator>();

        builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        builder.Services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            cfg.AddOpenRequestPreProcessor(typeof(LoggingBehaviour<>));
            cfg.AddOpenBehavior(typeof(UnhandledExceptionBehaviour<,>));
            cfg.AddOpenBehavior(typeof(AuthorizationBehaviour<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehaviour<,>));
            cfg.AddOpenBehavior(typeof(PerformanceBehaviour<,>));
        });
    }
}
