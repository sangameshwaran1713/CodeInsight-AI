# Authentication API Examples

## Overview

This document provides example API requests for the user authentication system.

## Base URL

```
http://localhost:5000/api/auth
```

---

## User Registration

### Endpoint
```
POST /api/auth/register
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### cURL Example
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Success Response (201 Created)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

---

## User Login

### Endpoint
```
POST /api/auth/login
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### cURL Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Success Response (200 OK)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Get Current User (Protected Route)

### Endpoint
```
GET /api/auth/me
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

### cURL Example
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Success Response (200 OK)
```json
{
  "success": true,
  "user": {
    "id": "65f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "analysisCount": 5,
    "createdAt": "2026-03-07T10:30:00.000Z"
  }
}
```

### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

## Update User Profile (Protected Route)

### Endpoint
```
PUT /api/auth/profile
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

### Request Body
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

### cURL Example
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "John Smith",
    "email": "johnsmith@example.com"
  }'
```

### Success Response (200 OK)
```json
{
  "success": true,
  "user": {
    "id": "65f1234567890abcdef12345",
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "role": "user"
  }
}
```

---

## JavaScript/Axios Examples

### Register User
```javascript
const axios = require('axios');

const register = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
    
    console.log('Token:', response.data.token);
    console.log('User:', response.data.user);
  } catch (error) {
    console.error('Error:', error.response.data.message);
  }
};
```

### Login User
```javascript
const login = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'john@example.com',
      password: 'password123'
    });
    
    // Store token for future requests
    const token = response.data.token;
    localStorage.setItem('token', token);
    
    return token;
  } catch (error) {
    console.error('Error:', error.response.data.message);
  }
};
```

### Access Protected Route
```javascript
const getProfile = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('User Profile:', response.data.user);
  } catch (error) {
    console.error('Error:', error.response.data.message);
  }
};
```

### Axios Instance with Interceptor
```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usage
const user = await api.get('/auth/me');
```

---

## PowerShell Examples

### Register User
```powershell
$body = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Login User
```powershell
$body = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$token = $response.token
```

### Access Protected Route
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" `
    -Method GET `
    -Headers $headers
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created (registration successful) |
| 400 | Bad Request (validation error, user exists) |
| 401 | Unauthorized (invalid credentials, missing/invalid token) |
| 403 | Forbidden (insufficient role permissions) |
| 500 | Internal Server Error |

---

## JWT Token Structure

The JWT token contains:
```json
{
  "id": "65f1234567890abcdef12345",
  "iat": 1709808000,
  "exp": 1710412800
}
```

- `id`: User's MongoDB ObjectId
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (default: 7 days)

### Token Usage
Include the token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Environment Variables

Required in `.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/codeinsight
```
