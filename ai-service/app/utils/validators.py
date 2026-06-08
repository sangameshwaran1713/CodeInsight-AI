"""
Input validation utilities for the AI service.

Provides validators for common input types including code,
file uploads, URLs, and API request parameters.

Usage:
    from app.utils.validators import validate_code, validate_language
    
    # Validate code input
    is_valid, error = validate_code(user_code, max_length=50000)
    if not is_valid:
        raise ValidationError(error)
"""

import re
from typing import Tuple, Optional, List, Any
from urllib.parse import urlparse


# ============================================================
# Supported Languages Configuration
# ============================================================

SUPPORTED_LANGUAGES = {
    "python": {
        "extensions": [".py", ".pyw"],
        "mime_types": ["text/x-python", "application/x-python"],
        "aliases": ["py", "python3", "python2"],
    },
    "javascript": {
        "extensions": [".js", ".mjs", ".cjs"],
        "mime_types": ["application/javascript", "text/javascript"],
        "aliases": ["js", "node", "nodejs"],
    },
    "typescript": {
        "extensions": [".ts", ".tsx"],
        "mime_types": ["application/typescript", "text/typescript"],
        "aliases": ["ts"],
    },
    "java": {
        "extensions": [".java"],
        "mime_types": ["text/x-java-source"],
        "aliases": [],
    },
    "cpp": {
        "extensions": [".cpp", ".cc", ".cxx", ".c++", ".hpp", ".h"],
        "mime_types": ["text/x-c++src", "text/x-c++hdr"],
        "aliases": ["c++", "cplusplus"],
    },
    "go": {
        "extensions": [".go"],
        "mime_types": ["text/x-go"],
        "aliases": ["golang"],
    },
    "rust": {
        "extensions": [".rs"],
        "mime_types": ["text/x-rust"],
        "aliases": [],
    },
}

# Maximum limits
MAX_CODE_LENGTH = 100000  # 100KB
MAX_FILE_SIZE = 1048576   # 1MB
MIN_CODE_LENGTH = 1


# ============================================================
# Code Validation
# ============================================================

def validate_code(
    code: str,
    max_length: int = MAX_CODE_LENGTH,
    min_length: int = MIN_CODE_LENGTH,
    allow_empty: bool = False
) -> Tuple[bool, Optional[str]]:
    """
    Validate code input for basic requirements.
    
    Args:
        code: Source code string
        max_length: Maximum allowed characters
        min_length: Minimum required characters
        allow_empty: Whether to allow empty code
        
    Returns:
        Tuple of (is_valid, error_message)
        
    Example:
        >>> is_valid, error = validate_code("print('hello')")
        >>> print(is_valid)
        True
    """
    # Check if code is provided
    if code is None:
        return False, "Code is required"
    
    if not isinstance(code, str):
        return False, "Code must be a string"
    
    # Check length
    code_length = len(code)
    
    if not allow_empty and code_length < min_length:
        return False, f"Code must be at least {min_length} character(s)"
    
    if code_length > max_length:
        return False, f"Code exceeds maximum length of {max_length:,} characters"
    
    # Check for binary content (non-text)
    if '\x00' in code:
        return False, "Code contains binary content"
    
    return True, None


