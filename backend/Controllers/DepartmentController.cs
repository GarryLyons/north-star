using Microsoft.AspNetCore.Mvc;
using NorthStar.API.Models;
using NorthStar.API.Services;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Logging;

namespace NorthStar.API.Controllers
{
    [ApiController]
    [Route("api/v1/institutions/{institutionId}/departments")]
    public class DepartmentController : ControllerBase
    {
        private readonly DynamoDbService _dynamoDb;
        private readonly ILogger<DepartmentController> _logger;

        public DepartmentController(DynamoDbService dynamoDb, ILogger<DepartmentController> logger)
        {
            _dynamoDb = dynamoDb;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateDepartment(string institutionId, [FromBody] Department department)
        {
            if (string.IsNullOrEmpty(department.Name))
            {
                return BadRequest("Department Name is required.");
            }

            if (string.IsNullOrEmpty(department.Id))
            {
                department.Id = Guid.NewGuid().ToString();
            }
            department.InstitutionId = institutionId;

            _logger.LogInformation("Creating department '{Name}' for Institution '{InstitutionId}'", department.Name, institutionId);

            var item = new Dictionary<string, AttributeValue>
            {
                { "PK", new AttributeValue { S = $"INST#{institutionId}" } },
                { "SK", new AttributeValue { S = $"DEPT#{department.Id}" } },
                { "EntityType", new AttributeValue { S = "Department" } },
                { "Id", new AttributeValue { S = department.Id } },
                { "Name", new AttributeValue { S = department.Name } },
                { "InstitutionId", new AttributeValue { S = institutionId } },
                { "CreatedAt", new AttributeValue { S = DateTime.UtcNow.ToString("O") } }
            };

            await _dynamoDb.PutItemAsync(item);

            return CreatedAtAction(nameof(GetDepartment), new { institutionId, departmentId = department.Id }, department);
        }

        [HttpGet("{departmentId}")]
        public async Task<IActionResult> GetDepartment(string institutionId, string departmentId)
        {
            var response = await _dynamoDb.GetItemAsync($"INST#{institutionId}", $"DEPT#{departmentId}");

            if (response.Item == null || response.Item.Count == 0)
            {
                return NotFound();
            }

            var dept = new Department
            {
                Id = response.Item.ContainsKey("Id") ? response.Item["Id"].S : departmentId,
                Name = response.Item.ContainsKey("Name") ? response.Item["Name"].S : string.Empty,
                InstitutionId = response.Item.ContainsKey("InstitutionId") ? response.Item["InstitutionId"].S : institutionId
            };

            return Ok(dept);
        }

        [HttpGet]
        public async Task<IActionResult> ListDepartments(string institutionId)
        {
            // Query PK = INST#{id} and SK begins_with DEPT#
            var response = await _dynamoDb.QueryByPkAndSkPrefixAsync($"INST#{institutionId}", "DEPT#");

            var departments = response.Items.Select(item => new Department
            {
                Id = item.ContainsKey("Id") ? item["Id"].S : "",
                Name = item.ContainsKey("Name") ? item["Name"].S : "",
                InstitutionId = item.ContainsKey("InstitutionId") ? item["InstitutionId"].S : institutionId
            }).ToList();

            return Ok(departments);
        }
    }
}
