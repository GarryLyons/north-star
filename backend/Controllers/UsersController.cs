using Microsoft.AspNetCore.Mvc;
using NorthStar.API.Models;
using NorthStar.API.Services;
using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using Amazon.DynamoDBv2.Model;

namespace NorthStar.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly IAmazonCognitoIdentityProvider _cognitoClient;
        private readonly DynamoDbService _dynamoDb;
        private readonly IConfiguration _configuration;
        private readonly ILogger<UsersController> _logger;
        private readonly AuthorizationService _authorizationService;

        public UsersController(
            IAmazonCognitoIdentityProvider cognitoClient,
            DynamoDbService dynamoDb,
            IConfiguration configuration,
            ILogger<UsersController> logger,
            AuthorizationService authorizationService)
        {
            _cognitoClient = cognitoClient;
            _dynamoDb = dynamoDb;
            _configuration = configuration;
            _logger = logger;
            _authorizationService = authorizationService;
        }

        [HttpPost("invite")]
        public async Task<IActionResult> InviteUser([FromBody] InviteUserRequest request)
        {
            if (string.IsNullOrEmpty(request.Email)) return BadRequest("Email is required.");

            if (string.IsNullOrEmpty(request.DisplayName))
            {
                request.DisplayName = $"{request.FirstName} {request.LastName}".Trim();
                if (string.IsNullOrEmpty(request.DisplayName)) return BadRequest("DisplayName is required.");
            }

            // --- Server-side Validation Rules ---
            var role = request.Role?.ToLowerInvariant();
            var scope = request.Scope;
            var permissions = request.Permissions ?? new List<string>();

            if (role == UserRoles.SuperAdmin)
            {
                if (permissions.Any())
                {
                    return BadRequest("Super Admin does not require explicit permissions flags.");
                }
                scope = "global";
            }
            else if (role == UserRoles.InstitutionUser)
            {
                if (string.IsNullOrEmpty(scope) || (!scope.StartsWith("inst:") && scope != "global"))
                {
                    if (string.IsNullOrEmpty(scope)) return BadRequest("Institution User requires a valid Scope (InstitutionId).");
                }

                if (!permissions.Contains(UserPermissions.View)) permissions.Add(UserPermissions.View);
                if (!permissions.Contains(UserPermissions.EditPathway)) permissions.Add(UserPermissions.EditPathway);
            }
            else if (role == UserRoles.DepartmentUser)
            {
                if (string.IsNullOrEmpty(scope)) return BadRequest("Department User requires a valid Scope (DepartmentId).");

                if (!permissions.Contains(UserPermissions.View)) permissions.Add(UserPermissions.View);

                var safeDepartmentFlags = new HashSet<string> { UserPermissions.View, UserPermissions.EditPathway, UserPermissions.CreatePathway };
                var invalidDeptFlags = permissions.Where(p => !safeDepartmentFlags.Contains(p)).ToList();
                if (invalidDeptFlags.Any())
                {
                    return BadRequest($"Invalid permissions for Department User: {string.Join(", ", invalidDeptFlags)}");
                }
            }
            else if (role == UserRoles.PathwayUser)
            {
                if (string.IsNullOrEmpty(scope)) return BadRequest("Pathway User requires a valid Scope (PathwayIds).");

                var allowedPathwayFlags = new HashSet<string> { UserPermissions.View, UserPermissions.EditPathway };
                var invalidPathwayFlags = permissions.Where(p => !allowedPathwayFlags.Contains(p)).ToList();
                if (invalidPathwayFlags.Any())
                {
                    return BadRequest($"Pathway User cannot have permissions: {string.Join(", ", invalidPathwayFlags)}");
                }

                if (!permissions.Contains(UserPermissions.View)) permissions.Add(UserPermissions.View);
                if (!permissions.Contains(UserPermissions.EditPathway)) permissions.Add(UserPermissions.EditPathway);
            }
            else
            {
                return BadRequest($"Invalid Role: {request.Role}. Valid roles: {UserRoles.SuperAdmin}, {UserRoles.InstitutionUser}, {UserRoles.DepartmentUser}, {UserRoles.PathwayUser}");
            }

            request.Scope = scope;
            request.Permissions = permissions;

            return await ExecuteInviteAsync(request.Email, request.FirstName, request.LastName, request.DisplayName, role, request.Scope, request.Permissions);
        }

        [HttpPost("invite/institution")]
        public async Task<IActionResult> InviteInstitutionUser([FromBody] CreateInstitutionUserRequest request)
        {
            if (string.IsNullOrEmpty(request.Email)) return BadRequest("Email is required.");
            if (string.IsNullOrEmpty(request.InstitutionId)) return BadRequest("InstitutionId is required.");

            if (string.IsNullOrEmpty(request.DisplayName))
            {
                request.DisplayName = $"{request.FirstName} {request.LastName}".Trim();
                if (string.IsNullOrEmpty(request.DisplayName)) return BadRequest("DisplayName is required.");
            }

            var permissions = new List<string>
            {
                UserPermissions.View,
                UserPermissions.EditPathway
            };

            if (request.CanCreateUser) permissions.Add(UserPermissions.CreateUser);
            if (request.CanCreateDepartment) permissions.Add(UserPermissions.CreateDepartment);
            if (request.CanCreatePathway) permissions.Add(UserPermissions.CreatePathway);
            if (request.CanManagePermissions) permissions.Add(UserPermissions.ManagePermissions);

            var scope = request.InstitutionId.StartsWith("inst:") ? request.InstitutionId : $"inst:{request.InstitutionId}";

            return await ExecuteInviteAsync(request.Email, request.FirstName, request.LastName, request.DisplayName, UserRoles.InstitutionUser, scope, permissions);
        }

        [HttpPost("invite/department")]
        public async Task<IActionResult> InviteDepartmentUser([FromBody] CreateDepartmentUserRequest request)
        {
            if (string.IsNullOrEmpty(request.Email)) return BadRequest("Email is required.");
            if (string.IsNullOrEmpty(request.DepartmentId)) return BadRequest("DepartmentId is required.");

            if (string.IsNullOrEmpty(request.DisplayName))
            {
                request.DisplayName = $"{request.FirstName} {request.LastName}".Trim();
                if (string.IsNullOrEmpty(request.DisplayName)) return BadRequest("DisplayName is required.");
            }

            var permissions = new List<string>
            {
                UserPermissions.View,
                UserPermissions.EditPathway
            };

            // Optional Toggles
            if (request.CanCreatePathway) permissions.Add(UserPermissions.CreatePathway);
            if (request.CanCreateUser) permissions.Add(UserPermissions.CreateUser);

            var scope = request.DepartmentId.StartsWith("dept:") ? request.DepartmentId : $"dept:{request.DepartmentId}";

            return await ExecuteInviteAsync(request.Email, request.FirstName, request.LastName, request.DisplayName, UserRoles.DepartmentUser, scope, permissions);
        }

        [HttpPost("invite/pathway")]
        public async Task<IActionResult> InvitePathwayUser([FromBody] CreatePathwayUserRequest request)
        {
            if (string.IsNullOrEmpty(request.Email)) return BadRequest("Email is required.");
            if (request.PathwayIds == null || !request.PathwayIds.Any()) return BadRequest("At least one PathwayId is required.");

            if (string.IsNullOrEmpty(request.DisplayName))
            {
                request.DisplayName = $"{request.FirstName} {request.LastName}".Trim();
                if (string.IsNullOrEmpty(request.DisplayName)) return BadRequest("DisplayName is required.");
            }

            var permissions = new List<string>
            {
                UserPermissions.View,
                UserPermissions.EditPathway
            };

            // Scope: Composite "pathway:id1,id2"
            var scope = $"pathway:{string.Join(",", request.PathwayIds)}";

            return await ExecuteInviteAsync(request.Email, request.FirstName, request.LastName, request.DisplayName, UserRoles.PathwayUser, scope, permissions);
        }

        private async Task<IActionResult> ExecuteInviteAsync(string email, string firstName, string lastName, string displayName, string role, string scope, List<string> permissions)
        {
            var userPoolId = _configuration["AWS:UserPoolId"];
            if (string.IsNullOrEmpty(userPoolId))
            {
                _logger.LogError("AWS:UserPoolId is missing in configuration.");
                return StatusCode(500, "Server configuration error.");
            }

            try
            {
                _logger.LogInformation("Inviting user {Email} with Role {Role}", email, role);

                var createUserRequest = new AdminCreateUserRequest
                {
                    UserPoolId = userPoolId,
                    Username = email,
                    UserAttributes = new List<AttributeType>
                    {
                        new AttributeType { Name = "email", Value = email },
                        new AttributeType { Name = "email_verified", Value = "true" },
                        new AttributeType { Name = "given_name", Value = firstName },
                        new AttributeType { Name = "family_name", Value = lastName },
                        new AttributeType { Name = "name", Value = displayName }
                    },
                    DesiredDeliveryMediums = new List<string> { "EMAIL" },
                    MessageAction = null
                };

                AdminCreateUserResponse cognitoResponse;
                try
                {
                    cognitoResponse = await _cognitoClient.AdminCreateUserAsync(createUserRequest);
                }
                catch (UsernameExistsException)
                {
                    _logger.LogInformation("User {Email} already exists. Resending invitation.", email);
                    cognitoResponse = await _cognitoClient.AdminCreateUserAsync(new AdminCreateUserRequest
                    {
                        UserPoolId = userPoolId,
                        Username = email,
                        MessageAction = MessageActionType.RESEND
                    });
                }

                var sub = cognitoResponse.User.Attributes.FirstOrDefault(a => a.Name == "sub")?.Value
                          ?? cognitoResponse.User.Username;

                var userItem = new Dictionary<string, AttributeValue>
                {
                    { "PK", new AttributeValue { S = $"USER#{sub}" } },
                    { "SK", new AttributeValue { S = "METADATA" } },
                    { "EntityType", new AttributeValue { S = "User" } },
                    { "Email", new AttributeValue { S = email } },
                    { "DisplayName", new AttributeValue { S = displayName } },
                    { "FirstName", new AttributeValue { S = firstName } },
                    { "LastName", new AttributeValue { S = lastName } },
                    { "Role", new AttributeValue { S = role } },
                    { "Scope", new AttributeValue { S = scope } },
                    { "InvitedAt", new AttributeValue { S = DateTime.UtcNow.ToString("O") } },
                    { "Status", new AttributeValue { S = cognitoResponse.User.UserStatus.Value } }
                };

                if (permissions != null && permissions.Any())
                {
                    userItem.Add("Permissions", new AttributeValue { SS = permissions });
                }

                await _dynamoDb.PutItemAsync(userItem);

                _logger.LogInformation("USER_INVITED: User {Sub} ({Email}) invited by system. Role: {Role}, Scope: {Scope}, Permissions: {Permissions}",
                    sub, email, role, scope, string.Join(",", permissions));

                return Ok(new
                {
                    Message = "User invited successfully",
                    UserId = sub,
                    Status = cognitoResponse.User.UserStatus.Value
                });

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inviting user {Email}", email);
                return StatusCode(500, $"Error inviting user: {ex.Message}");
            }
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var user = await _authorizationService.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            return Ok(new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.DisplayName,
                user.Role,
                user.Scope,
                user.Permissions
            });
        }
    }
}
