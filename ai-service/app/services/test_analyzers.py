"""
Test script for GitHub Repository Analyzer

Tests all analyzer features without requiring actual GitHub API access.
Uses mock data to verify:
- Code structure analysis
- Bug detection
- Complexity analysis
- Advanced features (dependencies, duplicates, dead code, etc.)
"""

import asyncio
import json
from dataclasses import dataclass
from typing import List


# Mock GitHubFile class for testing
@dataclass
class MockGitHubFile:
    path: str
    name: str
    content: str
    size: int = 0
    sha: str = "mock_sha"


# Sample Python code with various patterns
SAMPLE_PYTHON_CODE = '''
"""Sample module for testing"""

import os
import sys
import json
from typing import List, Dict, Optional

# Unused import
import hashlib

# Global variable (anti-pattern)
global_config = {}

# Hardcoded secret (security issue)
API_KEY = "sk-12345-secret-key"


class Singleton:
    """Singleton pattern example"""
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance


def fibonacci(n: int) -> int:
    """Calculate fibonacci number recursively"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)


def process_data(data: List[str]) -> Dict:
    """Process data with nested loops - O(n^2)"""
    result = {}
    for i in range(len(data)):  # Should use enumerate
        for j in range(len(data)):
            if data[i] == data[j]:
                result[i] = j
    return result


def unused_function():
    """This function is never called"""
    pass


def function_without_docstring(x, y):
    try:
        result = eval(x + y)  # Security issue: eval
    except:  # Bare except (anti-pattern)
        result = None
    return result


async def fetch_data(url: str) -> dict:
    """Async function example"""
    import time
    time.sleep(1)  # Blocking sleep in async (performance issue)
    return {"url": url}


# Code duplication example
def validate_email_1(email):
    if "@" not in email:
        return False
    if "." not in email:
        return False
    return True

def validate_email_2(email):
    if "@" not in email:
        return False
    if "." not in email:
        return False
    return True


if __name__ == "__main__":
    print("Running")
'''

SAMPLE_JS_CODE = '''
// Sample JavaScript code
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();

// Hardcoded password (security)
const PASSWORD = "admin123";

// API endpoints
app.get('/api/users', (req, res) => {
    res.json({ users: [] });
});

app.post('/api/login', (req, res) => {
    // Using innerHTML (XSS vulnerability)
    document.innerHTML = req.body.html;
    res.json({ token: 'abc' });
});

app.put('/api/users/:id', (req, res) => {
    res.json({ updated: true });
});

// Using var instead of const/let
var oldStyle = true;

// Using == instead of ===
if (oldStyle == true) {
    console.log("Legacy code");
}

function calculate(a, b) {
    return eval(a + b);  // Dangerous eval
}

module.exports = app;
'''

SAMPLE_FASTAPI_CODE = '''
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

app = FastAPI()

class User(BaseModel):
    username: str
    email: str

def get_current_user():
    return {"id": 1}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/users")
async def list_users():
    return []

@app.post("/api/users")
async def create_user(user: User, current_user = Depends(get_current_user)):
    return user

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int):
    return {"deleted": user_id}
'''

SAMPLE_REQUIREMENTS = '''
# Requirements
fastapi==0.109.0
uvicorn==0.27.0
requests==2.2.0
flask==0.12.0
pyyaml==5.1.0
pydantic==2.5.3
'''

SAMPLE_TEST_CODE = '''
import pytest
from main import fibonacci, process_data, validate_email_1

def test_fibonacci():
    assert fibonacci(0) == 0
    assert fibonacci(1) == 1
    assert fibonacci(5) == 5

def test_process_data():
    result = process_data(["a", "b"])
    assert isinstance(result, dict)

def test_validate_email():
    assert validate_email_1("test@example.com") == True
    assert validate_email_1("invalid") == False
'''


def create_mock_files() -> List[MockGitHubFile]:
    """Create mock files for testing"""
    return [
        MockGitHubFile(
            path="src/main.py",
            name="main.py",
            content=SAMPLE_PYTHON_CODE,
            size=len(SAMPLE_PYTHON_CODE),
        ),
        MockGitHubFile(
            path="src/api/routes.py",
            name="routes.py",
            content=SAMPLE_FASTAPI_CODE,
            size=len(SAMPLE_FASTAPI_CODE),
        ),
        MockGitHubFile(
            path="frontend/app.js",
            name="app.js",
            content=SAMPLE_JS_CODE,
            size=len(SAMPLE_JS_CODE),
        ),
        MockGitHubFile(
            path="requirements.txt",
            name="requirements.txt",
            content=SAMPLE_REQUIREMENTS,
            size=len(SAMPLE_REQUIREMENTS),
        ),
        MockGitHubFile(
            path="tests/test_main.py",
            name="test_main.py",
            content=SAMPLE_TEST_CODE,
            size=len(SAMPLE_TEST_CODE),
        ),
    ]


