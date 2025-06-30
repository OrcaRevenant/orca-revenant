from typing import Dict, Any
from datetime import datetime, timezone


def get_current_time() -> Dict[str, Any]:
    """Get the current system time.

    Args:
        (This function takes no arguments)

    Returns:
        dict: status and result, result is the current time in ISO format with timezone information.
    """
    try:
        # Get current UTC time
        current_time = datetime.now(timezone.utc)
        
        # Format as ISO 8601 string
        iso_time = current_time.isoformat()
        
        return {
            "status": "success",
            "result": {
                "time": iso_time,
                "timestamp": int(current_time.timestamp()),
                "timezone": "UTC"
            },
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"An error occurred while getting the current time: {str(e)}",
        }