def validate_language(
    language: str,
    supported: Optional[List[str]] = None
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate and normalize language identifier.
    
    Args:
        language: Language string (can be alias or extension)
        supported: List of supported languages (defaults to all)
        
    Returns:
        Tuple of (is_valid, error_message, normalized_language)
        
    Example:
        >>> is_valid, error, lang = validate_language("py")
        >>> print(lang)
        'python'
    """
    if not language:
        return False, "Language is required", None
    
    language_lower = language.lower().strip()
    supported_langs = supported or list(SUPPORTED_LANGUAGES.keys())
    
    # Direct match
    if language_lower in supported_langs:
        return True, None, language_lower
    
    # Check aliases
    for lang, config in SUPPORTED_LANGUAGES.items():
        if lang not in supported_langs:
            continue
        if language_lower in config.get("aliases", []):
            return True, None, lang
    
    # Check extensions
    for lang, config in SUPPORTED_LANGUAGES.items():
        if lang not in supported_langs:
            continue
        ext = f".{language_lower}" if not language_lower.startswith(".") else language_lower
        if ext in config.get("extensions", []):
            return True, None, lang
    
    return False, f"Unsupported language: '{language}'. Supported: {', '.join(supported_langs)}", None


def detect_language(
    filename: Optional[str] = None,
    code: Optional[str] = None
) -> Optional[str]:
    """
    Detect programming language from filename or code content.
    
    Args:
        filename: Name of the file
        code: Source code (for heuristic detection)
        
    Returns:
        Detected language or None
    """
    # Detection by filename
    if filename:
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        for lang, config in SUPPORTED_LANGUAGES.items():
            if ext in config.get("extensions", []):
                return lang
    
    # Heuristic detection from code
    if code:
        code_lower = code.lower()
        
        # Python indicators
        if re.search(r'^(import\s+|from\s+\w+\s+import|def\s+\w+\s*\(|class\s+\w+)', code, re.MULTILINE):
            return "python"
        
        # JavaScript/TypeScript indicators
        if re.search(r'(const\s+|let\s+|var\s+|function\s+\w+|=>\s*{|require\(|import\s+.*\s+from)', code):
            if "interface " in code or ": string" in code_lower or ": number" in code_lower:
                return "typescript"
            return "javascript"
        
        # Java indicators
        if re.search(r'(public\s+class|private\s+|protected\s+|System\.out\.)', code):
            return "java"
        
        # Go indicators
        if re.search(r'(package\s+main|func\s+\w+\(|import\s+")', code):
            return "go"
        
        # Rust indicators
        if re.search(r'(fn\s+\w+|let\s+mut|impl\s+|pub\s+fn)', code):
            return "rust"
        
        # C++ indicators
        if re.search(r'(#include\s*<|std::|iostream|namespace\s+)', code):
            return "cpp"
    
    return None


# ============================================================
# URL Validation
# ============================================================

def validate_url(
    url: str,
    allowed_schemes: Optional[List[str]] = None,
    allowed_hosts: Optional[List[str]] = None
) -> Tuple[bool, Optional[str]]:
    """
    Validate a URL string.
    
    Args:
        url: URL string to validate
        allowed_schemes: List of allowed schemes (default: http, https)
        allowed_hosts: List of allowed hosts (default: any)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not url:
        return False, "URL is required"
    
    allowed_schemes = allowed_schemes or ["http", "https"]
    
    try:
        parsed = urlparse(url)
        
        if not parsed.scheme:
            return False, "URL must include scheme (http/https)"
        
        if parsed.scheme not in allowed_schemes:
            return False, f"URL scheme must be one of: {', '.join(allowed_schemes)}"
        
        if not parsed.netloc:
            return False, "URL must include host"
        
        if allowed_hosts and parsed.netloc not in allowed_hosts:
            return False, f"URL host must be one of: {', '.join(allowed_hosts)}"
        
        return True, None
        
    except Exception as e:
        return False, f"Invalid URL format: {str(e)}"


def validate_github_url(url: str) -> Tuple[bool, Optional[str], Optional[dict]]:
    """
    Validate and parse a GitHub repository URL.
    
    Args:
        url: GitHub URL string
        
    Returns:
        Tuple of (is_valid, error_message, parsed_info)
        
    Example:
        >>> is_valid, error, info = validate_github_url("https://github.com/owner/repo")
        >>> print(info)
        {'owner': 'owner', 'repo': 'repo'}
    """
    if not url:
        return False, "GitHub URL is required", None
    
    # Patterns for GitHub URLs
    patterns = [
        r"https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$",
        r"https?://github\.com/([^/]+)/([^/]+?)(?:/tree/[^/]+)?/?$",
        r"git@github\.com:([^/]+)/([^/]+?)(?:\.git)?$",
    ]
    
    for pattern in patterns:
        match = re.match(pattern, url.strip())
        if match:
            owner, repo = match.groups()
            return True, None, {"owner": owner, "repo": repo.rstrip(".git")}
    
    return False, "Invalid GitHub repository URL format", None


# ============================================================
# Numeric Validation
# ============================================================

def validate_integer(
    value: Any,
    min_value: Optional[int] = None,
    max_value: Optional[int] = None,
    field_name: str = "Value"
) -> Tuple[bool, Optional[str], Optional[int]]:
    """
    Validate and parse an integer value.
    
    Args:
        value: Value to validate
        min_value: Minimum allowed value
        max_value: Maximum allowed value
        field_name: Name of field for error messages
        
    Returns:
        Tuple of (is_valid, error_message, parsed_value)
    """
    try:
        int_value = int(value)
    except (TypeError, ValueError):
        return False, f"{field_name} must be an integer", None
    
    if min_value is not None and int_value < min_value:
        return False, f"{field_name} must be at least {min_value}", None
    
    if max_value is not None and int_value > max_value:
        return False, f"{field_name} must be at most {max_value}", None
    
    return True, None, int_value


# ============================================================
# String Validation
# ============================================================

def validate_string(
    value: Any,
    min_length: int = 0,
    max_length: Optional[int] = None,
    pattern: Optional[str] = None,
    field_name: str = "Value"
) -> Tuple[bool, Optional[str]]:
    """
    Validate a string value.
    
    Args:
        value: Value to validate
        min_length: Minimum string length
        max_length: Maximum string length
        pattern: Regex pattern to match
        field_name: Name of field for error messages
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(value, str):
        return False, f"{field_name} must be a string"
    
    if len(value) < min_length:
        return False, f"{field_name} must be at least {min_length} characters"
    
    if max_length is not None and len(value) > max_length:
        return False, f"{field_name} must be at most {max_length} characters"
    
    if pattern and not re.match(pattern, value):
        return False, f"{field_name} has invalid format"
    
    return True, None


def sanitize_string(
    value: str,
    max_length: Optional[int] = None,
    strip_whitespace: bool = True,
    remove_null_bytes: bool = True
) -> str:
    """
    Sanitize a string value.
    
    Args:
        value: String to sanitize
        max_length: Maximum length (truncate if exceeded)
        strip_whitespace: Whether to strip leading/trailing whitespace
        remove_null_bytes: Whether to remove null bytes
        
    Returns:
        Sanitized string
    """
    if strip_whitespace:
        value = value.strip()
    
    if remove_null_bytes:
        value = value.replace('\x00', '')
    
    if max_length and len(value) > max_length:
        value = value[:max_length]
    
    return value
