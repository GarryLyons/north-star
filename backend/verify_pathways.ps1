$institutionUrl = "http://127.0.0.1:5271/api/v1/institutions"
# 1. Create Inst
Write-Host "Creating Inst..."
try {
    $inst = Invoke-RestMethod -Uri $institutionUrl -Method Post -Body (@{ Name = "Path Inst"; Code = "PI"; Address = "T" } | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $instId = $inst.id
}
catch { Write-Host "Inst Fail: $_"; exit }

# 2. Create Dept
Write-Host "Creating Dept..."
$deptUrl = "http://127.0.0.1:5271/api/v1/institutions/$instId/departments"
try {
    $dept = Invoke-RestMethod -Uri $deptUrl -Method Post -Body (@{ Name = "Path Dept" } | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $deptId = $dept.id
}
catch { Write-Host "Dept Fail: $_"; exit }

# 3. Create Pathway
Write-Host "Creating Pathway..."
$pathwayUrl = "http://127.0.0.1:5271/api/v1/departments/$deptId/pathways"
$pathBody = @{ Name = "Heart Failure Pathway"; Description = "Initial steps" } | ConvertTo-Json
try {
    $path = Invoke-RestMethod -Uri $pathwayUrl -Method Post -Body $pathBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "Pathway Created: $($path.id)"
}
catch {
    Write-Host "Pathway Fail: $_"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Error: $body"
    }
    exit
}

# 4. List Pathways
Write-Host "Listing Pathways..."
try {
    $list = Invoke-RestMethod -Uri $pathwayUrl -Method Get -ErrorAction Stop
    Write-Host "Found $($list.Count) pathways"
    $list | Format-Table Id, Name, DepartmentId
}
catch {
    Write-Host "List Failed: $_"
}
