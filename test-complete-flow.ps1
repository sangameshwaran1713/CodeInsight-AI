Write-Host "=== Complete System Test ===" -ForegroundColor Cyan

# Test 1: Login
Write-Host "`n[1/3] Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "mmm@gmail.com"
    password = "SecurePass123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Success: Login successful! Token received." -ForegroundColor Green
} catch {
    Write-Host "Error: Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Code Analysis via Backend
Write-Host "`n[2/3] Testing Code Analysis (Backend -> AI Service)..." -ForegroundColor Yellow
$codeString = 'function add(x, y) { return x + y; }'
$analysisBody = @{
    code = $codeString
    language = "javascript"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $analysisResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/analysis/explain" -Method POST -Body $analysisBody -Headers $headers -TimeoutSec 60
    Write-Host "Success: Code analysis successful!" -ForegroundColor Green
    Write-Host "`nAnalysis Result Preview:" -ForegroundColor Cyan
    if ($analysisResponse.result) {
        $resultText = $analysisResponse.result
        $preview = $resultText.Substring(0, [Math]::Min(200, $resultText.Length))
        Write-Host "$preview..." -ForegroundColor White
    }
} catch {
    Write-Host "Error: Analysis failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# Test 3: Direct AI Service Test
Write-Host "`n[3/3] Testing Direct AI Service..." -ForegroundColor Yellow
$aiBody = @{
    code = "print('test')"
    language = "python"
} | ConvertTo-Json

try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/analyze/explain" -Method POST -Body $aiBody -ContentType "application/json" -TimeoutSec 60
    Write-Host "Success: Direct AI service test successful!" -ForegroundColor Green
} catch {
    Write-Host "Error: Direct AI test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== All Tests Passed! ===" -ForegroundColor Green
Write-Host "`nYour system is fully operational:" -ForegroundColor Cyan
Write-Host "  - Login: Working" -ForegroundColor Green
Write-Host "  - Backend API: Working" -ForegroundColor Green
Write-Host "  - AI Analysis: Working" -ForegroundColor Green
Write-Host "  - Ollama Model (gpt-oss:120b-cloud): Working" -ForegroundColor Green
Write-Host "`nYou can now use the application at: http://localhost:3000" -ForegroundColor Green
Write-Host "Login credentials: mmm@gmail.com / SecurePass123!" -ForegroundColor Yellow
