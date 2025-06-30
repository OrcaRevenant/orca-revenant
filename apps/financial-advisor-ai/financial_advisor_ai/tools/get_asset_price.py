from typing import Dict, Any, Optional
from ..clients import OrcaApiClient
from datetime import datetime


def get_asset_price(
    symbol: str,
    at: Optional[str] = None,
) -> Dict[str, Any]:
    """Get the price of an asset.

    Args:
        symbol (str): The symbol of the asset to analyze.
        at (str | None): The timestamp to get the price at, user can say "at 10am" or "at 10pm" or any time related phrases.
    Returns:
        dict: A dictionary containing status and result. On success, result includes
        the asset symbol, current price, and timestamp in local time format.
        On error, it includes an error message.
    """
    try:
        client = OrcaApiClient()
        response = client.make_request(
            method="GET",
            endpoint=f"assets/{symbol.lower()}/price",
            params={"at": at} if at else None,
        )

        data = response.json()

        # Format the result in a more user-friendly way
        if "data" in data:
            # Parse and convert the time properly
            utc_time = datetime.fromisoformat(
                data["data"]["time"].replace("Z", "+00:00")
            )
            local_time = utc_time.astimezone()
            # Format in a more human-readable format
            formatted_time = local_time.strftime("%b %d, %Y at %I:%M %p")

            # Format the price with commas for thousands
            price = float(data["data"]["price"])
            formatted_price = f"${price:,.2f}"

            result = {
                "asset": symbol.upper(),
                "price": formatted_price,
                "time": formatted_time,
            }
        else:
            result = data

        return {
            "status": "success",
            "result": result,
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"An error occurred while getting asset price: {str(e)}",
        }
