using Microsoft.AspNetCore.Mvc;
using NorthStar.API.Models;
using NorthStar.API.Services;
using Amazon.DynamoDBv2.Model;
using System.Linq;
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

        public InstitutionController(DynamoDbService dynamoDb, ILogger<InstitutionController> logger)
        {
            _dynamoDb = dynamoDb;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateInstitution([FromBody] Institution institution)
        {
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
            }).ToList();

            return Ok(institutions);
        }
    }
}
