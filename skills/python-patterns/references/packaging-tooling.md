# Package layout and tooling

## Package Organization

### Standard Project Layout

```
myproject/
├── src/
│   └── mypackage/
│       ├── __init__.py
│       ├── main.py
│       ├── api/
│       │   ├── __init__.py
│       │   └── routes.py
│       ├── models/
│       │   ├── __init__.py
│       │   └── user.py
│       └── utils/
│           ├── __init__.py
│           └── helpers.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_api.py
│   └── test_models.py
├── pyproject.toml
├── uv.lock
├── README.md
└── .gitignore
```

### Import Conventions

```python
# Good: Import order - stdlib, third-party, local
# Ruff's I (isort) rules sort this automatically via `ruff check --fix`
import os
import sys
from pathlib import Path

import requests
from fastapi import FastAPI

from mypackage.models import User
from mypackage.utils import format_name
```

### __init__.py for Package Exports

```python
# mypackage/__init__.py
"""mypackage - A sample Python package."""

__version__ = "1.0.0"

# Export main classes/functions at package level
from mypackage.models import User, Post
from mypackage.utils import format_name

__all__ = ["User", "Post", "format_name"]
```

## Python Tooling Integration

Prefer **uv** for envs/deps/lockfiles and **ruff** for format + lint. Keep mypy
and pytest for types and tests.

### Essential Commands

```bash
# Project / deps (uv)
uv sync
uv add requests
uv run pytest

# Format + lint (ruff consolidates black/isort)
ruff format .
ruff check . --fix

# Type checking
mypy .

# Testing
pytest --cov=mypackage --cov-report=html

# Security scanning
bandit -r .
pip-audit
# safety scan   # not the deprecated `safety check`
```

### pyproject.toml Configuration

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "mypackage"
version = "1.0.0"
requires-python = ">=3.12"
dependencies = [
    "requests>=2.31.0",
    "pydantic>=2.0.0",
]

[dependency-groups]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.8.0",
    "mypy>=1.5.0",
]

[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W"]

[tool.ruff.format]
quote-style = "double"

[tool.mypy]
python_version = "3.12"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--cov=mypackage --cov-report=term-missing"
```
