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
        private readonly ILogger<PathwayController> _logger;

        public PathwayController(DynamoDbService dynamoDb, ILogger<PathwayController> logger)
        {
            _dynamoDb = dynamoDb;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePathway(string departmentId, [FromBody] Pathway pathway)
        {
            if (string.IsNullOrEmpty(pathway.Name))
            {
                return BadRequest("Pathway Name is required.");
            }

            if (string.IsNullOrEmpty(pathway.Id))
            {
                pathway.Id = Guid.NewGuid().ToString();
            }
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
            var response = await _dynamoDb.GetItemAsync($"DEPT#{departmentId}", $"PATH#{pathwayId}");

            if (response.Item == null || response.Item.Count == 0)
            {
                return NotFound();
            }

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
                { "Subtext", new AttributeValue { S = pathway.Subtext } }, // Added Subtext
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
            // Query PK = DEPT#{id} and SK begins_with PATH#
            var response = await _dynamoDb.QueryByPkAndSkPrefixAsync($"DEPT#{departmentId}", "PATH#");

            var pathways = response.Items.Select(item => new Pathway
            {
                Id = item.ContainsKey("Id") ? item["Id"].S : "",
                Name = item.ContainsKey("Name") ? item["Name"].S : "",
                Subtext = item.ContainsKey("Subtext") ? item["Subtext"].S : "",
                Description = item.ContainsKey("Description") ? item["Description"].S : "",
                DepartmentId = item.ContainsKey("DepartmentId") ? item["DepartmentId"].S : departmentId
            }).ToList();

            return Ok(pathways);
        }
    }
}
