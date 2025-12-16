using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace NorthStar.API.Services
{
    public class DynamoDbService
    {
        private readonly IAmazonDynamoDB _dynamoDb;
        private const string TableName = "Cms";

        public DynamoDbService(IAmazonDynamoDB dynamoDb)
        {
            _dynamoDb = dynamoDb;
        }

        public async Task<PutItemResponse> PutItemAsync(Dictionary<string, AttributeValue> item)
        {
            var request = new PutItemRequest
            {
                TableName = TableName,
                Item = item
            };
            return await _dynamoDb.PutItemAsync(request);
        }

        public async Task<GetItemResponse> GetItemAsync(string pk, string sk)
        {
            var request = new GetItemRequest
            {
                TableName = TableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "PK", new AttributeValue { S = pk } },
                    { "SK", new AttributeValue { S = sk } }
                }
            };
            return await _dynamoDb.GetItemAsync(request);
        }

        public async Task<DeleteItemResponse> DeleteItemAsync(string pk, string sk)
        {
            var request = new DeleteItemRequest
            {
                TableName = TableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "PK", new AttributeValue { S = pk } },
                    { "SK", new AttributeValue { S = sk } }
                }
            };
            return await _dynamoDb.DeleteItemAsync(request);
        }

        public async Task<QueryResponse> QueryAsync(string pkPrefix)
        {
            // Simple query by PK
            var request = new QueryRequest
            {
                TableName = TableName,
                KeyConditionExpression = "PK = :pk",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    { ":pk", new AttributeValue { S = pkPrefix } }
                }
            };
            return await _dynamoDb.QueryAsync(request);
        }

        // Add more helper methods as needed (Query by PK and SK prefix, etc.)
        public async Task<QueryResponse> QueryByPkAndSkPrefixAsync(string pk, string skPrefix)
        {
            var request = new QueryRequest
            {
                TableName = TableName,
                KeyConditionExpression = "PK = :pk and begins_with(SK, :sk)",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    { ":pk", new AttributeValue { S = pk } },
                    { ":sk", new AttributeValue { S = skPrefix } }
                }
            };
            return await _dynamoDb.QueryAsync(request);
        }

        public async Task<ScanResponse> ScanAsync(string filterExpression, Dictionary<string, AttributeValue> expressionAttributeValues)
        {
            var request = new ScanRequest
            {
                TableName = TableName,
                FilterExpression = filterExpression,
                ExpressionAttributeValues = expressionAttributeValues
            };
            return await _dynamoDb.ScanAsync(request);
        }
    }
}
