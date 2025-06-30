from typing import Literal, Dict, Any, Optional
from ..clients import OrcaApiClient


def get_portfolio_transactions(
    portfolio_id: str,
    type: Optional[Literal["portfolio", "group"]] = "portfolio",
    quote: Optional[str] = "usdt",
) -> Dict[str, Any]:
    """Get the transactions of a portfolio or group.

    Args:
        portfolio_id (str): The ID of the portfolio to analyze,
        type (portfolio|group): The type of the portfolio to analyze,
        quote (str): The quote currency to use for the analysis.

    Returns:
        dict: status and result, result is a list of transactions in case of success, error message in case of error.
    """
    try:
        client = OrcaApiClient()
        response = client.make_request(
            method="GET",
            endpoint=f"aggregation/{portfolio_id}/transactions",
            params={"quote": quote, "type": type},
        )
        return {
            "status": "success",
            "result": response.json(),
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"An error occurred while getting portfolio transactions: {str(e)}",
        }
