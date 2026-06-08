from fastapi import APIRouter, HTTPException
from app.models.analysis import AnalysisRequest, AnalysisResponse
from app.services.anti_gravity_service import AntiGravityService

router = APIRouter()
anti_gravity_service = AntiGravityService()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_anti_gravity(request: AnalysisRequest):
    """
    Specialized anti-gravity code analysis.
    """
    try:
        result = await anti_gravity_service.analyze_code(request.code, request.language)
        if not result.get("success", True):
             return AnalysisResponse(success=False, error=result.get("error"))
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
