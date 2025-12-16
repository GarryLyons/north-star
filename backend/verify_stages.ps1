$institutionUrl = "http://127.0.0.1:5271/api/v1/institutions"
# Setup Parent Hierarchy
Write-Host "Creating Inst/Dept/Path..."
try {
    $inst = Invoke-RestMethod -Uri $institutionUrl -Method Post -Body (@{ Name = "Stage Inst"; Code = "SI"; Address = "T" } | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $dept = Invoke-RestMethod -Uri "$institutionUrl/$($inst.id)/departments" -Method Post -Body (@{ Name = "Stage Dept" } | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $path = Invoke-RestMethod -Uri "http://127.0.0.1:5271/api/v1/departments/$($dept.id)/pathways" -Method Post -Body (@{ Name = "Stage Pathway" } | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $pathId = $path.id
    Write-Host "Pathway ID: $pathId"

    # Verify Update Pathway
    Write-Host "Updating Pathway..."
    $updateBody = @{ Id = $pathId; Name = "Updated Pathway"; Description = "Rich Text"; Subtext = "Subtext" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://127.0.0.1:5271/api/v1/departments/$($dept.id)/pathways/$pathId" -Method Put -Body $updateBody -ContentType "application/json" -ErrorAction Stop
    $pCheck = Invoke-RestMethod -Uri "http://127.0.0.1:5271/api/v1/departments/$($dept.id)/pathways/$pathId" -Method Get
    if ($pCheck.name -eq "Updated Pathway" -and $pCheck.subtext -eq "Subtext") { Write-Host "SUCCESS: Pathway Updated." } else { Write-Host "FAIL: Pathway Update." }

    # Create Stage with HYMF
    Write-Host "Creating Stage with HYMF..."
    $s3Body = @{ 
        Title                      = "Stage 3"; 
        Order                      = 3; 
        HowYouMightFeelTitle       = "Feeling Good"; 
        HowYouMightFeelDescription = "<p>HTML</p>" 
    } | ConvertTo-Json
    $s3 = Invoke-RestMethod -Uri $stageUrl -Method Post -Body $s3Body -ContentType "application/json" -ErrorAction Stop
    $s3Check = Invoke-RestMethod -Uri "$stageUrl/$($s3.id)" -Method Get
    if ($s3Check.howYouMightFeelTitle -eq "Feeling Good") { Write-Host "SUCCESS: HYMF Saved." } else { Write-Host "FAIL: HYMF Missing." }

}
catch { Write-Host "Setup Fail: $_"; exit }

$stageUrl = "http://127.0.0.1:5271/api/v1/pathways/$pathId/stages"

# 1. Create Stage 1
Write-Host "Creating Stage 1..."
$s1Body = @{ 
    Title             = "Assessment"; 
    Summary           = "Initial check"; 
    EstimatedDuration = 3; 
    Order             = 1;
    CaregiverTips     = @( @{ Summary = "Tip 1"; Description = "Details 1" } )
} | ConvertTo-Json -Depth 5
try {
    $s1 = Invoke-RestMethod -Uri $stageUrl -Method Post -Body $s1Body -ContentType "application/json" -ErrorAction Stop
    Write-Host "Stage 1 Created: $($s1.title)"
}
catch { Write-Host "Stage 1 Fail: $_"; if ($_.Exception.Response) { $_.Exception.Response.GetResponseStream().ReadToEnd() }; exit }

# 2. Create Stage 2
Write-Host "Creating Stage 2..."
$s2Body = @{ Title = "Treatment"; Order = 2 } | ConvertTo-Json
$s2 = Invoke-RestMethod -Uri $stageUrl -Method Post -Body $s2Body -ContentType "application/json" -ErrorAction Stop
Write-Host "Stage 2 Created: $($s2.title)"

# 3. List Stages
Write-Host "Listing Stages..."
$list = Invoke-RestMethod -Uri $stageUrl -Method Get -ErrorAction Stop
$list | Format-Table Title, Order, EstimatedDuration

# 4. Verify Complex Content
Write-Host "Verifying Tip..."
if ($list[0].caregiverTips[0].summary -eq "Tip 1") { Write-Host "SUCCESS: Tip found." } else { Write-Host "FAIL: Tip missing." }

# 5. Delete Stage 2
Write-Host "Deleting Stage 2..."
Invoke-RestMethod -Uri "$stageUrl/$($s2.id)" -Method Delete -ErrorAction Stop
$listAfter = Invoke-RestMethod -Uri $stageUrl -Method Get -ErrorAction Stop
if ($listAfter.Count -eq 1) { Write-Host "SUCCESS: Stage 2 deleted." } else { Write-Host "FAIL: Count is $($listAfter.Count)" }
