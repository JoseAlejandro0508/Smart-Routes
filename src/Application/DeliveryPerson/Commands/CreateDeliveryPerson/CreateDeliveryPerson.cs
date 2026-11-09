using Smart_Routes.Application.Common.Interfaces;
using Smart_Routes.Domain.Constants;
using Smart_Routes.Domain.Entities;
using Smart_Routes.Application.Common.Security;
namespace Smart_Routes.Application.DeliveryPersons.Commands.CreateDeliveryPerson;

[Authorize(Roles = Roles.Administrator)]
public record CreateDeliveryPersonCommand : IRequest
{
    public required string UserId { get; set; }

    public required DateOnly BirthDay { get; set; }
    public required string Fleet { get; set; }

}
public class CreateDeliveryPersonCommandHandler : IRequestHandler<CreateDeliveryPersonCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IRoleManager _roleManager;

    public CreateDeliveryPersonCommandHandler(IApplicationDbContext context, IRoleManager roleManager)
    {
        _context = context;
        _roleManager = roleManager;
    }

    public async Task Handle(CreateDeliveryPersonCommand request, CancellationToken cancellationToken)
    {
        if (!await _roleManager.UserExistsAsync(request.UserId))
        {
            throw new ValidationException("User does not exist");
        }
        var roles = await _roleManager.GetUserRoleAsync(request.UserId);

        if (roles.Count > 0)
        {
            throw new ValidationException("User has a role assigned");
        }

        var entity = new DeliveryPerson
        {
            UserId = request.UserId,

            DateOfBirth = request.BirthDay,
            Fleet = request.Fleet
        };

        _context.DeliveryPersons.Add(entity);
        await _roleManager.AddUserRoleAsync(request.UserId, Roles.DeliveryPerson);
        await _context.SaveChangesAsync(cancellationToken);


    }
}