def test_complexity_analyzer():
    """Test the complexity analyzer"""
    print("\n" + "="*60)
    print("TESTING: Complexity Analyzer")
    print("="*60)
    
    from complexity_analyzer import ComplexityAnalyzer
    
    analyzer = ComplexityAnalyzer()
    result = analyzer.analyze(SAMPLE_PYTHON_CODE)
    
    print(f"\n✓ Success: {result.get('success')}")
    print(f"✓ Loops found: {len(result.get('loops', []))}")
    print(f"✓ Nested loops: {len(result.get('nested_loops', []))}")
    print(f"✓ Recursion detected: {len(result.get('recursion', []))}")
    print(f"✓ Large functions: {len(result.get('large_functions', []))}")
    print(f"✓ Time complexity: {result.get('time_complexity', {}).get('notation')}")
    print(f"✓ Space complexity: {result.get('space_complexity', {}).get('notation')}")
    print(f"✓ Optimization suggestions: {len(result.get('optimization_suggestions', []))}")
    
    if result.get('optimization_suggestions'):
        print("\nSuggestions:")
        for sug in result['optimization_suggestions'][:3]:
            print(f"  - [{sug['type']}] {sug['title']}")
    
    return result.get('success', False)


def test_advanced_analyzer():
    """Test the advanced analyzer features"""
    print("\n" + "="*60)
    print("TESTING: Advanced Analyzer")
    print("="*60)
    
    from advanced_analysis import AdvancedAnalyzer
    
    analyzer = AdvancedAnalyzer()
    files = create_mock_files()
    
    # Test Dependencies
    print("\n--- Dependencies Analysis ---")
    deps = analyzer.analyze_dependencies(files)
    print(f"✓ Total dependencies: {deps.get('total_count', 0)}")
    print(f"✓ Vulnerabilities found: {len(deps.get('vulnerabilities', []))}")
    print(f"✓ Unused dependencies: {len(deps.get('unused_dependencies', []))}")
    
    if deps.get('vulnerabilities'):
        print("\nVulnerabilities:")
        for vuln in deps['vulnerabilities'][:3]:
            print(f"  - {vuln['package']}: {vuln['vulnerability']}")
    
    # Test Code Duplication
    print("\n--- Code Duplication Detection ---")
    dups = analyzer.detect_duplicates(files)
    print(f"✓ Duplicate blocks found: {dups.get('total_duplicate_blocks', 0)}")
    print(f"✓ Total duplicate lines: {dups.get('total_duplicate_lines', 0)}")
    
    # Test Dead Code
    print("\n--- Dead Code Detection ---")
    dead = analyzer.detect_dead_code(files)
    print(f"✓ Dead code items: {dead.get('total_count', 0)}")
    
    if dead.get('dead_code'):
        print("\nDead code found:")
        for item in dead['dead_code'][:3]:
            print(f"  - {item['type']}: {item['name']} in {item['file']}")
    
    # Test API Endpoints
    print("\n--- API Endpoint Extraction ---")
    endpoints = analyzer.extract_api_endpoints(files)
    print(f"✓ Total endpoints: {endpoints.get('total_count', 0)}")
    print(f"✓ By method: {endpoints.get('by_method', {})}")
    
    if endpoints.get('endpoints'):
        print("\nEndpoints found:")
        for ep in endpoints['endpoints'][:5]:
            print(f"  - {ep['method']} {ep['path']} ({ep['file']})")
    
    # Test Design Patterns
    print("\n--- Design Pattern Detection ---")
    patterns = analyzer.detect_design_patterns(files)
    print(f"✓ Patterns detected: {patterns.get('total_count', 0)}")
    
    if patterns.get('patterns'):
        print("\nPatterns found:")
        for p in patterns['patterns'][:3]:
            print(f"  - {p['name']} (confidence: {p['confidence']}) in {p['file']}")
    
    # Test Coverage
    print("\n--- Test Coverage Estimation ---")
    coverage = analyzer.estimate_test_coverage(files)
    print(f"✓ Source files: {coverage.get('source_files', 0)}")
    print(f"✓ Test files: {coverage.get('test_files', 0)}")
    print(f"✓ Coverage estimate: {coverage.get('coverage_percentage', 0)}%")
    
    return True


def test_github_service():
    """Test GitHub service URL parsing"""
    print("\n" + "="*60)
    print("TESTING: GitHub Service")
    print("="*60)
    
    from github_service import GitHubService
    
    service = GitHubService()
    
    # Test URL parsing
    test_urls = [
        "https://github.com/fastapi/fastapi",
        "https://github.com/pallets/flask.git",
        "git@github.com:django/django.git",
    ]
    
    print("\nURL Parsing:")
    for url in test_urls:
        try:
            owner, repo = service.parse_repo_url(url)
            print(f"✓ {url} -> {owner}/{repo}")
        except Exception as e:
            print(f"✗ {url} -> Error: {e}")
    
    return True


def run_all_tests():
    """Run all tests"""
    print("\n" + "#"*60)
    print("# GitHub Repository Analyzer - Test Suite")
    print("#"*60)
    
    results = {}
    
    # Test Complexity Analyzer
    try:
        results['complexity_analyzer'] = test_complexity_analyzer()
    except Exception as e:
        print(f"✗ Complexity Analyzer failed: {e}")
        results['complexity_analyzer'] = False
    
    # Test Advanced Analyzer
    try:
        results['advanced_analyzer'] = test_advanced_analyzer()
    except Exception as e:
        print(f"✗ Advanced Analyzer failed: {e}")
        results['advanced_analyzer'] = False
    
    # Test GitHub Service
    try:
        results['github_service'] = test_github_service()
    except Exception as e:
        print(f"✗ GitHub Service failed: {e}")
        results['github_service'] = False
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for r in results.values() if r)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✓ PASSED" if passed_test else "✗ FAILED"
        print(f"  {test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
