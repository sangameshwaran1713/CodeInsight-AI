# AI Service API Examples

## Base URL
```
http://localhost:8000
```

## Endpoints Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze/summary` | POST | Get project summary |
| `/api/analyze/functions` | POST | Explain each function |
| `/api/analyze/explain` | POST | High-level code explanation |
| `/api/analyze/line-by-line` | POST | Line-by-line analysis |
| `/api/analyze/bugs` | POST | Bug detection |
| `/api/analyze/fix` | POST | Fix suggestions |
| `/api/analyze/complexity` | POST | Time/space complexity |
| `/api/analyze/improve` | POST | Improvement suggestions |
| `/api/analyze/full` | POST | Complete analysis |

---

## Request Format

All endpoints accept the same request format:

```json
{
  "language": "python",
  "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)"
}
```

### Supported Languages
`javascript`, `typescript`, `python`, `java`, `cpp`, `c`, `csharp`, `go`, `rust`, `php`, `ruby`, `swift`, `kotlin`, `scala`, `html`, `css`, `sql`

---

## Example Responses

### 1. Project Summary (`/api/analyze/summary`)

**Request:**
```bash
curl -X POST http://localhost:8000/api/analyze/summary \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Mathematical Recursive Functions",
    "purpose": "This module provides recursive implementations of classic mathematical functions including Fibonacci sequence and factorial calculations.",
    "components": [
      {
        "name": "fibonacci",
        "type": "function",
        "purpose": "Calculates the nth Fibonacci number recursively"
      },
      {
        "name": "factorial",
        "type": "function", 
        "purpose": "Calculates the factorial of n recursively"
      }
    ],
    "technologies": ["Python", "Recursion"],
    "architecture": "Simple procedural design with pure recursive functions",
    "entry_points": ["fibonacci", "factorial"],
    "dependencies": [],
    "data_flow": "Integer input → Recursive computation → Integer output"
  }
}
```

---

### 2. Function Explanation (`/api/analyze/functions`)

**Response:**
```json
{
  "success": true,
  "data": "## Function: `fibonacci(n)`\n\n**Purpose:** Calculates the nth number in the Fibonacci sequence.\n\n**Parameters:**\n- `n` (int): The position in the Fibonacci sequence (0-indexed)\n\n**Return Value:** Returns the nth Fibonacci number as an integer.\n\n**Algorithm:**\n1. Base case: If n ≤ 1, return n directly\n2. Recursive case: Return sum of fibonacci(n-1) and fibonacci(n-2)\n\n**Usage Example:**\n```python\nfibonacci(10)  # Returns 55\n```\n\n---\n\n## Function: `factorial(n)`\n\n**Purpose:** Calculates the factorial of n (n!).\n\n**Parameters:**\n- `n` (int): Non-negative integer to calculate factorial for\n\n**Return Value:** Returns n! as an integer.\n\n**Algorithm:**\n1. Base case: If n ≤ 1, return 1\n2. Recursive case: Return n * factorial(n-1)"
}
```

---

### 3. Bug Detection (`/api/analyze/bugs`)

**Response:**
```json
{
  "success": true,
  "data": {
    "llm_analysis": "## Bug Analysis\n\n### Issue 1: Stack Overflow Risk\n- **Severity:** High\n- **Location:** Both functions\n- **Description:** No protection against negative inputs or very large values\n- **Impact:** Could cause RecursionError for large n or infinite recursion for negative n\n- **Fix:** Add input validation\n\n### Issue 2: No Memoization\n- **Severity:** Medium\n- **Location:** `fibonacci` function\n- **Description:** Exponential time complexity due to repeated calculations\n- **Impact:** Extremely slow for n > 30\n- **Fix:** Use memoization or iterative approach",
    "static_analysis": {
      "syntax_check": {
        "valid": true,
        "message": "Syntax is valid"
      },
      "ast_issues": [],
      "pylint_issues": [
        {
          "type": "convention",
          "line": 1,
          "message": "Missing function docstring",
          "symbol": "missing-function-docstring",
          "severity": "low"
        }
      ]
    }
  }
}
```

---

### 4. Time Complexity (`/api/analyze/complexity`)

**Response:**
```json
{
  "success": true,
  "data": {
    "llm_analysis": "## Time Complexity Analysis\n\n### `fibonacci(n)`\n- **Time Complexity:** O(2^n) - Exponential\n- **Space Complexity:** O(n) - Stack depth\n- **Analysis:** Each call branches into two recursive calls, creating exponential growth.\n\n### `factorial(n)`\n- **Time Complexity:** O(n) - Linear\n- **Space Complexity:** O(n) - Stack depth\n- **Analysis:** Single recursive call per level.\n\n### Optimization Suggestions:\n1. Use memoization for fibonacci: O(n) time, O(n) space\n2. Use iterative approach: O(n) time, O(1) space",
    "static_analysis": {
      "cyclomatic_complexity": [
        {
          "name": "fibonacci",
          "type": "F",
          "complexity": 2,
          "rank": "A",
          "line": 1
        },
        {
          "name": "factorial",
          "type": "F",
          "complexity": 2,
          "rank": "A",
          "line": 6
        }
      ],
      "maintainability_index": {
        "score": 75.5,
        "rank": "A"
      },
      "raw_metrics": {
        "loc": 8,
        "lloc": 6,
        "sloc": 6,
        "comments": 0,
        "blank": 1
      }
    }
  }
}
```

---

### 5. Fix Suggestions (`/api/analyze/fix`)

**Response:**
```json
{
  "success": true,
  "data": "## Suggested Fixes\n\n### Fix 1: Add Input Validation\n\n**Problem:** Function doesn't handle negative numbers.\n\n**Before:**\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n```\n\n**After:**\n```python\ndef fibonacci(n):\n    if not isinstance(n, int) or n < 0:\n        raise ValueError('n must be a non-negative integer')\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n```\n\n### Fix 2: Add Memoization\n\n**After:**\n```python\nfrom functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n```"
}
```

---

### 6. Full Analysis (`/api/analyze/full`)

**Response:**
```json
{
  "success": true,
  "data": {
    "project_summary": "{ ... project summary JSON ... }",
    "function_explanations": "## Function: fibonacci(n) ...",
    "bugs": "## Bug Analysis\n\n### Issue 1: ...",
    "fixes": "## Suggested Fixes ...",
    "complexity": "## Time Complexity Analysis ...",
    "improvements": "## Code Improvements ...",
    "static_analysis": {
      "complexity": {
        "cyclomatic_complexity": [...],
        "maintainability_index": {...}
      },
      "bugs": {
        "syntax_check": {...},
        "pylint_issues": [...]
      }
    }
  }
}
```

---

## Error Responses

### Invalid Language
```json
{
  "detail": [
    {
      "type": "enum",
      "loc": ["body", "language"],
      "msg": "Input should be 'python', 'javascript', ..."
    }
  ]
}
```

### Empty Code
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "code"],
      "msg": "String should have at least 1 character"
    }
  ]
}
```

### OpenAI API Error
```json
{
  "detail": "OpenAI API rate limit exceeded. Please try again later."
}
```

---

## Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "CodeInsight AI Service",
  "version": "1.0.0"
}
```
