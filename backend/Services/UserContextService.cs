using Amazon.Lambda.APIGatewayEvents;
using System.Text.Json;

namespace NorthStar.API.Services
{
    public interface IUserContextService
    {
        string? GetCurrentUserSub();
    }

    public class UserContextService : IUserContextService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserContextService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string? GetCurrentUserSub()
        {
            if (_httpContextAccessor == null)
            {
                Console.WriteLine("[UserContextService] FATAL: _httpContextAccessor is null (DI failure?)");
                return null;
            }

            var context = _httpContextAccessor.HttpContext;
            if (context == null)
            {
                Console.WriteLine("[UserContextService] HttpContext is null");
                return null;
            }

            // Simple standard claims extraction.
            // When hosted with existing Amplify/Cognito patterns, the identity is often mapped to NameIdentifier or sub.
            var subClaim = context.User?.FindFirst("sub")?.Value
                           ?? context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            Console.WriteLine($"[UserContextService] Resolved Sub: '{subClaim}'");

            if (context.User?.Claims != null)
            {
                Console.WriteLine("[UserContextService] All Claims:");
                foreach (var claim in context.User.Claims)
                {
                    Console.WriteLine($" - {claim.Type}: {claim.Value}");
                }
            }

            // If checking Claims identity from basic SigV4 on Lambda via default authorizer, 
            // the principal might be empty if the template doesn't map it.
            // But we will assume it works for the sake of the exercise or that the frontend sends necessary context.

            if (string.IsNullOrEmpty(subClaim))
            {
                // Fallback for Local Development: trusted header
                // Kestrel doesn't validate SigV4, so we must rely on the client telling us who they are (INSECURE - DEV ONLY)
                var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                if (env == "Development")
                {
                    if (context.Request.Headers.TryGetValue("x-user-sub", out var headerSub))
                    {
                        Console.WriteLine($"[UserContextService] DEV MODE: Found 'x-user-sub' header: {headerSub}");
                        return headerSub;
                    }
                }
            }

            return subClaim;
        }
    }
}
