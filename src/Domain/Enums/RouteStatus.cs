namespace Smart_Routes.Domain.Enums;

/// <summary>
/// Status of RUTA (RF-12). It is derived from the route's latest REVISION and is never stored:
/// no reviews means pending approval; an approved review means approved; a rejected review
/// means in modification if it indicates parameters (re-confection request), otherwise rejected.
/// </summary>
public enum RouteStatus
{
    PendingApproval = 0,
    Approved = 1,
    Rejected = 2,
    InModification = 3
}
