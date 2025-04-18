# Financial Advisor AI

A Python application for financial advising using AI.

## Installation

This project uses Poetry for dependency management.

```bash
# Install Poetry if you don't have it
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install
```

## Development

```bash
# Activate the virtual environment
poetry shell

# Run tests
pytest

# Run code formatting
black .
isort .

# Run type checking
mypy .

# Run linting
flake8
```

## Usage

```bash
# Run the application
poetry run financial-advisor
```

## Project Structure

```
financial-advisor-ai/
├── financial_advisor_ai/     # Main package
│   ├── __init__.py
│   └── main.py               # Entry point
├── tests/                    # Test directory
│   ├── __init__.py
│   └── test_main.py          # Tests for main module
├── pyproject.toml            # Poetry configuration
└── README.md                 # This file
``` 