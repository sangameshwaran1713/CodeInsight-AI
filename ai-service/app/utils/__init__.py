"""
Utility modules for the AI service.

This package provides shared utilities including:
- Logger: Structured logging for development and production
- Exceptions: Custom exception classes for error handling
- Response: Standardized API response formatting
- Validators: Input validation functions
- Helpers: General helper functions
"""

from app.utils.helpers import (
    clean_code,
    count_lines,
    extract_functions,
    estimate_complexity_simple,
    format_analysis_response,
)
from app.utils.logger import logger, get_logger, log_request, log_error
from app.utils.exceptions import (
    BaseAPIError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    RateLimitError,
    AnalysisError,
    UnsupportedLanguageError,
    SyntaxAnalysisError,
    ExternalServiceError,
    OpenAIError,
    SandboxError,
    SandboxTimeoutError,
    SandboxMemoryError,
    BlockedCodeError,
)
from app.utils.response import (
    success_response,
    error_response,
    paginated_response,
    analysis_response,
    HttpStatus,
    ErrorCode,
)
from app.utils.validators import (
    validate_code,
    validate_language,
    detect_language,
    validate_url,
    validate_github_url,
    validate_integer,
    validate_string,
    sanitize_string,
    SUPPORTED_LANGUAGES,
)

__all__ = [
    # Helpers
    "clean_code",
    "count_lines",
    "extract_functions",
    "estimate_complexity_simple",
    "format_analysis_response",
    
    # Logger
    "logger",
    "get_logger",
    "log_request",
    "log_error",
    
    # Exceptions
    "BaseAPIError",
    "ValidationError",
    "NotFoundError",
    "UnauthorizedError",
    "ForbiddenError",
    "RateLimitError",
    "AnalysisError",
    "UnsupportedLanguageError",
    "SyntaxAnalysisError",
    "ExternalServiceError",
    "OpenAIError",
    "SandboxError",
    "SandboxTimeoutError",
    "SandboxMemoryError",
    "BlockedCodeError",
    
    # Response
    "success_response",
    "error_response",
    "paginated_response",
    "analysis_response",
    "HttpStatus",
    "ErrorCode",
    
    # Validators
    "validate_code",
    "validate_language",
    "detect_language",
    "validate_url",
    "validate_github_url",
    "validate_integer",
    "validate_string",
    "sanitize_string",
    "SUPPORTED_LANGUAGES",
]
