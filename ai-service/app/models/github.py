"""
Models for GitHub Repository Analysis
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any, List, Dict
from enum import Enum
import re


class RepoRequest(BaseModel):
    """Request model for GitHub repository analysis"""
    repo_url: str = Field(..., description="GitHub repository URL")
    branch: Optional[str] = Field(default="main", description="Branch to analyze")
    include_patterns: Optional[List[str]] = Field(
        default=["*.py", "*.js", "*.ts", "*.jsx", "*.tsx"],
        description="File patterns to include"
    )
    exclude_patterns: Optional[List[str]] = Field(
        default=["node_modules/*", "__pycache__/*", "*.min.js", "dist/*", "build/*"],
        description="File patterns to exclude"
    )
    max_files: Optional[int] = Field(default=100, description="Maximum files to analyze")
    
    @field_validator("repo_url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        """Validate GitHub URL format"""
        patterns = [
            r"^https?://github\.com/[\w\-\.]+/[\w\-\.]+/?$",
            r"^https?://github\.com/[\w\-\.]+/[\w\-\.]+\.git$",
            r"^git@github\.com:[\w\-\.]+/[\w\-\.]+\.git$",
        ]
        if not any(re.match(p, v) for p in patterns):
            raise ValueError("Invalid GitHub repository URL format")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "repo_url": "https://github.com/username/repo",
                "branch": "main",
                "include_patterns": ["*.py", "*.js"],
                "max_files": 50
            }
        }


class FileInfo(BaseModel):
    """Information about a single file"""
    path: str
    name: str
    size: int
    language: Optional[str] = None
    extension: str
    sha: Optional[str] = None


class FunctionInfo(BaseModel):
    """Information about a function/method"""
    name: str
    type: str  # function, method, class, async_function
    line_start: int
    line_end: Optional[int] = None
    parameters: List[Dict[str, Any]] = []
    docstring: Optional[str] = None
    complexity: Optional[int] = None
    is_async: bool = False


class BugInfo(BaseModel):
    """Information about a detected bug/issue"""
    file: str
    line: int
    severity: str  # critical, high, medium, low, info
    type: str  # syntax, logic, security, performance, style
    message: str
    suggestion: Optional[str] = None


class ImprovementSuggestion(BaseModel):
    """Improvement suggestion for code"""
    file: str
    line: Optional[int] = None
    category: str  # performance, readability, security, maintainability
    priority: str  # high, medium, low
    title: str
    description: str
    code_before: Optional[str] = None
    code_after: Optional[str] = None


class FileAnalysis(BaseModel):
    """Analysis results for a single file"""
    path: str
    language: str
    lines_of_code: int
    functions: List[FunctionInfo] = []
    classes: List[Dict[str, Any]] = []
    imports: List[str] = []
    bugs: List[BugInfo] = []
    complexity_score: Optional[float] = None


class RepoStructure(BaseModel):
    """Repository structure information"""
    total_files: int
    total_lines: int
    languages: Dict[str, int]  # language -> file count
    directories: List[str]
    entry_points: List[str]  # main.py, index.js, etc.


class RepoAnalysisResponse(BaseModel):
    """Complete repository analysis response"""
    success: bool
    repo_info: Optional[Dict[str, Any]] = None
    structure: Optional[RepoStructure] = None
    files_analyzed: int = 0
    file_analyses: List[FileAnalysis] = []
    bugs: List[BugInfo] = []
    improvements: List[ImprovementSuggestion] = []
    summary: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    processing_time_ms: Optional[float] = None
