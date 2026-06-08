"""
Centralized logging configuration for the AI service.

Provides structured logging with different formats for development
and production environments. Supports JSON logging for production
log aggregation systems.

Usage:
    from app.utils.logger import logger, get_logger
    
    # Module-level logger
    logger.info("Starting service")
    logger.error("An error occurred", exc_info=True)
    
    # Named logger for specific module
    log = get_logger(__name__)
    log.debug("Debug message")
"""

import logging
import sys
import json
from datetime import datetime
from typing import Optional
from pathlib import Path

from app.config import settings


class JSONFormatter(logging.Formatter):
    """
    JSON formatter for structured logging in production.
    
    Outputs logs as JSON objects for easy parsing by log aggregation
    systems like ELK stack, Datadog, or CloudWatch.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON string."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        
        # Add request context if available
        for field in ["request_id", "user_id", "path", "method"]:
            if hasattr(record, field):
                log_data[field] = getattr(record, field)
        
        return json.dumps(log_data)


class ColoredFormatter(logging.Formatter):
    """
    Colored formatter for development console output.
    
    Provides easy-to-read colored output with timestamps
    for local development.
    """
    
    # ANSI color codes
    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors."""
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime("%H:%M:%S")
        
        # Build message
        msg = f"{color}[{timestamp}] {record.levelname:<8}{self.RESET} "
        msg += f"{record.name}: {record.getMessage()}"
        
        # Add exception info if present
        if record.exc_info:
            msg += f"\n{self.formatException(record.exc_info)}"
        
        return msg


def setup_logging() -> logging.Logger:
    """
    Configure and return the root logger for the application.
    
    Returns:
        logging.Logger: Configured root logger
    """
    # Determine log level
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    
    # Create root logger
    root_logger = logging.getLogger("app")
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    # Choose formatter based on environment
    if settings.environment == "production":
        formatter = JSONFormatter()
    else:
        formatter = ColoredFormatter()
    
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler for production
    if settings.environment == "production":
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        file_handler = logging.FileHandler(log_dir / "app.log")
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(file_handler)
        
        # Error-only file
        error_handler = logging.FileHandler(log_dir / "error.log")
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(error_handler)
    
    return root_logger


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a logger instance for the specified module.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        logging.Logger: Configured logger instance
        
    Example:
        logger = get_logger(__name__)
        logger.info("Processing request")
    """
    return logging.getLogger(f"app.{name}" if name else "app")


# Create and export the main logger
logger = setup_logging()


class LoggerAdapter(logging.LoggerAdapter):
    """
    Custom logger adapter that adds context to all log messages.
    
    Usage:
        log = LoggerAdapter(logger, {"request_id": "abc123"})
        log.info("Processing request")  # Includes request_id
    """
    
    def process(self, msg, kwargs):
        """Add extra context to log message."""
        extra = kwargs.get("extra", {})
        extra.update(self.extra)
        kwargs["extra"] = extra
        return msg, kwargs


def log_request(method: str, path: str, status_code: int, duration_ms: float):
    """
    Log an HTTP request with standard format.
    
    Args:
        method: HTTP method (GET, POST, etc.)
        path: Request path
        status_code: Response status code
        duration_ms: Request duration in milliseconds
    """
    level = logging.WARNING if status_code >= 400 else logging.INFO
    logger.log(
        level,
        f"{method} {path} -> {status_code} ({duration_ms:.1f}ms)",
        extra={
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration_ms": duration_ms,
        }
    )


def log_error(error: Exception, context: Optional[dict] = None):
    """
    Log an error with context information.
    
    Args:
        error: Exception object
        context: Additional context dictionary
    """
    extra = {
        "error_type": type(error).__name__,
        "error_message": str(error),
    }
    if context:
        extra.update(context)
    
    logger.error(
        f"{type(error).__name__}: {error}",
        exc_info=True,
        extra=extra
    )
