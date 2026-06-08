"""
Custom exception classes for the AI service.

Provides a hierarchy of exceptions for different error scenarios,
enabling consistent error handling and response formatting across
the application.

Usage:
    from app.utils.exceptions import AnalysisError, ValidationError
    
    if not code:
        raise ValidationError("Code is required")
    
    try:
        result = analyze(code)
    except AnalysisError as e:
        return {"error": str(e)}
"""

from typing import Optional, Dict, Any


class BaseAPIError(Exception):
    """
    Base exception class for all API errors.
    
    All custom exceptions should inherit from this class to ensure
    consistent error handling and response formatting.
    
    Attributes:
        message: Human-readable error message
        status_code: HTTP status code for the response
        code: Machine-readable error code for client handling
        details: Additional error details
    """
    
    def __init__(
        self,
        message: str = "An error occurred",
        status_code: int = 500,
        code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for JSON response."""
        result = {
            "success": False,
            "error": {
                "message": self.message,
                "code": self.code,
            }
        }
        if self.details:
            result["error"]["details"] = self.details
        return result
    
    def __str__(self) -> str:
        return f"{self.code}: {self.message}"


class ValidationError(BaseAPIError):
    """
    Raised when input validation fails.
    
    Examples:
        - Missing required field
        - Invalid field format
        - Value out of range
    """
    
    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=400,
            code="VALIDATION_ERROR",
            details=details
        )


class NotFoundError(BaseAPIError):
    """
    Raised when a requested resource is not found.
    """
    
    def __init__(
        self,
        message: str = "Resource not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None
    ):
        details = {}
        if resource_type:
            details["resource_type"] = resource_type
        if resource_id:
            details["resource_id"] = resource_id
            
        super().__init__(
            message=message,
            status_code=404,
            code="NOT_FOUND",
            details=details
        )


class UnauthorizedError(BaseAPIError):
    """
    Raised when authentication is required but not provided or invalid.
    """
    
    def __init__(
        self,
        message: str = "Authentication required",
        code: str = "UNAUTHORIZED"
    ):
        super().__init__(
            message=message,
            status_code=401,
            code=code
        )


class ForbiddenError(BaseAPIError):
    """
    Raised when the user doesn't have permission for the requested action.
    """
    
    def __init__(
        self,
        message: str = "Access forbidden",
        required_permission: Optional[str] = None
    ):
        details = {}
        if required_permission:
            details["required_permission"] = required_permission
            
        super().__init__(
            message=message,
            status_code=403,
            code="FORBIDDEN",
            details=details
        )


class RateLimitError(BaseAPIError):
    """
    Raised when rate limit is exceeded.
    """
    
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None
    ):
        details = {}
        if retry_after:
            details["retry_after_seconds"] = retry_after
            
        super().__init__(
            message=message,
            status_code=429,
            code="RATE_LIMIT_EXCEEDED",
            details=details
        )


class AnalysisError(BaseAPIError):
    """
    Raised when code analysis fails.
    
    Examples:
        - Syntax error in code
        - Unsupported language
        - Analysis timeout
    """
    
    def __init__(
        self,
        message: str = "Code analysis failed",
        code: str = "ANALYSIS_FAILED",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=422,
            code=code,
            details=details
        )


class UnsupportedLanguageError(AnalysisError):
    """
    Raised when the code language is not supported.
    """
    
    def __init__(
        self,
        language: str,
        supported_languages: Optional[list] = None
    ):
        details = {"language": language}
        if supported_languages:
            details["supported_languages"] = supported_languages
            
        super().__init__(
            message=f"Language '{language}' is not supported",
            code="UNSUPPORTED_LANGUAGE",
            details=details
        )


class SyntaxAnalysisError(AnalysisError):
    """
    Raised when code has syntax errors that prevent analysis.
    """
    
    def __init__(
        self,
        message: str = "Code contains syntax errors",
        line: Optional[int] = None,
        column: Optional[int] = None,
        syntax_error: Optional[str] = None
    ):
        details = {}
        if line:
            details["line"] = line
        if column:
            details["column"] = column
        if syntax_error:
            details["syntax_error"] = syntax_error
            
        super().__init__(
            message=message,
            code="SYNTAX_ERROR",
            details=details
        )


class TimeoutError(AnalysisError):
    """
    Raised when analysis exceeds the time limit.
    """
    
    def __init__(
        self,
        timeout_seconds: int,
        message: Optional[str] = None
    ):
        super().__init__(
            message=message or f"Analysis timed out after {timeout_seconds} seconds",
            code="ANALYSIS_TIMEOUT",
            details={"timeout_seconds": timeout_seconds}
        )


class ExternalServiceError(BaseAPIError):
    """
    Raised when an external service (e.g., OpenAI) fails.
    """
    
    def __init__(
        self,
        service_name: str,
        message: str = "External service error",
        original_error: Optional[str] = None
    ):
        details = {"service": service_name}
        if original_error:
            details["original_error"] = original_error
            
        super().__init__(
            message=f"{service_name}: {message}",
            status_code=503,
            code="EXTERNAL_SERVICE_ERROR",
            details=details
        )


class OpenAIError(ExternalServiceError):
    """
    Raised when OpenAI API call fails.
    """
    
    def __init__(
        self,
        message: str = "OpenAI API error",
        original_error: Optional[str] = None
    ):
        super().__init__(
            service_name="OpenAI",
            message=message,
            original_error=original_error
        )


class GitHubAPIError(ExternalServiceError):
    """
    Raised when GitHub API call fails.
    """
    
    def __init__(
        self,
        message: str = "GitHub API error",
        status_code: Optional[int] = None,
        original_error: Optional[str] = None
    ):
        super().__init__(
            service_name="GitHub",
            message=message,
            original_error=original_error
        )
        if status_code:
            self.status_code = status_code


class SandboxError(BaseAPIError):
    """
    Raised when code sandbox execution fails.
    """
    
    def __init__(
        self,
        message: str = "Sandbox execution failed",
        code: str = "SANDBOX_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=422,
            code=code,
            details=details
        )


class SandboxTimeoutError(SandboxError):
    """
    Raised when sandbox execution times out.
    """
    
    def __init__(self, timeout_seconds: int):
        super().__init__(
            message=f"Code execution timed out after {timeout_seconds} seconds",
            code="SANDBOX_TIMEOUT",
            details={"timeout_seconds": timeout_seconds}
        )


class SandboxMemoryError(SandboxError):
    """
    Raised when sandbox exceeds memory limit.
    """
    
    def __init__(self, memory_limit: str):
        super().__init__(
            message=f"Code execution exceeded memory limit ({memory_limit})",
            code="SANDBOX_MEMORY_EXCEEDED",
            details={"memory_limit": memory_limit}
        )


class BlockedCodeError(SandboxError):
    """
    Raised when code contains blocked patterns.
    """
    
    def __init__(self, pattern: str):
        super().__init__(
            message=f"Code contains blocked pattern: {pattern}",
            code="BLOCKED_CODE_PATTERN",
            details={"blocked_pattern": pattern}
        )
