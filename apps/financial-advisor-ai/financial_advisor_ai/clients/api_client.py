import requests
import os
from typing import Dict, Any, Optional


class OrcaApiClient:
    def __init__(self):
        self.api_url = "http://localhost:3000/"
        self.api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiIxNmI4NDc1Yi1iMmU5LTRkNGMtYTU3Zi04MjU2MDE5OWE2MDkiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ1MDA4ODA1LCJpYXQiOjE3NDUwMDUyMDUsImVtYWlsIjoiYWRhbUBvcmNhLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzQ1MDA1MjA1fV0sInNlc3Npb25faWQiOiJmMWRhMzIxZi05NDY5LTRiMWMtYjFmYi1iMWJiYmZiYjkxYWUiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.Ab1ER8D1e8PJItOAGpoM2WuyFT5mS6Kaj5EpvEiTPwk"

        if not self.api_key:
            raise ValueError(
                "API key not configured. Please set ORCA_API_KEY environment variable."
            )

        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    def make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        additional_headers: Optional[Dict[str, str]] = None,
    ) -> requests.Response:
        url = f"{self.api_url}{endpoint}"
        headers = self.headers.copy()

        if additional_headers:
            headers.update(additional_headers)

        return requests.request(
            method=method, url=url, json=data, params=params, headers=headers
        ) 