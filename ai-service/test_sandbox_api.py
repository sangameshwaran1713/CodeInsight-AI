import httpx
import asyncio
import json

async def test_sandbox_api():
    url = "http://localhost:8000/api/sandbox/execute"
    payload = {
        "code": "print('API Test Success')",
        "language": "python",
        "stdin": "",
        "timeout": 10
    }
    
    print(f"Sending request to {url}...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=12.0)
            print(f"Status Code: {response.status_code}")
            print(f"Response Body: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_sandbox_api())
