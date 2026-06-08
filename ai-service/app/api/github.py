"""
GitHub Repository Analysis API Routes

Endpoints for analyzing GitHub repositories.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.github import (
    RepoRequest,
    RepoAnalysisResponse,
    RepoStructure
)
from app.services.repo_analyzer import RepoAnalyzer, analyze_github_repo
from app.services.github_service import GitHubService, GitHubAPIError
from app.services.llm_repo_analyzer import LLMRepoAnalyzer, run_llm_analysis
from app.services.advanced_analysis import AdvancedAnalyzer

router = APIRouter()
repo_analyzer = RepoAnalyzer()
github_service = GitHubService()
llm_analyzer = LLMRepoAnalyzer()
advanced_analyzer = AdvancedAnalyzer()


class QuickAnalysisRequest(BaseModel):
    """Simple request with just the URL"""
    repo_url: str = Field(..., description="GitHub repository URL")
    
    class Config:
        json_schema_extra = {
            "example": {
                "repo_url": "https://github.com/fastapi/fastapi"
            }
        }


class RepoInfoResponse(BaseModel):
    """Response for repository info request"""
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


@router.post("/analyze", response_model=RepoAnalysisResponse)
async def analyze_repository(request: RepoRequest):
    """
    Analyze a GitHub repository.
    
    This endpoint:
    1. Fetches repository files from GitHub
    2. Analyzes code structure using AST
    3. Detects bugs and issues
    4. Provides improvement suggestions
    
    Returns a structured analysis report with:
    - Repository metadata
    - File structure overview
    - Per-file analysis (functions, classes, imports)
    - Detected bugs by severity
    - Improvement suggestions
    - Code health score
    """
    try:
        result = await repo_analyzer.analyze_repository(
            repo_url=request.repo_url,
            branch=request.branch,
            include_patterns=request.include_patterns,
            exclude_patterns=request.exclude_patterns,
            max_files=request.max_files
        )
        
        return RepoAnalysisResponse(**result)
        
    except GitHubAPIError as e:
        raise HTTPException(
            status_code=e.status_code or 500,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/analyze/quick", response_model=RepoAnalysisResponse)
async def quick_analyze(request: QuickAnalysisRequest):
    """
    Quick repository analysis with default settings.
    
    Analyzes up to 50 Python and JavaScript/TypeScript files
    in the repository's default branch.
    """
    try:
        result = await repo_analyzer.analyze_repository(
            repo_url=request.repo_url,
            max_files=50
        )
        
        return RepoAnalysisResponse(**result)
        
    except GitHubAPIError as e:
        raise HTTPException(
            status_code=e.status_code or 500,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/info", response_model=RepoInfoResponse)
async def get_repo_info(request: QuickAnalysisRequest):
    """
    Get repository metadata without full analysis.
    
    Returns:
    - Repository name and description
    - Primary language
    - Stars, forks, issues count
    - License information
    - Topics/tags
    """
    try:
        owner, repo = github_service.parse_repo_url(request.repo_url)
        info = await github_service.get_repo_info(owner, repo)
        
        return RepoInfoResponse(success=True, data=info)
        
    except GitHubAPIError as e:
        raise HTTPException(
            status_code=e.status_code or 500,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get repo info: {str(e)}"
        )


@router.post("/structure", response_model=RepoInfoResponse)
async def get_repo_structure(request: RepoRequest):
    """
    Get repository file structure without code analysis.
    
    Returns:
    - Total file count
    - Languages distribution
    - Directory structure
    - Entry points
    """
    try:
        owner, repo = github_service.parse_repo_url(request.repo_url)
        repo_info = await github_service.get_repo_info(owner, repo)
        
        branch = request.branch or repo_info.get("default_branch", "main")
        tree = await github_service.get_tree(owner, repo, branch)
        
        # Analyze structure
        directories = set()
        languages = {}
        files = []
        
        for item in tree:
            if item.get("type") == "blob":
                path = item.get("path", "")
                files.append(path)
                
                # Get directory
                if "/" in path:
                    directories.add("/".join(path.split("/")[:-1]))
                
                # Get language
                ext = path.split(".")[-1] if "." in path else ""
                if ext:
                    lang = github_service._extension_to_language(ext)
                    languages[lang] = languages.get(lang, 0) + 1
        
        structure = {
            "total_files": len(files),
            "directories": sorted(list(directories)),
            "languages": languages,
            "primary_language": repo_info.get("language"),
        }
        
        return RepoInfoResponse(success=True, data=structure)
        
    except GitHubAPIError as e:
        raise HTTPException(
            status_code=e.status_code or 500,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get structure: {str(e)}"
        )


@router.get("/rate-limit")
async def check_rate_limit():
    """
    Check GitHub API rate limit status.
    
    Returns remaining API calls and reset time.
    Useful for monitoring usage, especially for unauthenticated requests.
    """
    try:
        rate_limit = await github_service.check_rate_limit()
        return {"success": True, "data": rate_limit}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check rate limit: {str(e)}"
        )


@router.post("/validate-url")
async def validate_repo_url(request: QuickAnalysisRequest):
    """
    Validate a GitHub repository URL.
    
    Checks if:
    - URL format is valid
    - Repository exists
    - Repository is accessible
    """
    try:
        owner, repo = github_service.parse_repo_url(request.repo_url)
        info = await github_service.get_repo_info(owner, repo)
        
        return {
            "valid": True,
            "owner": owner,
            "repo": repo,
            "full_name": info.get("full_name"),
            "private": info.get("private"),
            "default_branch": info.get("default_branch"),
        }
        
    except GitHubAPIError as e:
        return {
            "valid": False,
            "error": e.message,
            "status_code": e.status_code,
        }
    except ValueError as e:
        return {
            "valid": False,
            "error": str(e),
        }


class LLMAnalysisRequest(BaseModel):
    """Request for LLM-powered analysis"""
    repo_url: str = Field(..., description="GitHub repository URL")
    branch: Optional[str] = Field(None, description="Branch to analyze")
    max_files: int = Field(20, description="Maximum files to analyze")
    analysis_types: Optional[List[str]] = Field(
        None,
        description="Types of analysis: architecture, code_quality, security, performance, refactoring"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "repo_url": "https://github.com/fastapi/fastapi",
                "max_files": 20,
                "analysis_types": ["architecture", "security"]
            }
        }


@router.post("/analyze/llm")
async def llm_powered_analysis(request: LLMAnalysisRequest):
    """
    LLM-powered deep analysis of a GitHub repository.
    
    Uses AI to provide intelligent insights including:
    - Architecture recommendations
    - Code quality assessment with specific fixes
    - Security vulnerability analysis with remediation
    - Performance optimization suggestions
    - Refactoring recommendations
    
    Requires OPENAI_API_KEY to be configured.
    """
    try:
        # First run static analysis
        static_result = await repo_analyzer.analyze_repository(
            repo_url=request.repo_url,
            branch=request.branch,
            max_files=request.max_files
        )
        
        # Get files for LLM analysis
        owner, repo = github_service.parse_repo_url(request.repo_url)
        branch = request.branch or "main"
        files = await github_service.get_files(
            owner, repo, branch,
            max_files=request.max_files
        )
        
        # Run LLM analysis
        llm_result = await run_llm_analysis(files, static_result)
        
        # Filter to requested analysis types if specified
        if request.analysis_types and llm_result.get("available"):
            filtered = {"available": True}
            for analysis_type in request.analysis_types:
                if analysis_type in llm_result:
                    filtered[analysis_type] = llm_result[analysis_type]
            llm_result = filtered
        
        return {
            "success": True,
            "repo": f"{owner}/{repo}",
            "static_analysis": static_result,
            "llm_analysis": llm_result,
        }
        
    except GitHubAPIError as e:
        raise HTTPException(
            status_code=e.status_code or 500,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM analysis failed: {str(e)}"
        )


class AdvancedAnalysisRequest(BaseModel):
    """Request for advanced analysis features"""
    repo_url: str = Field(..., description="GitHub repository URL")
    branch: Optional[str] = Field(None, description="Branch to analyze")
    max_files: int = Field(50, description="Maximum files to analyze")
    include_dependencies: bool = Field(True, description="Analyze dependencies")
    include_duplicates: bool = Field(True, description="Detect code duplication")
    include_dead_code: bool = Field(True, description="Detect dead code")
    include_api_endpoints: bool = Field(True, description="Extract API endpoints")
    include_design_patterns: bool = Field(True, description="Detect design patterns")
    include_test_coverage: bool = Field(True, description="Estimate test coverage")


@router.post("/analyze/advanced")
async def advanced_analysis(request: AdvancedAnalysisRequest):
    """
    Advanced repository analysis with extended features.
    
    Includes:
    - Dependency analysis with vulnerability detection
    - Code duplication detection
    - Dead code detection
    - API endpoint extraction
    - Design pattern recognition
    - Test coverage estimation
    """
    try:
        # Get files
        owner, repo = github_service.parse_repo_url(request.repo_url)
        repo_info = await github_service.get_repo_info(owner, repo)
        branch = request.branch or repo_info.get("default_branch", "main")
        
        files = await github_service.get_files(
            owner, repo, branch,
            max_files=request.max_files
        )
        
        # Convert to dict format for advanced analyzer
        files_data = [{"path": f.path, "content": f.content} for f in files]
        
        result = {
            "success": True,
            "repo": f"{owner}/{repo}",
            "branch": branch,
            "files_analyzed": len(files),
        }
        
        if request.include_dependencies:
            result["dependencies"] = advanced_analyzer.analyze_dependencies(files_data)
        
        if request.include_duplicates:
            result["duplicates"] = advanced_analyzer.detect_code_duplication(files_data)
        
        if request.include_dead_code:
            result["dead_code"] = advanced_analyzer.find_dead_code(files_data)
        
        if request.include_api_endpoints:
            result["api_endpoints"] = advanced_analyzer.extract_api_endpoints(files_data)
        
        if request.include_design_patterns:
            result["design_patterns"] = advanced_analyzer.detect_design_patterns(files_data)
        
        if request.include_test_coverage:
            result["test_coverage"] = advanced_analyzer.estimate_test_coverage(files_data)
        
        return result
        
    except GitHubAPIError as e:
        raise HTTPException(
            status_code=e.status_code or 500,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Advanced analysis failed: {str(e)}"
        )


@router.get("/llm/status")
async def check_llm_status():
    """
    Check if LLM analysis is available.
    
    Returns whether the OpenAI API key is configured
    and basic status information.
    """
    return {
        "available": llm_analyzer.is_available,
        "model": llm_analyzer.model if llm_analyzer.is_available else None,
        "message": "LLM analysis ready" if llm_analyzer.is_available else "OPENAI_API_KEY not configured"
    }
