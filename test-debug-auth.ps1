Write-Host "=== Debug Authentication Test ===" -ForegroundColor Cyan

# Test Login
Write-Host "`nStep 1: Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "mmm@gmail.com"
    password = "SecurePass123!"
} | ConvertTo-Json

Write-Host "Login request body: $loginBody"

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "`nLogin Response:" -ForegroundColor Green
    $loginResponse | ConvertTo-Json -Depth 5
    
    $token = $loginResponse.token
    Write-Host "`nExtracted Token: $token" -ForegroundColor Cyan
    
    # Test with token
    Write-Host "`nStep 2: Testing Analysis with Token..." -ForegroundColor Yellow
    $codeString = 'console.log("test")'
    $analysisBody = @{
        code = $codeString
        language = "javascript"
    } | ConvertTo-Json
    
    Write-Host "Analysis request body: $analysisBody"
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Headers: Authorization = Bearer $token"
    
    $analysisResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/analysis/explain" -Method POST -Body $analysisBody -Headers $headers -TimeoutSec 60
    Write-Host "`nAnalysis Response:" -ForegroundColor Green
    $analysisResponse | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "`nError Details:" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
