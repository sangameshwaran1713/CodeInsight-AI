from pydantic import BaseModel, Field
from typing import Optional, Any, List
from enum import Enum


class ProgrammingLanguage(str, Enum):
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    PYTHON = "python"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    CSHARP = "csharp"
    GO = "go"
    RUST = "rust"
    PHP = "php"
    RUBY = "ruby"
    SWIFT = "swift"
    KOTLIN = "kotlin"
    SCALA = "scala"
    HTML = "html"
    CSS = "css"
    SQL = "sql"


class AnalysisRequest(BaseModel):
    """Request model for code analysis"""
    code: str = Field(..., min_length=1, max_length=100000, description="The code to analyze")
    language: ProgrammingLanguage = Field(..., description="Programming language of the code")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "def hello():\n    print('Hello, World!')",
                "language": "python"
            }
        }


class AnalysisResponse(BaseModel):
    """Response model for code analysis"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None


class LineAnalysis(BaseModel):
    """Model for line-by-line analysis"""
    line_number: int
    code: str
    explanation: str


class BugReport(BaseModel):
    """Model for bug report"""
    line_number: Optional[int] = None
    severity: str  # low, medium, high, critical
    description: str
    suggestion: Optional[str] = None


class ComplexityReport(BaseModel):
    """Model for complexity analysis"""
    time_complexity: str
    space_complexity: str
    explanation: str
    bottlenecks: Optional[List[str]] = None


class ImprovementSuggestion(BaseModel):
    """Model for improvement suggestion"""
    category: str  # performance, readability, maintainability, security
    description: str
    before: Optional[str] = None
    after: Optional[str] = None
    impact: str  # low, medium, high
