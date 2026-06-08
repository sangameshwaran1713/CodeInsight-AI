import asyncio
import os
import sys
from typing import Optional

# Add app to path
sys.path.append(os.getcwd())

async def diagnose():
    print("--- Sandbox Service Diagnosis ---")
    from app.services.sandbox_service import SandboxService, Language
    
    svc = SandboxService()
    
    # Check Docker
    docker_available = await svc.check_docker()
    print(f"Docker available: {docker_available}")
    
    # Check Image
    image_exists = await svc.image_exists()
    print(f"Sandbox image exists: {image_exists}")
    
    # Test execution (will use fallback if no docker)
    code = "print('Health check passed')"
    print(f"\nTesting execution with code: {code}")
    
    try:
        result = await svc.execute(code, Language.PYTHON)
        print(f"Success: {result.success}")
        print(f"Stdout: '{result.stdout.strip()}'")
        print(f"Stderr: '{result.stderr.strip()}'")
        print(f"Error field: {result.error}")
        
        if not result.success and not result.error:
            print("WARNING: Execution failed but no error message was provided.")
            
    except Exception as e:
        print(f"EXCEPTION during execution: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(diagnose())
