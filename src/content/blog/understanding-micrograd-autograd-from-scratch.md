---
title: 'Understanding Micrograd: Building an Autograd Engine from Scratch'
description: "A deep dive into Andrej Karpathy's micrograd - understanding automatic differentiation, backpropagation, and neural networks from first principles with ~150 lines of Python."
pubDate: 'Dec 14 2024'
tags: 'machine-learning, deep-learning, autograd, neural-networks'
group: 'ml-fundamentals'
heroImage: '/blog-placeholder-3.jpg'
authors: ['thehellmaker']
---

## What is this about?

I wanted to understand what actually happens when you call `.backward()` in PyTorch. Not the high-level "it computes gradients" explanation, but the actual mechanics. Turns out, Andrej Karpathy built exactly what I needed: **micrograd** — a ~150 line autograd engine that implements backpropagation from scratch.

This post is my study notes. I'm writing it as a reference for myself, but maybe it helps you too.

The [micrograd repo](https://github.com/karpathy/micrograd) has two files that matter:
- `engine.py` (~95 lines): The autograd engine
- `nn.py` (~60 lines): Neural network building blocks

That's it. Two files, and you can train a neural network.

---

## Some background

Backpropagation has been around since the 1970s (Seppo Linnainmaa's thesis), but it really took off in 1986 when Rumelhart, Hinton, and Williams published ["Learning representations by back-propagating errors"](https://www.nature.com/articles/323533a0). That paper showed you could train multi-layer networks with it.

Karpathy made micrograd because he believes you don't really understand something until you build it. He has a great [YouTube video](https://www.youtube.com/watch?v=VMj-3S1tku0) walking through the whole thing if you prefer video.

---

## The math you need

Before the code, let's get the math straight.

### Gradients

A gradient is just a vector of partial derivatives. If you have a function $f(x_1, x_2, ..., x_n)$:

$$
\nabla f = \left[ \frac{\partial f}{\partial x_1}, \frac{\partial f}{\partial x_2}, ..., \frac{\partial f}{\partial x_n} \right]
$$

It points toward steepest ascent. We want to minimize loss, so we go the opposite direction.

### The chain rule

This is the whole thing. If $y = f(g(x))$:

$$
\frac{dy}{dx} = \frac{dy}{dg} \cdot \frac{dg}{dx}
$$

Neural networks are just nested functions, so we chain a bunch of these together:

$$
\frac{\partial L}{\partial w_1} = \frac{\partial L}{\partial a_n} \cdot \frac{\partial a_n}{\partial a_{n-1}} \cdot ... \cdot \frac{\partial a_2}{\partial a_1} \cdot \frac{\partial a_1}{\partial w_1}
$$

We compute this from the end backwards — hence "backpropagation."

### Why "automatic" differentiation?

Three ways to compute derivatives:

1. **Symbolic** — Manipulate formulas (Wolfram Alpha style). Gets messy fast with complex expressions.
2. **Numerical** — Finite differences: $f'(x) \approx \frac{f(x+h) - f(x)}{h}$. Slow and numerically unstable.
3. **Automatic** — Track operations, apply chain rule. This is what micrograd does.

The key thing: autodiff doesn't give you a formula for the derivative. It gives you the derivative's **value** at a specific point. Big difference.

---

## The Value class

This is the core of everything. Here's what each `Value` stores:

```python
class Value:
    def __init__(self, data, _children=(), _op=''):
        self.data = data          # the actual number
        self.grad = 0             # ∂L/∂(this), starts at 0
        self._backward = lambda: None  # how to propagate gradients
        self._prev = set(_children)    # what created this value
        self._op = _op            # for debugging
```

When you do `c = a + b`, micrograd builds a graph:

```
    a ────┐
           ├──► c = a + b
    b ────┘
```

Each node knows its parents. That's how we traverse backwards.

### Why `+=` for gradients?

Look at this:

```python
def _backward():
    self.grad += out.grad  # += not =
```

Why `+=`? Because a value might be used multiple times:

```python
a = Value(3.0)
b = a + a  # a appears twice
```

Both paths contribute to `a`'s gradient. If `b = a + a`, then $\frac{\partial b}{\partial a} = 2$. We need to sum contributions from all paths — that's the multivariate chain rule.

---

## Operations and their gradients

Let's go through each operation. I'll show the code first, then the math.

### Addition

```python
def __add__(self, other):
    other = other if isinstance(other, Value) else Value(other)
    out = Value(self.data + other.data, (self, other), '+')

    def _backward():
        self.grad += out.grad
        other.grad += out.grad
    out._backward = _backward

    return out
```

If $z = x + y$:

$$
\frac{\partial L}{\partial x} = \frac{\partial L}{\partial z} \cdot 1 = \text{out.grad}
$$

Same for $y$. Addition just passes the gradient through unchanged to both inputs.

### Multiplication

```python
def __mul__(self, other):
    other = other if isinstance(other, Value) else Value(other)
    out = Value(self.data * other.data, (self, other), '*')

    def _backward():
        self.grad += other.data * out.grad
        other.grad += self.data * out.grad
    out._backward = _backward

    return out
```

If $z = x \cdot y$:

$$
\frac{\partial L}{\partial x} = \frac{\partial L}{\partial z} \cdot y
$$

Each input's gradient gets scaled by the *other* input's value. Makes sense if you think about it — if $y$ is large, then small changes in $x$ have big effects on the output.

### Power

```python
def __pow__(self, other):
    assert isinstance(other, (int, float))
    out = Value(self.data**other, (self,), f'**{other}')

    def _backward():
        self.grad += (other * self.data**(other-1)) * out.grad
    out._backward = _backward

    return out
```

If $z = x^n$:

$$
\frac{\partial z}{\partial x} = n \cdot x^{n-1}
$$

Classic power rule from calc. This handles division too — $\frac{a}{b} = a \cdot b^{-1}$, and the power rule gives us the derivative of $b^{-1}$.

### ReLU

```python
def relu(self):
    out = Value(0 if self.data < 0 else self.data, (self,), 'ReLU')

    def _backward():
        self.grad += (out.data > 0) * out.grad
    out._backward = _backward

    return out
```

$$
\text{ReLU}(x) = \max(0, x)
$$

Gradient is 1 if positive, 0 if negative. It's a gate — either lets the gradient through or blocks it.

Why ReLU instead of sigmoid or tanh? Those older activations have gradients that approach 0 for large inputs (vanishing gradient problem). ReLU's gradient is always 0 or 1, which helps deep networks train. AlexNet (2012) popularized this.

(Yes, ReLU isn't differentiable at 0. We just say the gradient is 0 there. Works fine in practice.)

---

## The backward pass

Here's where everything comes together:

```python
def backward(self):
    # Build topological order
    topo = []
    visited = set()
    def build_topo(v):
        if v not in visited:
            visited.add(v)
            for child in v._prev:
                build_topo(child)
            topo.append(v)
    build_topo(self)

    # Backpropagate
    self.grad = 1
    for v in reversed(topo):
        v._backward()
```

### Why topological sort?

To compute $\frac{\partial L}{\partial x}$, you need $\frac{\partial L}{\partial z}$ first (where $z$ depends on $x$). So you have to process nodes in the right order — outputs before inputs.

Example: $L = (a + b) \cdot c$

```
Forward:  a, b → (a+b) → (a+b)·c → L
          c ────────────┘

Topo order: [a, b, c, (a+b), L]
Process reversed: [L, (a+b), c, b, a]
```

The DFS builds this order. A node gets added only after all its dependencies are added. Reverse that, and you process outputs before inputs.

---

## Helper operations

The rest of `engine.py` is boilerplate to make Python syntax work:

```python
def __neg__(self):         return self * -1
def __sub__(self, other):  return self + (-other)
def __truediv__(self, other): return self * other**-1
def __radd__(self, other): return self + other
def __rmul__(self, other): return self * other
```

`__radd__` and `__rmul__` handle cases like `2 + Value(3)` — Python tries `int.__add__` first, which fails, then falls back to `Value.__radd__`.

---

## The neural network bits

Now `nn.py`. This builds on top of `engine.py`.

### Neuron

```python
class Neuron(Module):
    def __init__(self, nin, nonlin=True):
        self.w = [Value(random.uniform(-1,1)) for _ in range(nin)]
        self.b = Value(0)
        self.nonlin = nonlin

    def __call__(self, x):
        act = sum((wi*xi for wi,xi in zip(self.w, x)), self.b)
        return act.relu() if self.nonlin else act
```

A neuron does: $y = \text{ReLU}(w_1 x_1 + w_2 x_2 + ... + b)$

Weights are initialized randomly in $[-1, 1]$. Not the best initialization scheme (Xavier/He initialization is better), but it works for this demo.

### Layer

```python
class Layer(Module):
    def __init__(self, nin, nout, **kwargs):
        self.neurons = [Neuron(nin, **kwargs) for _ in range(nout)]

    def __call__(self, x):
        out = [n(x) for n in self.neurons]
        return out[0] if len(out) == 1 else out
```

A layer is just multiple neurons that all see the same input.

### MLP

```python
class MLP(Module):
    def __init__(self, nin, nouts):
        sz = [nin] + nouts
        self.layers = [Layer(sz[i], sz[i+1], nonlin=i!=len(nouts)-1) 
                       for i in range(len(nouts))]

    def __call__(self, x):
        for layer in self.layers:
            x = layer(x)
        return x
```

`MLP(2, [16, 16, 1])` creates:
- Layer 1: 2 → 16 (with ReLU)
- Layer 2: 16 → 16 (with ReLU)
- Layer 3: 16 → 1 (no ReLU — we want raw scores)

The last layer being linear is important. For classification, we want unbounded scores that the loss function interprets.

Total parameters: $16 \times 3 + 16 \times 17 + 1 \times 17 = 337$

---

## Training

The demo notebook trains on the "moons" dataset. Here's the loss function:

```python
# SVM hinge loss
losses = [(1 + -yi*scorei).relu() for yi, scorei in zip(yb, scores)]
data_loss = sum(losses) * (1.0 / len(losses))

# L2 regularization
alpha = 1e-4
reg_loss = alpha * sum((p*p for p in model.parameters()))
total_loss = data_loss + reg_loss
```

**Hinge loss**: $L = \max(0, 1 - y \cdot \hat{y})$ where $y \in \{-1, +1\}$.

If the prediction has the right sign *and* is confident (magnitude > 1), loss is 0. Otherwise it's penalized.

**L2 regularization**: Adds $\alpha \sum w_i^2$ to prevent weights from exploding. The gradient is $2\alpha w_i$, which gently pulls weights toward zero.

The training loop:

```python
for k in range(100):
    total_loss, acc = loss()
    
    model.zero_grad()
    total_loss.backward()
    
    learning_rate = 1.0 - 0.9*k/100
    for p in model.parameters():
        p.data -= learning_rate * p.grad
```

Standard SGD: $w_{new} = w_{old} - \eta \cdot \nabla L$

The learning rate decays from 1.0 to 0.1. Simple schedule, but it works here.

`zero_grad()` is necessary because gradients accumulate with `+=`. If you don't reset them, you're adding gradients from multiple backward passes.

---

## Does it actually work?

The tests compare micrograd against PyTorch:

```python
def test_sanity_check():
    # Micrograd
    x = Value(-4.0)
    z = 2 * x + 2 + x
    q = z.relu() + z * x
    h = (z * z).relu()
    y = h + q + q * x
    y.backward()
    xmg, ymg = x, y

    # PyTorch
    x = torch.Tensor([-4.0]).double()
    x.requires_grad = True
    z = 2 * x + 2 + x
    q = z.relu() + z * x
    h = (z * z).relu()
    y = h + q + q * x
    y.backward()
    xpt, ypt = x, y

    assert ymg.data == ypt.data.item()
    assert xmg.grad == xpt.grad.item()
```

Same computation, same gradients. A 100-line implementation matches a production framework.

---

## What's missing for production

Micrograd operates on scalars. Real frameworks use tensors and run on GPUs. It also only has ~5 operations; PyTorch has hundreds. And the optimizer here is manual SGD — production code uses Adam, which adapts learning rates automatically.

But the core algorithm is identical. The rest is engineering and optimization.

---

## Resources

If you want to go deeper:

**Karpathy's video**: [The spelled-out intro to neural networks and backpropagation](https://www.youtube.com/watch?v=VMj-3S1tku0) — walks through building micrograd step by step.

**3Blue1Brown**: [What is backpropagation really doing?](https://www.youtube.com/watch?v=Ilg3gGewQ5U) and [Backpropagation calculus](https://www.youtube.com/watch?v=tIeHLnjs5U8) — great visual explanations.

**The original paper**: [Rumelhart, Hinton, Williams (1986)](https://www.nature.com/articles/323533a0) — worth skimming for historical context.

**Autodiff survey**: [Baydin et al.](https://arxiv.org/abs/1502.05767) — if you want the full academic treatment.

---

## Wrapping up

The core of deep learning fits in 150 lines. Forward pass, build a graph, backward pass with chain rule, update weights. That's it.

Everything else — tensors, GPUs, batch norm, transformers — is built on top of this. The scale changes, the fundamentals don't.

---

*Code snippets from [karpathy/micrograd](https://github.com/karpathy/micrograd).*
