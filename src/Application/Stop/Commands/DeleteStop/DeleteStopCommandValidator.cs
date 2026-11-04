namespace Smart_Routes.Application.Stops.Commands.DeleteStop;

public class DeleteStopCommandValidator : AbstractValidator<DeleteStopCommand>
{
    public DeleteStopCommandValidator()
    {
        RuleFor(x => x.StopId)
            .GreaterThan(0);
    }
}
