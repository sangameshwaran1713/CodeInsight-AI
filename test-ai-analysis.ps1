$body = @{
    code = "def hello():`n    print('Hello World')"
    language = "python"
} | ConvertTo-Json

Write-Host "Testing AI Analysis Endpoint..."
Write-Host "Sending request to http://localhost:8000/api/analyze/explain"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/analyze/explain" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 60
    Write-Host "`nSuccess! AI Analysis Response:"
    Write-Host "================================"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`nError occurred:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
