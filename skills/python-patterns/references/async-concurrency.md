# Concurrency patterns

### Threading for I/O-Bound Tasks

```python
import concurrent.futures
import threading

def fetch_url(url: str) -> str:
    """Fetch a URL (I/O-bound operation)."""
    import urllib.request
    with urllib.request.urlopen(url) as response:
        return response.read().decode()

def fetch_all_urls(urls: list[str]) -> dict[str, str]:
    """Fetch multiple URLs concurrently using threads."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_url = {executor.submit(fetch_url, url): url for url in urls}
        results = {}
        for future in concurrent.futures.as_completed(future_to_url):
            url = future_to_url[future]
            try:
                results[url] = future.result()
            except Exception as e:
                results[url] = f"Error: {e}"
    return results
```

### Multiprocessing for CPU-Bound Tasks

```python
def process_data(data: list[int]) -> int:
    """CPU-intensive computation."""
    return sum(x ** 2 for x in data)

def process_all(datasets: list[list[int]]) -> list[int]:
    """Process multiple datasets using multiple processes."""
    with concurrent.futures.ProcessPoolExecutor() as executor:
        results = list(executor.map(process_data, datasets))
    return results
```

### Async/Await for Concurrent I/O

Prefer `asyncio.TaskGroup` (3.11+) for structured concurrency. Reuse one
`aiohttp.ClientSession` for the whole batch — do not open a session per request.

```python
import asyncio
import aiohttp

async def fetch_async(session: aiohttp.ClientSession, url: str) -> str:
    """Fetch a URL with a shared session."""
    async with session.get(url) as response:
        return await response.text()

async def fetch_all(urls: list[str]) -> dict[str, str]:
    """Fetch multiple URLs concurrently with one session + TaskGroup."""
    results: dict[str, str] = {}
    async with aiohttp.ClientSession() as session:
        async with asyncio.TaskGroup() as tg:
            async def one(url: str) -> None:
                results[url] = await fetch_async(session, url)

            for url in urls:
                tg.create_task(one(url))
    return results
```

`asyncio.gather` remains valid for simple fan-out; prefer `TaskGroup` when you
want failures to cancel sibling tasks (structural concurrency).
