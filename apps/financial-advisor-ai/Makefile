# Financial Advisor AI with RAG - Makefile
# Convenient commands for development and usage

.PHONY: help install install-all install-dev setup clean test lint format run-example shell

# Default target
help:
	@echo "Financial Advisor AI with RAG - Available Commands"
	@echo "=================================================="
	@echo ""
	@echo "Setup Commands:"
	@echo "  setup          - Run the complete setup script"
	@echo "  install        - Install basic dependencies"
	@echo "  install-all    - Install all dependencies (including optional)"
	@echo "  install-dev    - Install with development dependencies"
	@echo "  shell          - Activate Poetry shell"
	@echo ""
	@echo "Development Commands:"
	@echo "  test           - Run tests with coverage"
	@echo "  lint           - Run linting (flake8, mypy)"
	@echo "  format         - Format code (black, isort)"
	@echo "  clean          - Clean cache and temporary files"
	@echo ""
	@echo "Usage Commands:"
	@echo "  run-example    - Run the RAG example script"
	@echo "  run-agent      - Start the interactive agent"
	@echo "  web            - Start the web interface (ADK web)"
	@echo ""
	@echo "Data Commands:"
	@echo "  create-dirs    - Create necessary directories"
	@echo "  clear-vector   - Clear vector store data"
	@echo ""

# Setup commands
setup: install create-dirs
	@echo "🚀 Setup completed! Dependencies installed and directories created."

install:
	@echo "📦 Installing basic dependencies..."
	poetry install

install-all:
	@echo "📦 Installing all dependencies..."
	poetry install --extras all

install-dev:
	@echo "📦 Installing with development dependencies..."
	poetry install --with dev

shell:
	@echo "🐚 Activating Poetry shell..."
	poetry shell

# Development commands
test:
	@echo "🧪 Running tests..."
	poetry run pytest --cov=financial_advisor_ai --cov-report=term-missing

test-verbose:
	@echo "🧪 Running tests (verbose)..."
	poetry run pytest -v --cov=financial_advisor_ai --cov-report=term-missing --cov-report=html

lint:
	@echo "🔍 Running linting..."
	poetry run flake8 financial_advisor_ai/
	poetry run mypy financial_advisor_ai/

format:
	@echo "✨ Formatting code..."
	poetry run black financial_advisor_ai/ tests/
	poetry run isort financial_advisor_ai/ tests/

format-check:
	@echo "🔍 Checking code format..."
	poetry run black --check financial_advisor_ai/ tests/
	poetry run isort --check-only financial_advisor_ai/ tests/

clean:
	@echo "🧹 Cleaning cache and temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf htmlcov/ 2>/dev/null || true
	rm -rf dist/ 2>/dev/null || true
	rm -rf build/ 2>/dev/null || true

# Usage commands
run-example:
	@echo "🎯 RAG example has been removed. Use 'make web' to start the web interface."

run-agent:
	@echo "🤖 Starting interactive agent..."
	poetry run python -c "from financial_advisor_ai.agent import root_agent; print('Agent ready! Use root_agent.run(\"your question\") to interact')"

web:
	@echo "🌐 Starting Financial Advisor AI Web Interface..."
	@echo "📦 Using Poetry environment with all dependencies..."
	poetry run adk web

# Data commands
create-dirs:
	@echo "📁 Creating necessary directories..."
	mkdir -p data/documents data/vector_store

clear-vector:
	@echo "🗑️  Clearing vector store data..."
	rm -rf data/vector_store/*
	@echo "Vector store cleared. Run the example to rebuild with sample data."

# CI/CD commands
ci-test:
	@echo "🔄 Running CI tests..."
	poetry run pytest --cov=financial_advisor_ai --cov-report=xml --cov-fail-under=80

ci-lint:
	@echo "🔄 Running CI linting..."
	poetry run flake8 financial_advisor_ai/
	poetry run mypy financial_advisor_ai/
	poetry run black --check financial_advisor_ai/ tests/
	poetry run isort --check-only financial_advisor_ai/ tests/

# Development workflow
dev-setup: install-dev create-dirs
	@echo "🛠️  Development environment ready!"

dev-check: format-check lint test
	@echo "✅ All development checks passed!"

# Quick start for new users
quick-start: setup
	@echo "🎉 Quick start completed!"
	@echo "Next: Add your documents to data/documents/ and run 'make web' to start the web interface!"

# Update dependencies
update:
	@echo "📦 Updating dependencies..."
	poetry update

# Show project info
info:
	@echo "📊 Project Information:"
	@echo "======================"
	poetry show --tree
	@echo ""
	@echo "Environment:"
	poetry env info

# Export requirements (for compatibility)
export-requirements:
	@echo "📄 Exporting requirements..."
	poetry export -f requirements.txt --output requirements.txt
	poetry export -f requirements.txt --with dev --output requirements-dev.txt
	@echo "Generated requirements.txt and requirements-dev.txt" 