from fastapi import APIRouter, HTTPException
from app.models.analysis import AnalysisRequest, AnalysisResponse
from app.services.llm_service import LLMService
from app.services.static_analysis import StaticAnalysisService
from app.services.complexity_analyzer import ComplexityAnalyzer, analyze_complexity as analyze_code_complexity
from typing import Optional
import asyncio

router = APIRouter()
llm_service = LLMService()
static_analysis = StaticAnalysisService()
complexity_analyzer = ComplexityAnalyzer()


@router.post("/summary", response_model=AnalysisResponse)
async def get_project_summary(request: AnalysisRequest):
    """Get a comprehensive project summary of the code"""
    try:
        result = await llm_service.get_project_summary(request.code, request.language)
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/functions", response_model=AnalysisResponse)
async def explain_functions(request: AnalysisRequest):
    """Get detailed explanations for each function in the code"""
    try:
        result = await llm_service.explain_functions(request.code, request.language)
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain", response_model=AnalysisResponse)
async def explain_code(request: AnalysisRequest):
    """Get a high-level explanation of what the code does"""
    try:
        result = await llm_service.explain_code(request.code, request.language)
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/line-by-line", response_model=AnalysisResponse)
async def line_by_line_analysis(request: AnalysisRequest):
    """Get line-by-line explanation of the code"""
    try:
        result = await llm_service.line_by_line_analysis(request.code, request.language)
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bugs", response_model=AnalysisResponse)
async def detect_bugs(request: AnalysisRequest):
    """Detect potential bugs in the code"""
    try:
        # Combine static analysis with LLM analysis
        static_result = None
        if request.language == "python":
            static_result = static_analysis.analyze_python_bugs(request.code)
        
        llm_result = await llm_service.detect_bugs(request.code, request.language)
        
        result = {
            "llm_analysis": llm_result,
            "static_analysis": static_result,
        }
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fix", response_model=AnalysisResponse)
async def suggest_fixes(request: AnalysisRequest):
    """Get fix suggestions for the code"""
    try:
        result = await llm_service.suggest_fixes(request.code, request.language)
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/complexity", response_model=AnalysisResponse)
async def analyze_complexity(request: AnalysisRequest):
    """Analyze time and space complexity"""
    try:
        # Use Radon for Python, LLM for other languages
        static_result = None
        detailed_complexity = None
        
        if request.language == "python":
            static_result = static_analysis.analyze_python_complexity(request.code)
            # Use the new detailed complexity analyzer
            detailed_complexity = complexity_analyzer.analyze(request.code)
        
        llm_result = await llm_service.analyze_complexity(request.code, request.language)
        
        result = {
            "llm_analysis": llm_result,
            "static_analysis": static_result,
            "detailed_analysis": detailed_complexity,
        }
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/improve", response_model=AnalysisResponse)
async def improve_code(request: AnalysisRequest):
    """Get code improvement suggestions"""
    try:
        result = await llm_service.improve_code(request.code, request.language)
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/full", response_model=AnalysisResponse)
async def full_analysis(request: AnalysisRequest):
    """Perform comprehensive code analysis with all features"""
    try:
        # Run LLM analyses in parallel
        llm_results = await llm_service.full_analysis(request.code, request.language)
        
        # Static analysis for Python
        static_result = None
        detailed_complexity = None
        
        if request.language == "python":
            static_result = {
                "complexity": static_analysis.analyze_python_complexity(request.code),
                "bugs": static_analysis.analyze_python_bugs(request.code),
            }
            # Use the new detailed complexity analyzer
            detailed_complexity = complexity_analyzer.analyze(request.code)
        
        result = {
            **llm_results,
            "static_analysis": static_result,
            "detailed_complexity": detailed_complexity,
        }
        
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/complexity-detailed", response_model=AnalysisResponse)
async def detailed_complexity_analysis(request: AnalysisRequest):
    """
    Detailed code complexity analysis.
    
    Detects:
    - Loops (for, while, comprehensions)
    - Nested loops with depth tracking
    - Recursion (direct, indirect, tail)
    - Large functions
    
    Returns:
    - Time complexity (Big O notation)
    - Space complexity
    - Optimization suggestions
    - Radon metrics
    """
    try:
        if request.language != "python":
            # For non-Python, use LLM analysis only
            llm_result = await llm_service.analyze_complexity(request.code, request.language)
            return AnalysisResponse(
                success=True,
                data={
                    "llm_analysis": llm_result,
                    "note": "Detailed AST analysis only available for Python"
                }
            )
        
        # Use the comprehensive complexity analyzer
        result = complexity_analyzer.analyze(request.code)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Analysis failed")
            )
        
        return AnalysisResponse(success=True, data=result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
