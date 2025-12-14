---
title: 'Detecting Blocking Calls in Python Asyncio Event Loops'
description: "How to find synchronous blocking code that's silently killing your asyncio application's performance using sys.setprofile"
pubDate: 'Dec 14 2024'
tags: 'python, asyncio, debugging'
group: 'systems'
heroImage: '/asyncio-monitor.png'
authors: ['thehellmaker']
---

## The Silent Performance Killer

You've built a beautiful asyncio application. Your handlers are all `async def`. You're using `await` everywhere. Your application should handle thousands of concurrent connections with ease. But something is wrong—requests are timing out, latency is spiking, and your async application feels... synchronous.

The culprit? Hidden synchronous blocking calls buried deep in your codebase or third-party libraries.

```python
async def handle_request(request):
    data = await fetch_from_database(request.id)  # Good - async
    result = json.dumps(data)                       # Bad - blocks if data is large
    time.sleep(0.1)                                 # Very bad - blocks event loop!
    return Response(result)
```

When synchronous code blocks the event loop, every other coroutine waiting to run is blocked too. A single `time.sleep(0.1)` can cascade into thousands of delayed requests.

## Why This Is Hard to Debug

Blocking calls are insidious because:

1. **The code runs without errors** - Python doesn't complain
2. **Performance issues appear intermittently** - Only under load
3. **The blocking code can be anywhere** - In your code, dependencies, or C extensions
4. **Profilers show wall-clock time** - They can't distinguish "waiting on I/O" from "blocking the loop"

You need a tool that specifically detects when synchronous code runs for too long *inside* an async context.

## The Solution: sys.setprofile

Python provides a powerful but often overlooked debugging mechanism: `sys.setprofile()`. This function registers a callback that gets invoked on **every** function call, return, and exception in the Python interpreter.

```python
def profile_callback(frame, event, arg):
    """Called on every function call/return"""
    # frame: Current stack frame with function info
    # event: "call", "return", "c_call", "c_return", etc.
    # arg: Return value or exception info
```

By hooking into this, we can:
1. Record when functions start executing
2. Measure how long they take
3. Only flag calls that happen *inside* an async event loop
4. Skip coroutines (they yield to the event loop, not block it)

## How the Monitor Works

I've released an open-source library called [asyncio-event-loop-monitor](https://github.com/thehellmaker/asyncio-event-loop-monitor) that implements this technique. Here's the core algorithm:

### Step 1: Install the Profile Handler

```python
import sys

class EventLoopMonitor:
    def activate(self):
        self._original_profile = sys.getprofile()
        sys.setprofile(self._profile_handler)

    def deactivate(self):
        sys.setprofile(self._original_profile)
```

### Step 2: Track Function Calls

On each `"call"` event, we record the start time if we're inside an event loop:

```python
def _profile_handler(self, frame, event, arg):
    if event == "call":
        if self._is_inside_event_loop() and not self._is_coroutine(frame):
            self._call_stack[id(frame)] = (frame.f_code.co_qualname, time.perf_counter())
```

### Step 3: Measure Duration on Return

On `"return"` events, we calculate duration and emit a callback if it exceeds the threshold:

```python
    elif event == "return":
        call_data = self._call_stack.pop(id(frame), None)
        if call_data:
            name, start_time = call_data
            duration_ms = (time.perf_counter() - start_time) * 1000
            if duration_ms >= self._threshold_ms:
                self._on_blocking_call(name, duration_ms)
```

### The Key Insight: Skip Coroutines

This is crucial. When you call an `async def` function, Python creates a coroutine object. The coroutine's execution time includes time spent *yielded* to the event loop—time when other coroutines can run. This is NOT blocking.

```python
async def my_coroutine():
    await asyncio.sleep(1)  # Yields for 1 second - NOT blocking!
```

If we tracked this, we'd report 1 second of "blocking" when in fact the event loop was free. We detect coroutines by checking the frame's code flags:

