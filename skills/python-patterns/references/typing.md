# Type hints

Target **Python 3.12+** in examples (minimum supported baseline **3.10+**). Prefer
builtin generics and `|` unions. Legacy `typing.List` / `Optional` / `Dict` are
EOL-era forms - do not teach them for new code.

### Basic Type Annotations

```python
from typing import Any

def process_user(
    user_id: str,
    data: dict[str, Any],
    active: bool = True
) -> User | None:
    """Process a user and return the updated User or None."""
    if not active:
        return None
    return User(user_id, data)
```

### Modern builtins and unions

```python
def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

def find_user(user_id: str) -> User | None:
    ...
```

### Type aliases and generics (3.12+)

```python
import json
from typing import Any

type JSON = dict[str, Any] | list[Any] | str | int | float | bool | None

def parse_json(data: str) -> JSON:
    return json.loads(data)

def first[T](items: list[T]) -> T | None:
    """Return the first item or None if list is empty."""
    return items[0] if items else None
```

On 3.10-3.11 without PEP 695 syntax, use `TypeVar` / `TypeAlias` instead of
`type` / `def first[T]`.

### Protocol-Based Duck Typing

```python
from typing import Protocol

class Renderable(Protocol):
    def render(self) -> str:
        """Render the object to a string."""

def render_all(items: list[Renderable]) -> str:
    """Render all items that implement the Renderable protocol."""
    return "\n".join(item.render() for item in items)
```
