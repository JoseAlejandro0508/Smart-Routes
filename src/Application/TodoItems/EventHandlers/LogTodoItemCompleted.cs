using Smart_Routes.Domain.Events;
using Microsoft.Extensions.Logging;

namespace Smart_Routes.Application.TodoItems.EventHandlers;

public class LogTodoItemCompleted : INotificationHandler<TodoItemCompletedEvent>
{
    private readonly ILogger<LogTodoItemCompleted> _logger;

    public LogTodoItemCompleted(ILogger<LogTodoItemCompleted> logger)
    {
        _logger = logger;
    }

    public Task Handle(TodoItemCompletedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Smart_Routes Domain Event: {DomainEvent}", notification.GetType().Name);

        return Task.CompletedTask;
    }
}