```python
import inspect

def _is_coroutine(frame):
    return bool(frame.f_code.co_flags & (
        inspect.CO_COROUTINE |           # async def
        inspect.CO_ASYNC_GENERATOR |      # async generator
        inspect.CO_ITERABLE_COROUTINE     # @types.coroutine decorated
    ))
```

### How Blocking Calls Inside Coroutines ARE Captured

Here's where it gets clever. When a coroutine calls a synchronous function, that sync function's frame does NOT have the coroutine flag:

```python
async def my_coroutine():       # ← CO_COROUTINE flag = SKIPPED
    time.sleep(0.1)             # ← Regular sync frame = TRACKED!
    json.dumps(big_data)        # ← Regular sync frame = TRACKED!
    await asyncio.sleep(1)      # ← CO_COROUTINE flag = SKIPPED
```

The profiler sees these as separate frames and tracks them independently.

## Using the Library

### Basic Usage

```python
from asyncio_event_loop_monitor import event_loop_monitor_ctx

async def main():
    with event_loop_monitor_ctx(threshold_ms=10.0):
        await process_requests()

asyncio.run(main())
```

Any synchronous call taking longer than 10ms will be logged:

```
WARNING - Event loop blocking detected: myapp.service.process_data took 25.50ms
```

### Custom Callbacks

For production use, you'll want to send metrics to your observability platform:

```python
from asyncio_event_loop_monitor import event_loop_monitor_ctx, BlockingCallInfo
from datadog import statsd

def emit_metrics(info: BlockingCallInfo) -> None:
    statsd.distribution(
        "event_loop.blocking.duration_ms",
        info.duration_ms,
        tags=[f"method:{info.method_name}"]
    )

with event_loop_monitor_ctx(threshold_ms=10.0, on_blocking_call=emit_metrics):
    await process_requests()
```

### Selective Monitoring

You can filter which code paths to monitor:

```python
with event_loop_monitor_ctx(
    threshold_ms=10.0,
    include_paths=["myapp"],           # Only monitor your code
    exclude_paths=["boto3", "grpc"],   # Skip known-noisy libraries
):
    await process_requests()
```

## Performance Considerations

**Warning**: `sys.setprofile` has significant overhead because it's called on EVERY function call and return. Expect:

- 10-30% slowdown on CPU-bound code
- Higher impact on code with many small function calls
- Memory overhead for tracking call stacks

### Recommended Use Cases

| Use Case | Why It Works |
|----------|--------------|
| **Debugging sessions** | Find blockers quickly, disable after |
| **CI/testing** | Catch regressions in PRs |
| **Canary deployments** | Enable on 1% of pods |
| **On-demand profiling** | Enable via request header |

### Not Recommended

- Always-on monitoring in production
- High-throughput, latency-sensitive paths

## Real-World Example: Finding a Hidden Blocker

I recently used this to debug a service that was mysteriously slow. The monitor revealed:

```
Event loop blocking detected: cryptography.hazmat.primitives.hashes.Hash.finalize took 45.23ms
```

A cryptographic hash computation buried three layers deep in an authentication library was blocking the event loop on every request. The fix was simple—move it to a thread pool:

```python
import asyncio

async def hash_password(password: str) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_hash, password)
```

## Installation

```bash
pip install asyncio-event-loop-monitor
```

Or with uv:

```bash
uv add asyncio-event-loop-monitor
```

## Summary

Blocking calls in asyncio applications are a silent performance killer. The `asyncio-event-loop-monitor` library uses Python's `sys.setprofile` to detect them by:

1. Hooking into every function call and return
2. Tracking timing only when inside an event loop
3. Skipping coroutines (they yield, not block)
4. Emitting callbacks when sync calls exceed a threshold

The code is open-source on [GitHub](https://github.com/thehellmaker/asyncio-event-loop-monitor). Give it a try in your next debugging session—you might be surprised what you find lurking in your async code.
