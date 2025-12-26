using Microsoft.AspNetCore.Mvc;
using NorthStar.API.Models;
using NorthStar.API.Services;
using Amazon.DynamoDBv2.Model;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;

namespace NorthStar.API.Controllers
{
    [ApiController]
    [Route("api/v1/institutions")]
    public class InstitutionController : ControllerBase
    {
        private readonly DynamoDbService _dynamoDb;
        private readonly ILogger<InstitutionController> _logger;
        private readonly AuthorizationService _authorizationService;

        public InstitutionController(DynamoDbService dynamoDb, ILogger<InstitutionController> logger, AuthorizationService authorizationService)
        {
            _dynamoDb = dynamoDb;
            _logger = logger;
            _authorizationService = authorizationService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateInstitution([FromBody] Institution institution)
        {
            // AuthZ: Only Super Admin can create institutions
            var user = await _authorizationService.GetCurrentUserAsync();
            if (user == null || user.Role != UserRoles.SuperAdmin)
            {
                _logger.LogWarning("CreateInstitution: Unauthorized access attempt by {UserId}", user?.Id);
                return Forbid();
            }

            _logger.LogInformation("Creating institution: Name={Name}, Code={Code}", institution.Name, institution.Code);

            if (string.IsNullOrEmpty(institution.Id))
            {
                institution.Id = Guid.NewGuid().ToString();
            }

            try
            {
                var item = new Dictionary<string, AttributeValue>
                {
                    { "PK", new AttributeValue { S = $"INST#{institution.Id}" } },
                    { "SK", new AttributeValue { S = "META" } },
                    { "EntityType", new AttributeValue { S = "Institution" } },
                    { "Id", new AttributeValue { S = institution.Id } },
                    { "Name", new AttributeValue { S = institution.Name } },
                    { "Code", new AttributeValue { S = institution.Code } },
                    { "Address", new AttributeValue { S = institution.Address } },
                    { "CreatedAt", new AttributeValue { S = DateTime.UtcNow.ToString("O") } }
                };

                await _dynamoDb.PutItemAsync(item);
                _logger.LogInformation("Institution created successfully: {Id}", institution.Id);

                return CreatedAtAction(nameof(GetInstitution), new { id = institution.Id }, institution);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating institution in DynamoDB");
                return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInstitution(string id, [FromBody] Institution institution)
        {
            if (id != institution.Id)
            {
                return BadRequest();
            }

            // AuthZ Check
            var user = await _authorizationService.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // Allow Super Admin OR Institution User of THAT institution
            bool isAllowed = user.Role == UserRoles.SuperAdmin;
            if (!isAllowed && user.Role == UserRoles.InstitutionUser)
            {
                isAllowed = _authorizationService.CanAccessInstitution(user, id);
            }

            if (!isAllowed) return Forbid();

            var existingResponse = await _dynamoDb.GetItemAsync($"INST#{id}", "META");
            if (existingResponse.Item == null || existingResponse.Item.Count == 0)
            {
                return NotFound();
            }

            var createdAt = existingResponse.Item.ContainsKey("CreatedAt") ? existingResponse.Item["CreatedAt"].S : DateTime.UtcNow.ToString("O");

            var item = new Dictionary<string, AttributeValue>
            {
                { "PK", new AttributeValue { S = $"INST#{id}" } },
                { "SK", new AttributeValue { S = "META" } },
                { "EntityType", new AttributeValue { S = "Institution" } },
                { "Id", new AttributeValue { S = institution.Id } },
                { "Name", new AttributeValue { S = institution.Name } },
                { "Code", new AttributeValue { S = institution.Code } },
                { "Address", new AttributeValue { S = institution.Address } },
                { "CreatedAt", new AttributeValue { S = createdAt } },
                { "UpdatedAt", new AttributeValue { S = DateTime.UtcNow.ToString("O") } }
            };

            await _dynamoDb.PutItemAsync(item);

            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetInstitution(string id)
        {
            // AuthZ Check
            var user = await _authorizationService.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (user.Role != UserRoles.SuperAdmin)
            {
                if (!_authorizationService.CanAccessInstitution(user, id))
                {
                    return Forbid();
                }
            }

            var response = await _dynamoDb.GetItemAsync($"INST#{id}", "META");

            if (response.Item == null || response.Item.Count == 0)
            {
                return NotFound();
            }

            var inst = new Institution
            {
                Id = response.Item.ContainsKey("Id") ? response.Item["Id"].S : id,
                Name = response.Item.ContainsKey("Name") ? response.Item["Name"].S : string.Empty,
                Code = response.Item.ContainsKey("Code") ? response.Item["Code"].S : string.Empty,
                Address = response.Item.ContainsKey("Address") ? response.Item["Address"].S : string.Empty,
            };

            return Ok(inst);
        }

        [HttpGet]
        public async Task<IActionResult> ListInstitutions()
        {
            var user = await _authorizationService.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // 1. Fetch All Institutions (Scan)
            var filter = "EntityType = :entityType";
            var values = new Dictionary<string, AttributeValue>
            {
                { ":entityType", new AttributeValue { S = "Institution" } }
            };

            var response = await _dynamoDb.ScanAsync(filter, values);

            var institutions = response.Items.Select(item => new Institution
            {
                Id = item.ContainsKey("Id") ? item["Id"].S : "",
                Name = item.ContainsKey("Name") ? item["Name"].S : "",
                Code = item.ContainsKey("Code") ? item["Code"].S : "",
                Address = item.ContainsKey("Address") ? item["Address"].S : ""
            });

            // 2. Filter based on Role
            if (user.Role == UserRoles.SuperAdmin)
            {
                return Ok(institutions.ToList());
            }
            else if (user.Role == UserRoles.InstitutionUser || user.Role == UserRoles.DepartmentUser || user.Role == UserRoles.PathwayUser)
            {
                // Parse Institution ID from Scope?
                // Scope format: inst:ID, dept:ID, pathway:ID.
                // It is hard to extract "InstitutionId" from "dept:ID" without looking up the Dept.
                // HOWEVER, for Institution User, the scope IS the institution ID or "inst:ID".

                // For simplicity finding which institution they belong to:
                if (user.Role == UserRoles.InstitutionUser)
                {
                    // Scope should be "inst:{id}" or just "{id}" (though we enforced "inst:" prefix in invite).
                    var instId = user.Scope.StartsWith("inst:") ? user.Scope.Substring(5) : user.Scope;

                    var filtered = institutions.Where(i => i.Id == instId).ToList();
                    return Ok(filtered);
                }

                // Department/Pathway Users: ideally they see their parent institution?
                // For now, let's return EMPTY or only their institution if we can resolve it.
                // Since this endpoint populates the Dashboard "Institutions" list, if they are Dept users, maybe they shouldn't see this list or only their parent.
                // But we don't have easy lookup from Dept -> Inst without querying Dept first.
                // Let's return Forbidden for now or Empty, until requirement clarifies for Dept users on Dashboard.
                // User requirement specifically mentioned "Institution User".
                return Ok(new List<Institution>());
            }

            return Forbid();
        }
    }
}
