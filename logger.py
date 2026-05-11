import logging
import os
import sys

def setup_logger(name):
    """
    Configures a logger with a standard format and level based on environment.
    """
    # Get level from environment, default to INFO
    log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_str, logging.INFO)

    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    # Prevent duplicate handlers if setup_logger is called multiple times for the same name
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger
