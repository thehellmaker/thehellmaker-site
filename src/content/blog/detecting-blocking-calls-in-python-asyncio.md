---
title: 'Detecting Blocking Calls in Python Asyncio Event Loops'
description: "How to find synchronous blocking code that's silently killing your asyncio application's performance using sys.setprofile"
pubDate: 'Dec 14 2024'
tags: 'python, asyncio, debugging'
group: 'systems'
heroImage: '/asyncio-monitor.png'
authors: ['thehellmaker']
---

## Introduction

I was debugging an asyncio service that should have handled thousands of concurrent connections easily. All handlers were `async def`, `await` was everywhere, but requests kept timing out and latency was spiking. The application felt synchronous.

After hours of profiling, I found the culprit: synchronous blocking calls hidden in third-party libraries.

```python
async def handle_request(request):
    data = await fetch_from_database(request.id)  # Good - async
    result = json.dumps(data)                       # Bad - blocks if data is large
    time.sleep(0.1)                                 # Very bad - blocks event loop!
    return Response(result)
```

When synchronous code blocks the event loop, every other coroutine waiting to run is blocked too. A single `time.sleep(0.1)` can cascade into thousands of delayed requests.

## Why This Is Hard to Debug

The problem with blocking calls:

1. Python doesn't complain - the code runs fine
2. Issues only show up under load
3. The blocking code could be anywhere - your code, dependencies, or C extensions
4. Standard profilers can't distinguish "waiting on I/O" from "blocking the loop"

What I needed was a tool that specifically detects synchronous code running too long *inside* an async context.

## Why asyncio.set_debug() Isn't Enough

Python's asyncio has a built-in debug mode:

```python
import asyncio
asyncio.get_event_loop().set_debug(True)
```

When enabled, it warns you if a callback takes too long:

```
Executing <Task pending name='Task-1' coro=<main() running at test.py:10>> took 0.150 seconds
```

The problem? It only tells you *that* blocking happened, not *which specific function* caused it. If your coroutine calls 50 functions and one of them blocks, you still have to hunt through all of them manually.

I needed something that would pinpoint the exact blocking call: `cryptography.hazmat.primitives.hashes.Hash.finalize took 45.23ms`.

## The Solution: sys.setprofile

Python has a lesser-known debugging hook called `sys.setprofile()`. It registers a callback that fires on every function call, return, and exception in the interpreter.

```python
def profile_callback(frame, event, arg):
    """Called on every function call/return"""
    # frame: Current stack frame with function info
    # event: "call", "return", "c_call", "c_return", etc.
    # arg: Return value or exception info
```

With this hook, I can:
1. Record when functions start executing
2. Measure how long they take
3. Only flag calls that happen *inside* an async event loop
4. Skip coroutines (they yield to the event loop, not block it)

## How the Monitor Works

I built a library called [asyncio-event-loop-monitor](https://github.com/thehellmaker/asyncio-event-loop-monitor) that implements this. Here's the core algorithm:

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

### Why We Skip Coroutines

When you call an `async def` function, Python creates a coroutine object. The coroutine's execution time includes time spent *yielded* to the event loop—time when other coroutines can run. That's not blocking.

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

### Catching Blocking Calls Inside Coroutines

But when a coroutine calls a synchronous function, that sync function's frame does NOT have the coroutine flag:

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

You can send metrics to your observability platform:

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

## Performance Overhead

`sys.setprofile` has significant overhead since it's called on EVERY function call and return. In my testing:

- 10-30% slowdown on CPU-bound code
- Higher impact on code with many small function calls
- Memory overhead for tracking call stacks

This means you shouldn't leave it enabled in production. I use it for:

- Debugging sessions - find the blockers, then disable
- CI tests - catch regressions before they hit prod
- Canary deployments - enable on 1% of pods
- On-demand profiling via request header (e.g. `X-Enable-Profiling: true`)

## What I Found

Going back to my original problem - the monitor revealed:

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

## Wrapping Up

The approach uses `sys.setprofile` to hook into every function call, track timing only inside event loops, skip coroutines, and emit callbacks when sync calls exceed a threshold.

I've packaged this into a library called [asyncio-event-loop-monitor](https://github.com/thehellmaker/asyncio-event-loop-monitor). It's saved me hours of debugging - hopefully it helps you too.
