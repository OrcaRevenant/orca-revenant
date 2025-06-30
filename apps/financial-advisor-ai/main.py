# """
# Main script to demonstrate the usage of all tools in the financial_advisor_ai package.
# """

# import json
# from financial_advisor_ai.tools import (
#     get_portfolio_assets,
#     get_portfolio_transactions,
#     get_asset_price
# )

# def print_result(tool_name, result):
#     """Print the result of a tool in a formatted way."""
#     print(f"\n{'=' * 50}")
#     print(f"Tool: {tool_name}")
#     print(f"{'=' * 50}")
#     print(json.dumps(result, indent=2))
#     print(f"{'=' * 50}\n")

# def main():
#     # """Run all tools with example parameters."""
#     # # Example portfolio ID - replace with actual ID when using
#     # portfolio_id = "example-portfolio-id"
    
#     # # Call get_portfolio_assets
#     # print("Calling get_portfolio_assets...")
#     # assets_result = get_portfolio_assets(
#     #     portfolio_id=portfolio_id,
#     #     type="portfolio",
#     #     quote="usdt"
#     # )
#     # print_result("get_portfolio_assets", assets_result)

#     # # Call get_portfolio_transactions
#     # print("Calling get_portfolio_transactions...")
#     # transactions_result = get_portfolio_transactions(
#     #     portfolio_id=portfolio_id,
#     #     type="portfolio",
#     #     limit=10
#     # )
#     # print_result("get_portfolio_transactions", transactions_result)

#     # Call get_asset_price
#     print("Calling get_asset_price...")
#     asset_price_result = get_asset_price(
#         symbol="btc"
#     )
#     print_result("get_asset_price", asset_price_result)

# if __name__ == "__main__":
#     main() 