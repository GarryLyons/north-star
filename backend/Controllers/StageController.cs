using Microsoft.AspNetCore.Mvc;
using NorthStar.API.Models;
using NorthStar.API.Services;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace NorthStar.API.Controllers
{
    [ApiController]
    [Route("api/v1/pathways/{pathwayId}/stages")]
    public class StageController : ControllerBase
    {
        private readonly DynamoDbService _dynamoDb;
        private readonly ILogger<StageController> _logger;

        public StageController(DynamoDbService dynamoDb, ILogger<StageController> logger)
        {
            _dynamoDb = dynamoDb;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateStage(string pathwayId, [FromBody] Stage stage)
        {
            if (string.IsNullOrEmpty(stage.Title))
                return BadRequest("Stage Title is required.");

            if (string.IsNullOrEmpty(stage.Id))
                stage.Id = Guid.NewGuid().ToString();

            stage.PathwayId = pathwayId;

            // TODO: In a real app, query max order to auto-increment. For now, client sends order or defaults to 0.
            
            var item = ToDynamoDbItem(stage);
            await _dynamoDb.PutItemAsync(item);

            _logger.LogInformation("Stage created: {Id}", stage.Id);
            return CreatedAtAction(nameof(GetStage), new { pathwayId, stageId = stage.Id }, stage);
        }

        [HttpGet("{stageId}")]
        public async Task<IActionResult> GetStage(string pathwayId, string stageId)
        {
            var response = await _dynamoDb.GetItemAsync($"PATH#{pathwayId}", $"STAGE#{stageId}");
            if (response.Item == null || response.Item.Count == 0) return NotFound();

            var stage = FromDynamoDbItem(response.Item);
            return Ok(stage);
        }

        [HttpPut("{stageId}")]
        public async Task<IActionResult> UpdateStage(string pathwayId, string stageId, [FromBody] Stage stage)
        {
            if (stage.Id != stageId) return BadRequest("ID Mismatch");
            stage.PathwayId = pathwayId;

            var item = ToDynamoDbItem(stage);
            await _dynamoDb.PutItemAsync(item);
            
            return NoContent();
        }

        [HttpGet]
        public async Task<IActionResult> ListStages(string pathwayId)
        {
            // Query PK=PATH#{id}, SK begins_with STAGE#
            var response = await _dynamoDb.QueryByPkAndSkPrefixAsync($"PATH#{pathwayId}", "STAGE#");
            
            var stages = response.Items.Select(FromDynamoDbItem).OrderBy(s => s.Order).ToList();
            return Ok(stages);
        }

        [HttpDelete("{stageId}")]
        public async Task<IActionResult> DeleteStage(string pathwayId, string stageId)
        {
            var response = await _dynamoDb.GetItemAsync($"PATH#{pathwayId}", $"STAGE#{stageId}");
            if (response.Item == null || response.Item.Count == 0) return NotFound();

            await _dynamoDb.DeleteItemAsync($"PATH#{pathwayId}", $"STAGE#{stageId}");
            
            _logger.LogInformation("Stage deleted: {Id}", stageId);
            return NoContent();
        }
        
        // Helper methods to map to/from DynamoDB
        private Dictionary<string, AttributeValue> ToDynamoDbItem(Stage s)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                { "PK", new AttributeValue { S = $"PATH#{s.PathwayId}" } },
                { "SK", new AttributeValue { S = $"STAGE#{s.Id}" } },
                { "EntityType", new AttributeValue { S = "Stage" } },
                { "Id", new AttributeValue { S = s.Id } },
                { "PathwayId", new AttributeValue { S = s.PathwayId } },
                { "Title", new AttributeValue { S = s.Title } },
                { "Summary", new AttributeValue { S = s.Summary } },
                { "Introduction", new AttributeValue { S = s.Introduction } },
                { "HowYouMightFeelTitle", new AttributeValue { S = s.HowYouMightFeelTitle } },
                { "HowYouMightFeelDescription", new AttributeValue { S = s.HowYouMightFeelDescription } },
                { "EstimatedDuration", new AttributeValue { N = s.EstimatedDuration.ToString() } },
                { "Order", new AttributeValue { N = s.Order.ToString() } },
                { "CaregiverTips", new AttributeValue { S = JsonSerializer.Serialize(s.CaregiverTips) } },
                { "ReflectiveQuestions", new AttributeValue { S = JsonSerializer.Serialize(s.ReflectiveQuestions) } },
                { "Faqs", new AttributeValue { S = JsonSerializer.Serialize(s.Faqs) } },
                { "OnlineResources", new AttributeValue { S = JsonSerializer.Serialize(s.OnlineResources) } }
            };
            return item;
        }

        private Stage FromDynamoDbItem(Dictionary<string, AttributeValue> item)
        {
            var s = new Stage
            {
                Id = item.ContainsKey("Id") ? item["Id"].S : "",
                PathwayId = item.ContainsKey("PathwayId") ? item["PathwayId"].S : "",
                Title = item.ContainsKey("Title") ? item["Title"].S : "",
                Summary = item.ContainsKey("Summary") ? item["Summary"].S : "",
                Introduction = item.ContainsKey("Introduction") ? item["Introduction"].S : "",
                HowYouMightFeelTitle = item.ContainsKey("HowYouMightFeelTitle") ? item["HowYouMightFeelTitle"].S : "How You Might Feel",
                HowYouMightFeelDescription = item.ContainsKey("HowYouMightFeelDescription") ? item["HowYouMightFeelDescription"].S : "",
                EstimatedDuration = item.ContainsKey("EstimatedDuration") ? int.Parse(item["EstimatedDuration"].N) : 0,
                Order = item.ContainsKey("Order") ? int.Parse(item["Order"].N) : 0,
            };

            if (item.ContainsKey("CaregiverTips"))
                s.CaregiverTips = JsonSerializer.Deserialize<List<CaregiverTip>>(item["CaregiverTips"].S) ?? new List<CaregiverTip>();
            
            if (item.ContainsKey("ReflectiveQuestions"))
                s.ReflectiveQuestions = JsonSerializer.Deserialize<List<string>>(item["ReflectiveQuestions"].S) ?? new List<string>();

            if (item.ContainsKey("Faqs"))
                s.Faqs = JsonSerializer.Deserialize<List<Faq>>(item["Faqs"].S) ?? new List<Faq>();

            if (item.ContainsKey("OnlineResources"))
                s.OnlineResources = JsonSerializer.Deserialize<List<OnlineResource>>(item["OnlineResources"].S) ?? new List<OnlineResource>();

            return s;
        }
    }
}
