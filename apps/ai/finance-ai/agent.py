import datetime
from zoneinfo import ZoneInfo
from google.adk.agents import Agent
import requests
import json
import os
from typing import Literal


def analyze_portfolio(
    portfolio_id: str,
    type: Literal["portfolio", "group"] = "portfolio",
    quote: str = "usdt",
) -> dict:
    """Analyzes a user's investment portfolio and provides insights.

    Args:
        portfolio_id (str): The ID of the portfolio to analyze,
        type (portfolio|group): The type of the portfolio to analyze,
        quote (str): The quote currency to use for the analysis.

    Returns:
        dict: Analysis results with status and detailed report.
    """
    try:
        # Get API endpoint and credentials from environment variables
        api_url = os.environ.get("ORCA_BACKEND_URL", "http://localhost:3000")
        api_key = os.environ.get("ORCA_API_KEY")

        if not api_key:
            return {
                "status": "error",
                "error_message": "API key not configured. Please set ORCA_API_KEY environment variable.",
            }

        # Prepare headers with authentication
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }

        # Use the portfolio_id passed as a parameter instead of trying to extract from non-existent portfolio_data
        if not portfolio_id:
            return {
                "status": "error",
                "error_message": "Portfolio ID is missing in request data.",
            }

        # Call the backend API to get portfolio data
        endpoint = f"{api_url}/aggregation/{portfolio_id}/assets"
        response = requests.get(
            endpoint, headers=headers, params={"quote": quote, "type": type}
        )

        return {
            "status": "success",
            "report": response.json(),
        }

    except Exception as e:
        return {
            "status": "error",
            "error_message": f"An error occurred while analyzing the portfolio: {str(e)}",
        }


root_agent = Agent(
    name="finance_ai_agent",
    model="gemini-2.0-flash",
    description=(
        "Financial advisor agent to answer questions about investments, portfolio analysis, and financial concepts."
    ),
    instruction=(
        "You are a sophisticated AI financial advisor. Your name is Orca Finance AI. "
        "Your capabilities: "
        "- Analyze portfolio composition and performance "
        "- Identify investment patterns and risk profiles "
        "- Provide personalized financial advice "
        "- Explain financial concepts and market trends "
        "- Make investment recommendations aligned with the user's risk tolerance "
        "When providing advice: "
        "- Be clear, concise, and professional but conversational "
        "- Explain your reasoning when making recommendations "
        "- Consider the user's risk profile when appropriate "
        "- Reference relevant economic data when appropriate "
        "- Always present a balanced view of potential risks and rewards "
        "- Avoid making absolute predictions about market performance "
    ),
    tools=[analyze_portfolio],
)
