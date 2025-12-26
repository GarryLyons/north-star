using Microsoft.AspNetCore.Mvc;
using NorthStar.API.Models;
using NorthStar.API.Services;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Logging;

namespace NorthStar.API.Controllers
{
    [ApiController]
    [Route("api/v1/departments/{departmentId}/pathways")]
    public class PathwayController : ControllerBase
    {
        private readonly DynamoDbService _dynamoDb;
        private readonly AuthorizationService _authService; // Injected
        private readonly ILogger<PathwayController> _logger;

        public PathwayController(DynamoDbService dynamoDb, AuthorizationService authService, ILogger<PathwayController> logger)
        {
            _dynamoDb = dynamoDb;
            _authService = authService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePathway(string departmentId, [FromBody] Pathway pathway)
        {
            // 1. AuthZ Check
            var user = await _authService.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // Check if user has permission to view/access this department container
            if (!await _authService.CanAccessDepartmentAsync(user, departmentId)) return Forbid();

            // Check explicit CREATE_PATHWAY permission
            if (!_authService.HasPermission(user, UserPermissions.CreatePathway))
                return Forbid(); // Or NotFound() if we want to hide existence, but Forbid is safer for Write.

            if (string.IsNullOrEmpty(pathway.Name)) return BadRequest("Pathway Name is required.");
            if (string.IsNullOrEmpty(pathway.Id)) pathway.Id = Guid.NewGuid().ToString();
            pathway.DepartmentId = departmentId;

            _logger.LogInformation("Creating pathway '{Name}' for Department '{DepartmentId}'", pathway.Name, departmentId);

            var item = new Dictionary<string, AttributeValue>
            {
                { "PK", new AttributeValue { S = $"DEPT#{departmentId}" } },
                { "SK", new AttributeValue { S = $"PATH#{pathway.Id}" } },
                { "EntityType", new AttributeValue { S = "Pathway" } },
                { "Id", new AttributeValue { S = pathway.Id } },
                { "Name", new AttributeValue { S = pathway.Name } },
                { "Description", new AttributeValue { S = pathway.Description } },
                { "DepartmentId", new AttributeValue { S = departmentId } },
                { "CreatedAt", new AttributeValue { S = DateTime.UtcNow.ToString("O") } }
            };

            await _dynamoDb.PutItemAsync(item);
            return CreatedAtAction(nameof(GetPathway), new { departmentId, pathwayId = pathway.Id }, pathway);
        }

        [HttpGet("{pathwayId}")]
        public async Task<IActionResult> GetPathway(string departmentId, string pathwayId)
        {
            // 1. AuthZ Check
            var user = await _authService.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // Check basic scope access to the item
            // Note: For Institution User, "CanAccessDepartment" logic might be heavy. 
            // For efficient "Get", we might fetch item first, then check access?
            // "Consistent Forbidden vs NotFound" -> "Avoid leaking existence".
            // If we fetch first, we know it exists. If we return 403, we leak existence.
            // If we check scope first (e.g. Dept User for Dept A requests Dept B), we can return 404 (or 403 treated as 404).

            // Allow check based on URL parameters first (e.g. DepartmentId)
            // If user is designated to Dept A, and requests `.../departments/B/pathways/X`, we should fail immediately.
            var canAccessContainer = await _authService.CanAccessDepartmentAsync(user, departmentId);

            // Special Case: Pathway User
            // They return "False" for generic CanAccessDepartment, but SHOULD get their specific pathway.
            if (user.Role == UserRoles.PathwayUser)
            {
                // Check if pathwayId is in their scope
                if (!_authService.CanAccessPathway(user, pathwayId, departmentId)) return NotFound();
            }
            else
            {
                if (!canAccessContainer) return NotFound(); // Hide other departments
            }

            var response = await _dynamoDb.GetItemAsync($"DEPT#{departmentId}", $"PATH#{pathwayId}");

            if (response.Item == null || response.Item.Count == 0) return NotFound();

            if (!user.Permissions.Contains(UserPermissions.View) && user.Role != UserRoles.SuperAdmin) return Forbid();

            var path = new Pathway
            {
                Id = response.Item.ContainsKey("Id") ? response.Item["Id"].S : pathwayId,
                Name = response.Item.ContainsKey("Name") ? response.Item["Name"].S : string.Empty,
                Subtext = response.Item.ContainsKey("Subtext") ? response.Item["Subtext"].S : string.Empty,
                Description = response.Item.ContainsKey("Description") ? response.Item["Description"].S : string.Empty,
                DepartmentId = response.Item.ContainsKey("DepartmentId") ? response.Item["DepartmentId"].S : departmentId
            };

            return Ok(path);
        }

        [HttpPut("{pathwayId}")]
        public async Task<IActionResult> UpdatePathway(string departmentId, string pathwayId, [FromBody] Pathway pathway)
        {
            var user = await _authService.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // Check Container Access
            if (user.Role != UserRoles.PathwayUser && !await _authService.CanAccessDepartmentAsync(user, departmentId)) return NotFound();

            // Check Item Access
            if (!_authService.CanAccessPathway(user, pathwayId, departmentId)) return NotFound();

            // Check Permission
            if (!_authService.HasPermission(user, UserPermissions.EditPathway)) return Forbid();

            if (pathway.Id != pathwayId) return BadRequest("ID Mismatch");
            pathway.DepartmentId = departmentId;

            var item = new Dictionary<string, AttributeValue>
            {
                { "PK", new AttributeValue { S = $"DEPT#{departmentId}" } },
                { "SK", new AttributeValue { S = $"PATH#{pathway.Id}" } },
                { "EntityType", new AttributeValue { S = "Pathway" } },
                { "Id", new AttributeValue { S = pathway.Id } },
                { "Name", new AttributeValue { S = pathway.Name } },
                { "Description", new AttributeValue { S = pathway.Description } },
                { "Subtext", new AttributeValue { S = pathway.Subtext } },
                { "DepartmentId", new AttributeValue { S = departmentId } },
                { "UpdatedAt", new AttributeValue { S = DateTime.UtcNow.ToString("O") } }
            };

            await _dynamoDb.PutItemAsync(item);
            _logger.LogInformation("Pathway updated: {Id}", pathway.Id);

            return NoContent();
        }

        [HttpGet]
        public async Task<IActionResult> ListPathways(string departmentId)
        {
            var user = await _authService.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // Scope Check
            // If Pathway User: can only list what is in scope.
            // If Dept/Inst User: can list all in container IF they access container.

            if (user.Role != UserRoles.PathwayUser && !await _authService.CanAccessDepartmentAsync(user, departmentId))
                return NotFound(); // Hide department existence if not authorized

            // Query PK = DEPT#{id} and SK begins_with PATH#
            var response = await _dynamoDb.QueryByPkAndSkPrefixAsync($"DEPT#{departmentId}", "PATH#");

            var pathways = response.Items.Select(item => new Pathway
            {
                Id = item.ContainsKey("Id") ? item["Id"].S : "",
                Name = item.ContainsKey("Name") ? item["Name"].S : "",
                Subtext = item.ContainsKey("Subtext") ? item["Subtext"].S : "",
                Description = item.ContainsKey("Description") ? item["Description"].S : "",
                DepartmentId = item.ContainsKey("DepartmentId") ? item["DepartmentId"].S : departmentId
            });

            // Filtering for Pathway User
            if (user.Role == UserRoles.PathwayUser)
            {
                pathways = pathways.Where(p => _authService.CanAccessPathway(user, p.Id, departmentId));
            }

            return Ok(pathways.ToList());
        }
    }
}
