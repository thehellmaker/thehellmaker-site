---
title: 'Understanding Micrograd: Building an Autograd Engine from Scratch'
description: "A deep dive into Andrej Karpathy's micrograd - understanding automatic differentiation, backpropagation, and neural networks from first principles with ~150 lines of Python."
pubDate: 'Dec 14 2024'
tags: 'machine-learning, deep-learning, autograd, neural-networks'
group: 'ml-fundamentals'
heroImage: '/blog-placeholder-3.jpg'
authors: ['thehellmaker']
---

## Introduction

Every modern deep learning framework — PyTorch, TensorFlow, JAX — has an **autograd engine** at its core. This engine automatically computes gradients, which are essential for training neural networks. But what exactly happens when you call `.backward()` in PyTorch?

**Micrograd** is Andrej Karpathy's educational autograd engine that answers this question in ~150 lines of Python. It implements **backpropagation** (reverse-mode automatic differentiation) over a dynamically built computation graph, plus a small neural network library with a PyTorch-like API.

> **Repository**: This blog is a self-reference guide for studying [micrograd](https://github.com/karpathy/micrograd) and understanding the mathematics behind neural network training.

---

## Historical Context: Why Micrograd Matters

### The Birth of Backpropagation

The backpropagation algorithm has a fascinating history:

- **1960s-70s**: The chain rule for computing derivatives was well-known in mathematics
- **1970**: Seppo Linnainmaa described automatic differentiation in his master's thesis
- **1986**: David Rumelhart, Geoffrey Hinton, and Ronald Williams popularized backpropagation for neural networks in their landmark paper ["Learning representations by back-propagating errors"](https://www.nature.com/articles/323533a0)
- **2017**: The deep learning revolution made autograd engines ubiquitous

### Andrej Karpathy's Educational Mission

Andrej Karpathy created micrograd as part of his philosophy that **the best way to understand something is to build it from scratch**. He's known for:

- Leading Tesla's Autopilot AI team
- Creating the famous [CS231n](http://cs231n.stanford.edu/) course at Stanford
- His YouTube video ["The spelled-out intro to neural networks and backpropagation"](https://www.youtube.com/watch?v=VMj-3S1tku0) which walks through micrograd

The key insight: modern frameworks abstract away the core mechanisms. By building a minimal implementation, you truly understand what's happening.

---

## Part 1: The Mathematics of Gradients

Before diving into code, let's establish the mathematical foundation.

### What is a Gradient?

A **gradient** is a vector of partial derivatives. For a function $f(x_1, x_2, ..., x_n)$, the gradient is:

$$
\nabla f = \left[ \frac{\partial f}{\partial x_1}, \frac{\partial f}{\partial x_2}, ..., \frac{\partial f}{\partial x_n} \right]
$$

The gradient points in the direction of **steepest ascent**. To minimize a loss function, we move in the **opposite direction** (gradient descent).

### The Chain Rule: The Heart of Backpropagation

The **chain rule** allows us to compute derivatives of composite functions. If $y = f(g(x))$, then:

$$
\frac{dy}{dx} = \frac{dy}{dg} \cdot \frac{dg}{dx}
$$

For neural networks with many layers, we chain multiple derivatives together:

$$
\frac{\partial L}{\partial w_1} = \frac{\partial L}{\partial a_n} \cdot \frac{\partial a_n}{\partial a_{n-1}} \cdot ... \cdot \frac{\partial a_2}{\partial a_1} \cdot \frac{\partial a_1}{\partial w_1}
$$

This is why it's called "backpropagation" — we propagate gradients backwards through the network.

### Why "Automatic" Differentiation?

There are three ways to compute derivatives:

1. **Symbolic differentiation**: Manipulate mathematical expressions (like Wolfram Alpha). Produces exact formulas but can lead to "expression swell"
2. **Numerical differentiation**: Approximate using finite differences: $f'(x) \approx \frac{f(x+h) - f(x)}{h}$. Simple but slow and numerically unstable
3. **Automatic differentiation**: Apply chain rule to elementary operations. Exact, efficient, and what micrograd implements

> **Key insight**: Automatic differentiation doesn't compute a symbolic formula for the derivative. Instead, it computes the **numerical value** of the derivative at a specific point by tracking operations.

---

## Part 2: The Value Class — A Scalar with Memory

The `Value` class is the core abstraction. Each `Value` stores:

```python
class Value:
    """ stores a single scalar value and its gradient """

    def __init__(self, data, _children=(), _op=''):
        self.data = data          # The actual number
        self.grad = 0             # ∂L/∂(this value), initially 0
        self._backward = lambda: None  # Function to compute gradients
        self._prev = set(_children)    # Parent nodes in the graph
        self._op = _op            # Operation that created this node
```

### Understanding the Computation Graph

When you write expressions like `c = a + b`, micrograd builds a **Directed Acyclic Graph (DAG)**:

```
    a ────┐
           ├──► c = a + b
    b ────┘
```

Each node knows its parents (`_prev`), so we can traverse backwards to compute gradients.

**Why a DAG?** 
- **Directed**: Information flows from inputs to outputs
- **Acyclic**: No loops (a value can't depend on itself)
- **Graph** (not tree): A value can be used multiple times

### The Critical `+=` in Gradient Accumulation

Notice that gradients use `+=`, not `=`:

```python
def _backward():
    self.grad += out.grad  # += not =
```

**Why?** A value might be used multiple times. Consider:

```python
a = Value(3.0)
b = a + a  # a is used twice!
```

The computation graph looks like:

```
    a ────┐
           ├──► b = a + a
    a ────┘
```

When we backpropagate:
- First path contributes $\frac{\partial b}{\partial a} = 1$
- Second path contributes $\frac{\partial b}{\partial a} = 1$
- Total: $\frac{\partial b}{\partial a} = 2$ ✓

This is the **multivariate chain rule**: when a variable appears multiple times, we sum the gradients from all paths.

---

## Part 3: Forward Operations and Their Gradients

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

**Mathematical derivation:**

If $z = x + y$, and we have some loss $L$ that depends on $z$, then by the chain rule:

$$
\frac{\partial L}{\partial x} = \frac{\partial L}{\partial z} \cdot \frac{\partial z}{\partial x} = \frac{\partial L}{\partial z} \cdot 1 = \text{out.grad}
$$

$$
\frac{\partial L}{\partial y} = \frac{\partial L}{\partial z} \cdot \frac{\partial z}{\partial y} = \frac{\partial L}{\partial z} \cdot 1 = \text{out.grad}
$$

**Intuition**: Addition is a "gradient distributor" — it passes the gradient equally to both inputs.

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

**Mathematical derivation:**

If $z = x \cdot y$:

$$
\frac{\partial L}{\partial x} = \frac{\partial L}{\partial z} \cdot \frac{\partial z}{\partial x} = \frac{\partial L}{\partial z} \cdot y
$$

$$
\frac{\partial L}{\partial y} = \frac{\partial L}{\partial z} \cdot \frac{\partial z}{\partial y} = \frac{\partial L}{\partial z} \cdot x
$$

**Intuition**: Multiplication "swaps and scales" — each input's gradient is scaled by the **other** input's value.

### Power

```python
def __pow__(self, other):
    assert isinstance(other, (int, float)), "only supporting int/float powers for now"
    out = Value(self.data**other, (self,), f'**{other}')

    def _backward():
        self.grad += (other * self.data**(other-1)) * out.grad
    out._backward = _backward

    return out
```

**Mathematical derivation:**

If $z = x^n$:

$$
\frac{\partial L}{\partial x} = \frac{\partial L}{\partial z} \cdot \frac{\partial z}{\partial x} = \frac{\partial L}{\partial z} \cdot n \cdot x^{n-1}
$$

This is the classic **power rule** from calculus! For example:
- $x^2 \rightarrow 2x$
- $x^3 \rightarrow 3x^2$
- $x^{-1} \rightarrow -x^{-2}$ (used for division!)

### ReLU (Rectified Linear Unit)

```python
def relu(self):
    out = Value(0 if self.data < 0 else self.data, (self,), 'ReLU')

    def _backward():
        self.grad += (out.data > 0) * out.grad
    out._backward = _backward

    return out
```

**Mathematical definition:**

$$
\text{ReLU}(x) = \max(0, x) = \begin{cases} x & \text{if } x > 0 \\ 0 & \text{if } x \leq 0 \end{cases}
$$

**Gradient:**

$$
\frac{\partial \text{ReLU}(x)}{\partial x} = \begin{cases} 1 & \text{if } x > 0 \\ 0 & \text{if } x \leq 0 \end{cases}
$$

**Intuition**: ReLU is a "gate" — it either passes the gradient through unchanged (if positive) or blocks it completely (if negative).

> **Note**: ReLU is not differentiable at $x = 0$, but we typically define the gradient as 0 there. This works fine in practice.

### Why ReLU? A Brief History

Before ReLU, neural networks used **sigmoid** $\sigma(x) = \frac{1}{1+e^{-x}}$ or **tanh** activations. These suffer from the **vanishing gradient problem**: their gradients approach 0 for large inputs, making deep networks hard to train.

ReLU was popularized by the 2012 AlexNet paper and solved this problem — its gradient is either 0 or 1, never vanishingly small (for positive inputs).

---

## Part 4: The Backward Pass — Topological Sort

The `backward()` method is where the magic happens:

```python
def backward(self):
    # Step 1: Build topological order
    topo = []
    visited = set()
    def build_topo(v):
        if v not in visited:
            visited.add(v)
            for child in v._prev:
                build_topo(child)
            topo.append(v)
    build_topo(self)

    # Step 2: Initialize output gradient
    self.grad = 1

    # Step 3: Backpropagate in reverse order
    for v in reversed(topo):
        v._backward()
```

### Why Topological Sort?

**Problem**: To compute $\frac{\partial L}{\partial x}$, we need $\frac{\partial L}{\partial z}$ first (where $z$ depends on $x$).

**Solution**: Process nodes in **reverse topological order** — from outputs to inputs.

**Example**: Consider $L = (a + b) \cdot c$

```
Forward:  a, b → (a+b) → (a+b)·c → L
          c ────────────┘

Topo order: [a, b, c, (a+b), L]
Reverse:    [L, (a+b), c, b, a]
```

When we process in reverse:
1. $L$: Set $\frac{\partial L}{\partial L} = 1$
2. $(a+b) \cdot c$: Compute gradients for $(a+b)$ and $c$
3. $(a+b)$: Compute gradients for $a$ and $b$
4. Done! All gradients computed correctly

### The DFS Algorithm

The topological sort uses **Depth-First Search (DFS)**:

```python
def build_topo(v):
    if v not in visited:
        visited.add(v)
        for child in v._prev:  # Process all children first
            build_topo(child)
        topo.append(v)         # Then add this node
```

**Why DFS works**: A node is added to `topo` only after all its dependencies are added. Reversing this gives us the correct order for backpropagation.

---

## Part 5: Helper Operations — Building a Complete API

Micrograd implements additional operations by **reducing them to primitives**:

```python
def __neg__(self):         # -self
    return self * -1

def __sub__(self, other):  # self - other
    return self + (-other)

def __truediv__(self, other):  # self / other
    return self * other**-1

def __radd__(self, other):  # other + self
    return self + other

def __rmul__(self, other):  # other * self
    return self * other
```

**Key insight**: Division is implemented as multiplication by the reciprocal: $\frac{a}{b} = a \cdot b^{-1}$. The power rule handles $b^{-1}$!

**Why `__radd__` and `__rmul__`?**

Python calls these "reflected" methods when the left operand doesn't support the operation:

```python
2 + Value(3)  # int doesn't know how to add Value
              # Python tries Value.__radd__(2) instead
```

---

## Part 6: The Neural Network Library

### The Neuron

A neuron computes a weighted sum of inputs plus a bias, then applies an activation:

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

**Mathematical formulation:**

$$
y = \sigma\left(\sum_{i=1}^{n} w_i \cdot x_i + b\right) = \sigma(\mathbf{w} \cdot \mathbf{x} + b)
$$

Where $\sigma$ is the activation function (ReLU in this case).

**Weight initialization**: Weights are initialized uniformly in $[-1, 1]$. This is simple but not optimal — modern networks use techniques like Xavier or He initialization.

### The Layer

A layer is multiple neurons that all receive the same input:

```python
class Layer(Module):
    def __init__(self, nin, nout, **kwargs):
        self.neurons = [Neuron(nin, **kwargs) for _ in range(nout)]

    def __call__(self, x):
        out = [n(x) for n in self.neurons]
        return out[0] if len(out) == 1 else out
```

**Visualization:**

```
Input [x₁, x₂]
       │  │
  ┌────┴──┴────┐
  │            │
  ▼            ▼
 N₁           N₂    ... (nout neurons)
  │            │
  ▼            ▼
Output [o₁, o₂]
```

### The MLP (Multi-Layer Perceptron)

An MLP stacks multiple layers:

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

**Example**: `MLP(2, [16, 16, 1])` creates:

| Layer | Input Size | Output Size | Activation |
|-------|------------|-------------|------------|
| 1 | 2 | 16 | ReLU |
| 2 | 16 | 16 | ReLU |
| 3 | 16 | 1 | **Linear** (no activation) |

**Why is the last layer linear?** For classification, we want raw scores that can be positive or negative. The loss function will interpret these scores.

**Parameter count**: `MLP(2, [16, 16, 1])` has:
- Layer 1: $16 \times (2 + 1) = 48$ parameters
- Layer 2: $16 \times (16 + 1) = 272$ parameters  
- Layer 3: $1 \times (16 + 1) = 17$ parameters
- **Total: 337 parameters**

---

## Part 7: Training — Putting It All Together

### The Loss Function

The demo uses **SVM hinge loss** with L2 regularization:

```python
# Hinge loss
losses = [(1 + -yi*scorei).relu() for yi, scorei in zip(yb, scores)]
data_loss = sum(losses) * (1.0 / len(losses))

# L2 regularization
alpha = 1e-4
reg_loss = alpha * sum((p*p for p in model.parameters()))
total_loss = data_loss + reg_loss
```

**Hinge Loss:**

$$
L_{\text{hinge}} = \max(0, 1 - y_i \cdot \hat{y}_i)
$$

Where $y_i \in \{-1, +1\}$ is the true label and $\hat{y}_i$ is the predicted score.

| Condition | Loss | Interpretation |
|-----------|------|----------------|
| $y_i \cdot \hat{y}_i \geq 1$ | 0 | Correct with confidence |
| $0 < y_i \cdot \hat{y}_i < 1$ | $1 - y_i \cdot \hat{y}_i$ | Correct but not confident enough |
| $y_i \cdot \hat{y}_i \leq 0$ | $\geq 1$ | Wrong prediction |

**L2 Regularization:**

$$
L_{\text{reg}} = \alpha \sum_{i} w_i^2
$$

This penalizes large weights, preventing overfitting. The gradient is simply $2\alpha w_i$, which "pulls" weights toward zero.

### The Training Loop

```python
for k in range(100):
    # 1. Forward pass
    total_loss, acc = loss()
    
    # 2. Backward pass
    model.zero_grad()      # Reset gradients to 0
    total_loss.backward()  # Compute all gradients
    
    # 3. Parameter update (SGD)
    learning_rate = 1.0 - 0.9*k/100
    for p in model.parameters():
        p.data -= learning_rate * p.grad
```

**Stochastic Gradient Descent (SGD):**

$$
w_{\text{new}} = w_{\text{old}} - \eta \cdot \frac{\partial L}{\partial w}
$$

**Learning rate schedule**: The learning rate decays from 1.0 to 0.1 over training. This is a simple schedule — modern optimizers like Adam adapt the learning rate automatically.

**Why `zero_grad()`?** Gradients accumulate with `+=`, so we must reset them before each backward pass.

---

## Part 8: Verification Against PyTorch

The test file verifies micrograd produces identical results to PyTorch:

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

    # Verify
    assert ymg.data == ypt.data.item()  # Forward pass
    assert xmg.grad == xpt.grad.item()  # Backward pass
```

This is powerful: a ~100 line implementation produces the **exact same gradients** as a production deep learning framework!

---

## Key Takeaways

### What Micrograd Teaches Us

1. **Neural networks are just functions**: Compositions of simple operations (add, multiply, ReLU)

2. **Backpropagation is just calculus**: The chain rule applied systematically

3. **Automatic differentiation is elegant**: Each operation knows its local derivative; we chain them together

4. **The computation graph is central**: Modern frameworks build dynamic graphs and traverse them for gradients

### What's Missing (For Production)

| Feature | Micrograd | PyTorch/TensorFlow |
|---------|-----------|-------------------|
| Data type | Scalars | Tensors (matrices) |
| Hardware | CPU only | GPU/TPU support |
| Operations | ~5 | Hundreds |
| Optimizers | Manual SGD | Adam, RMSprop, etc. |
| Performance | Educational | Optimized C++/CUDA |

---

## Further Reading & References

### Videos
- 🎥 [Andrej Karpathy: "The spelled-out intro to neural networks and backpropagation: building micrograd"](https://www.youtube.com/watch?v=VMj-3S1tku0) — The definitive walkthrough
- 🎥 [3Blue1Brown: "What is backpropagation really doing?"](https://www.youtube.com/watch?v=Ilg3gGewQ5U) — Beautiful visual intuition
- 🎥 [3Blue1Brown: "Backpropagation calculus"](https://www.youtube.com/watch?v=tIeHLnjs5U8) — The math explained visually

### Papers
- 📄 [Rumelhart, Hinton, Williams (1986): "Learning representations by back-propagating errors"](https://www.nature.com/articles/323533a0) — The paper that popularized backpropagation
- 📄 [Baydin et al. (2018): "Automatic Differentiation in Machine Learning: a Survey"](https://arxiv.org/abs/1502.05767) — Comprehensive overview of autodiff

### Code
- 💻 [micrograd GitHub repository](https://github.com/karpathy/micrograd)
- 💻 [PyTorch autograd documentation](https://pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html)

### Courses
- 🎓 [Stanford CS231n: Convolutional Neural Networks for Visual Recognition](http://cs231n.stanford.edu/) — Karpathy's course with excellent notes on backpropagation
- 🎓 [fast.ai: Practical Deep Learning for Coders](https://course.fast.ai/) — Great for understanding the practitioner's perspective

---

## Conclusion

Micrograd demonstrates that the core of deep learning is remarkably simple:

1. **Forward pass**: Compute output from input by applying operations
2. **Build graph**: Track which operations created which values
3. **Backward pass**: Apply the chain rule in reverse topological order
4. **Update**: Nudge parameters opposite to their gradients

Everything else — tensors, GPUs, fancy optimizers, batch normalization — is optimization and scale. The fundamental algorithm is right here in ~150 lines of Python.

Understanding micrograd means understanding the **foundation** of modern AI. Every transformer, every diffusion model, every language model uses these same principles. The scale is different, but the math is identical.

---

*This blog post serves as a study reference for the [micrograd repository](https://github.com/karpathy/micrograd). Code snippets are from Andrej Karpathy's original implementation.*

