"""
API response utilities for consistent response formatting.

Provides standardized response structures for success, error,
and paginated responses across all API endpoints.

Usage:
    from app.utils.response import success_response, error_response, paginated_response
    
    @router.get("/items")
    async def get_items():
        items = await fetch_items()
        return success_response(data=items, message="Items retrieved")
"""

from typing import Any, Dict, List, Optional, TypeVar, Generic
from pydantic import BaseModel
from datetime import datetime


# ============================================================
# Response Models
# ============================================================

class SuccessResponse(BaseModel):
    """Standard success response structure."""
    success: bool = True
    message: str = "Success"
    data: Optional[Any] = None
    timestamp: str = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {"id": 1, "name": "Example"},
                "timestamp": "2024-01-01T12:00:00Z"
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response structure."""
    success: bool = False
    message: str
    code: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "message": "Validation failed",
                "code": "VALIDATION_ERROR",
                "details": {"field": "email", "error": "Invalid format"},
                "timestamp": "2024-01-01T12:00:00Z"
            }
        }


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel):
    """Paginated response structure."""
    success: bool = True
    message: str = "Success"
    data: List[Any]
    pagination: PaginationMeta
    timestamp: str = None


# ============================================================
# Response Factory Functions
# ============================================================

def success_response(
    data: Any = None,
    message: str = "Success",
    include_timestamp: bool = True
) -> Dict[str, Any]:
    """
    Create a standardized success response.
    
    Args:
        data: Response payload (any JSON-serializable data)
        message: Human-readable success message
        include_timestamp: Whether to include timestamp
        
    Returns:
        Dictionary formatted as success response
        
    Example:
        >>> success_response(data={"id": 1}, message="User created")
        {
            "success": True,
            "message": "User created",
            "data": {"id": 1},
            "timestamp": "2024-01-01T12:00:00Z"
        }
    """
    response = {
        "success": True,
        "message": message,
    }
    
    if data is not None:
        response["data"] = data
    
    if include_timestamp:
        response["timestamp"] = datetime.utcnow().isoformat() + "Z"
    
    return response


def error_response(
    message: str,
    code: str = "ERROR",
    details: Optional[Dict[str, Any]] = None,
    include_timestamp: bool = True
) -> Dict[str, Any]:
    """
    Create a standardized error response.
    
    Args:
        message: Human-readable error message
        code: Machine-readable error code
        details: Additional error details
        include_timestamp: Whether to include timestamp
        
    Returns:
        Dictionary formatted as error response
        
    Example:
        >>> error_response(
        ...     message="User not found",
        ...     code="NOT_FOUND",
        ...     details={"user_id": 123}
        ... )
        {
            "success": False,
            "message": "User not found",
            "code": "NOT_FOUND",
            "details": {"user_id": 123},
            "timestamp": "2024-01-01T12:00:00Z"
        }
    """
    response = {
        "success": False,
        "message": message,
        "code": code,
    }
    
    if details:
        response["details"] = details
    
    if include_timestamp:
        response["timestamp"] = datetime.utcnow().isoformat() + "Z"
    
    return response


def paginated_response(
    data: List[Any],
    page: int,
    limit: int,
    total: int,
    message: str = "Success",
    include_timestamp: bool = True
) -> Dict[str, Any]:
    """
    Create a standardized paginated response.
    
    Args:
        data: List of items for current page
        page: Current page number (1-indexed)
        limit: Items per page
        total: Total number of items
        message: Success message
        include_timestamp: Whether to include timestamp
        
    Returns:
        Dictionary with data and pagination metadata
        
    Example:
        >>> paginated_response(
        ...     data=[{"id": 1}, {"id": 2}],
        ...     page=1,
        ...     limit=10,
        ...     total=25
        ... )
        {
            "success": True,
            "message": "Success",
            "data": [{"id": 1}, {"id": 2}],
            "pagination": {
                "page": 1,
                "limit": 10,
                "total": 25,
                "total_pages": 3,
                "has_next": True,
                "has_prev": False
            }
        }
    """
    total_pages = (total + limit - 1) // limit  # Ceiling division
    
    response = {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
    }
    
    if include_timestamp:
        response["timestamp"] = datetime.utcnow().isoformat() + "Z"
    
    return response


def analysis_response(
    analysis_result: Dict[str, Any],
    execution_time: Optional[float] = None,
    message: str = "Analysis completed successfully"
) -> Dict[str, Any]:
    """
    Create a response for code analysis results.
    
    Args:
        analysis_result: Analysis data
        execution_time: Time taken for analysis in seconds
        message: Success message
        
    Returns:
        Formatted analysis response
    """
    response = success_response(data=analysis_result, message=message)
    
    if execution_time is not None:
        response["meta"] = {
            "execution_time_seconds": round(execution_time, 3)
        }
    
    return response


# ============================================================
# HTTP Status Codes
# ============================================================

class HttpStatus:
    """HTTP status code constants for consistency."""
    
    # Success
    OK = 200
    CREATED = 201
    ACCEPTED = 202
    NO_CONTENT = 204
    
    # Redirection
    MOVED_PERMANENTLY = 301
    FOUND = 302
    NOT_MODIFIED = 304
    
    # Client Errors
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    METHOD_NOT_ALLOWED = 405
    CONFLICT = 409
    GONE = 410
    UNPROCESSABLE_ENTITY = 422
    TOO_MANY_REQUESTS = 429
    
    # Server Errors
    INTERNAL_SERVER_ERROR = 500
    NOT_IMPLEMENTED = 501
    BAD_GATEWAY = 502
    SERVICE_UNAVAILABLE = 503
    GATEWAY_TIMEOUT = 504


# ============================================================
# Error Codes
# ============================================================

class ErrorCode:
    """Error code constants for client-side handling."""
    
    # General
    INTERNAL_ERROR = "INTERNAL_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    
    # Authentication
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"
    
    # Rate Limiting
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # Analysis
    ANALYSIS_FAILED = "ANALYSIS_FAILED"
    SYNTAX_ERROR = "SYNTAX_ERROR"
    UNSUPPORTED_LANGUAGE = "UNSUPPORTED_LANGUAGE"
    ANALYSIS_TIMEOUT = "ANALYSIS_TIMEOUT"
    
    # Sandbox
    SANDBOX_ERROR = "SANDBOX_ERROR"
    SANDBOX_TIMEOUT = "SANDBOX_TIMEOUT"
    SANDBOX_MEMORY_EXCEEDED = "SANDBOX_MEMORY_EXCEEDED"
    BLOCKED_CODE_PATTERN = "BLOCKED_CODE_PATTERN"
    
    # External Services
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    OPENAI_ERROR = "OPENAI_ERROR"
    GITHUB_ERROR = "GITHUB_ERROR"
