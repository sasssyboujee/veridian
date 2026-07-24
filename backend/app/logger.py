import logging
import sys
import structlog
import re

def redact_secrets(logger, log_method, event_dict):
    """Scrub sensitive data like JWTs, keys, and authorization headers."""
    for key, value in event_dict.items():
        if isinstance(value, str):
            # Redact Bearer tokens
            value = re.sub(
                r"(Bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*",
                r"\1[REDACTED]",
                value,
                flags=re.IGNORECASE
            )
            # Redact anything looking like a private key
            value = re.sub(
                r"-----BEGIN.*PRIVATE KEY.*-----.*-----END.*PRIVATE KEY.*-----",
                "[REDACTED PRIVATE KEY]",
                value,
                flags=re.DOTALL
            )
            event_dict[key] = value
            
    # Remove sensitive keys completely
    sensitive_keys = {"gemini_api_key", "authorization", "token", "jwt", "password", "secret"}
    for k in sensitive_keys:
        if k in event_dict:
            event_dict[k] = "[REDACTED]"
            
    return event_dict

def setup_logging():
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            redact_secrets,
            structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
        ],
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            structlog.processors.JSONRenderer(),
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
