using Amazon.CognitoIdentityProvider;
using Amazon.Runtime.CredentialManagement;
using Microsoft.Extensions.Primitives;

var chain = new CredentialProfileStoreChain();
if (chain.TryGetProfile("northstar", out var profile))
{
    Console.WriteLine($"[DIAGNOSTIC] Found profile 'northstar', region: {profile.Region}");
}
else
{
    Console.WriteLine("[DIAGNOSTIC] Could NOT find profile 'northstar'. Available profiles:");
    foreach (var p in chain.ListProfiles())
    {
        Console.WriteLine($"[DIAGNOSTIC] - {p.Name}");
    }
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add Lambda Hosting for API Gateway (HTTP API v2)
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

var awsOptions = builder.Configuration.GetAWSOptions();
Console.WriteLine($"[DIAGNOSTIC] Loaded AWS Options from Configuration:");
Console.WriteLine($"[DIAGNOSTIC] - Profile: '{awsOptions.Profile}'");
Console.WriteLine($"[DIAGNOSTIC] - Region: '{awsOptions.Region?.SystemName}'");
Console.WriteLine($"[DIAGNOSTIC] - Raw Config 'AWS:Profile': '{builder.Configuration["AWS:Profile"]}'");

// Check if the profile in options matches what we found manually
if (!string.IsNullOrEmpty(awsOptions.Profile))
{
    if (chain.TryGetProfile(awsOptions.Profile, out var sdkProfile))
    {
        Console.WriteLine($"[DIAGNOSTIC] SDK verified profile '{awsOptions.Profile}' exists in store. Region: {sdkProfile.Region}");
    }
    else
    {
        Console.WriteLine($"[DIAGNOSTIC] SDK WARNING: Profile '{awsOptions.Profile}' specified in config was NOT found in the credential store.");
    }
}
else
{
    Console.WriteLine($"[DIAGNOSTIC] AWS Options 'Profile' is null or empty. Falling back to default credential chain.");
}

builder.Services.AddDefaultAWSOptions(awsOptions);
builder.Services.AddAWSService<IAmazonCognitoIdentityProvider>();
builder.Services.AddAWSService<Amazon.DynamoDBv2.IAmazonDynamoDB>();

// builder.Services.AddDbContext<ApplicationDbContext>(options =>
//     options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddSingleton<NorthStar.API.Services.DynamoDbService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<NorthStar.API.Services.IUserContextService, NorthStar.API.Services.UserContextService>();
builder.Services.AddScoped<NorthStar.API.Services.AuthorizationService>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseCors("AllowAll");



app.MapControllers();

app.Run();
