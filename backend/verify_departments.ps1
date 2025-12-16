$institutionUrl = "http://127.0.0.1:5271/api/v1/institutions"
# Note: Re-using the ID of an existing institution or creating one.
# For automation, let's create a new one to be sure.

Write-Host "Creating Parent Institution..."
$instBody = @{ Name = "Dept Test Inst"; Code = "DTI"; Address = "Test" } | ConvertTo-Json
try {
    $inst = Invoke-RestMethod -Uri $institutionUrl -Method Post -Body $instBody -ContentType "application/json" -ErrorAction Stop
    $instId = $inst.id
    Write-Host "Institution Created: $instId"
}
catch {
    Write-Host "Failed to create institution: $_"
    exit
}

$deptUrl = "http://127.0.0.1:5271/api/v1/institutions/$instId/departments"

Write-Host "Creating Department..."
$deptBody = @{ Name = "Cardiology" } | ConvertTo-Json
try {
    $dept = Invoke-RestMethod -Uri $deptUrl -Method Post -Body $deptBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "Department Created: $($dept.id)"
}
catch {
    Write-Host "Failed to create department: $_"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Error Details: $body"
    }
    exit
}

Write-Host "Listing Departments..."
try {
    $list = Invoke-RestMethod -Uri $deptUrl -Method Get -ErrorAction Stop
    Write-Host "Found $($list.Count) departments"
    $list | Format-Table Id, Name, InstitutionId
}
catch {
    Write-Host "List Failed: $_"
}
