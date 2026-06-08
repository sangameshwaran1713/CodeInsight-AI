# CodeInsight AI - API Documentation

## Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5000/api` |
| Production | `https://api.codeinsight.com/api` |

---

## Authentication

### Register User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### Login User

**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### Get Current User

**GET** `/auth/me`

Get the currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "65a1b2c3d4e5f6789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "analysisCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Code Analysis

All analysis endpoints require authentication.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Common Request Body

```json
{
  "code": "function hello() { console.log('Hello, World!'); }",
  "language": "javascript"
}
```

**Supported Languages:**
- `javascript`, `typescript`, `python`, `java`, `cpp`, `c`
- `csharp`, `go`, `rust`, `php`, `ruby`, `swift`
- `kotlin`, `scala`, `html`, `css`, `sql`

---

### Explain Code

**POST** `/analysis/explain`

Get a high-level explanation of what the code does.

**Response:** `200 OK`
```json
{
  "success": true,
  "result": "This is a simple function that prints 'Hello, World!' to the console..."
}
```

---

### Line-by-Line Analysis

**POST** `/analysis/line-by-line`

Get detailed explanation for each line of code.

**Response:** `200 OK`
```json
{
  "success": true,
  "result": "**Line 1:** `function hello() {`\nThis declares a function named 'hello'..."
}
```

---

### Detect Bugs

**POST** `/analysis/bugs`

Detect potential bugs and issues in the code.

**Response:** `200 OK`
```json
{
  "success": true,
  "result": {
    "llm_analysis": "No critical bugs detected...",
    "static_analysis": {
      "syntax_check": { "valid": true },
      "issues": []
    }
  }
}
```

---

### Suggest Fixes

**POST** `/analysis/fix`

Get suggestions for fixing issues in the code.

**Response:** `200 OK`
```json
{
  "success": true,
  "result": "The code looks correct. Here are some improvements..."
}
```

---

### Analyze Complexity

**POST** `/analysis/complexity`

Analyze time and space complexity.

**Response:** `200 OK`
```json
{
  "success": true,
  "result": {
    "llm_analysis": "**Time Complexity:** O(1)\n**Space Complexity:** O(1)...",
    "static_analysis": {
      "cyclomatic_complexity": [...],
      "maintainability_index": { "score": 85.5, "rank": "A" }
    }
  }
}
```

---

### Improve Code

**POST** `/analysis/improve`

Get code improvement and optimization suggestions.

**Response:** `200 OK`
```json
{
  "success": true,
  "result": "Here are suggestions to improve your code..."
}
```

---

### Full Analysis

**POST** `/analysis/full`

Perform all analysis types at once.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6789012346",
    "code": "...",
    "language": "javascript",
    "analysisTypes": ["explain", "line-by-line", "bugs", "fix", "complexity", "improve"],
    "results": {
      "explain": { "result": "..." },
      "line-by-line": { "result": "..." },
      "bugs": { "result": "..." },
      "fix": { "result": "..." },
      "complexity": { "result": "..." },
      "improve": { "result": "..." }
    },
    "processingTime": 5432,
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Upload File

**POST** `/analysis/upload`

Upload a code file for analysis.

**Request:** `multipart/form-data`
- `file`: The code file (max 1MB)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "code": "function hello() {...}",
    "language": "javascript",
    "fileName": "example.js"
  }
}
```

---

## History

### Get Analysis History

**GET** `/history`

Get paginated analysis history for the current user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6789012346",
      "code": "function hello()...",
      "language": "javascript",
      "analysisTypes": ["explain", "bugs"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "status": "completed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### Get Single Analysis

**GET** `/history/:id`

Get details of a specific analysis.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6789012346",
    "code": "...",
    "language": "javascript",
    "results": {...},
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Delete Analysis

**DELETE** `/history/:id`

Delete an analysis from history.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Analysis deleted successfully"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per window
- **Headers returned:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
