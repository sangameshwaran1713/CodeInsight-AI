"""
GitHub API Service

Fetches repository files and metadata from GitHub.
Supports both authenticated and unauthenticated requests.
"""

import httpx
import asyncio
import base64
import fnmatch
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from urllib.parse import urlparse
import os


@dataclass
class GitHubFile:
    """Represents a file fetched from GitHub"""
    path: str
    name: str
    content: str
    size: int
    sha: str
    encoding: str = "utf-8"


class GitHubAPIError(Exception):
    """Custom exception for GitHub API errors"""
    def __init__(self, message: str, status_code: int = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class GitHubService:
    """
    Service for interacting with GitHub API.
    
    Features:
    - Parse GitHub repository URLs
    - Fetch repository metadata
    - Fetch file tree structure
    - Download file contents
    - Handle rate limiting
    """
    
    BASE_URL = "https://api.github.com"
    
    def __init__(self, token: Optional[str] = None):
        """
        Initialize GitHub service.
        
        Args:
            token: GitHub personal access token (optional but recommended)
        """
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "CodeInsight-Analyzer/1.0"
        }
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"
    
    def parse_repo_url(self, url: str) -> Tuple[str, str]:
        """
        Parse GitHub URL to extract owner and repo name.
        
        Args:
            url: GitHub repository URL
            
        Returns:
            Tuple of (owner, repo_name)
        """
        # Handle different URL formats
        patterns = [
            # https://github.com/owner/repo
            r"github\.com/([^/]+)/([^/\.]+)",
            # git@github.com:owner/repo.git
            r"github\.com:([^/]+)/([^/\.]+)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                owner, repo = match.groups()
                repo = repo.rstrip(".git")
                return owner, repo
        
        raise GitHubAPIError(f"Could not parse GitHub URL: {url}")
    
    async def get_repo_info(self, owner: str, repo: str) -> Dict[str, Any]:
        """
        Get repository metadata.
        
        Args:
            owner: Repository owner
            repo: Repository name
            
        Returns:
            Repository information dictionary
        """
        url = f"{self.BASE_URL}/repos/{owner}/{repo}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            
            if response.status_code == 404:
                raise GitHubAPIError(f"Repository not found: {owner}/{repo}", 404)
            elif response.status_code == 403:
                raise GitHubAPIError("API rate limit exceeded or access denied", 403)
            elif response.status_code != 200:
                raise GitHubAPIError(f"GitHub API error: {response.text}", response.status_code)
            
            data = response.json()
            
            return {
                "name": data.get("name"),
                "full_name": data.get("full_name"),
                "description": data.get("description"),
                "language": data.get("language"),
                "default_branch": data.get("default_branch"),
                "stars": data.get("stargazers_count"),
                "forks": data.get("forks_count"),
                "open_issues": data.get("open_issues_count"),
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at"),
                "size": data.get("size"),
                "private": data.get("private"),
                "topics": data.get("topics", []),
                "license": data.get("license", {}).get("name") if data.get("license") else None,
            }
    
    async def get_tree(
        self, 
        owner: str, 
        repo: str, 
        branch: str = "main",
        recursive: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get repository file tree.
        
        Args:
            owner: Repository owner
            repo: Repository name
            branch: Branch name
            recursive: Whether to fetch recursively
            
        Returns:
            List of file/directory entries
        """
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/git/trees/{branch}"
        if recursive:
            url += "?recursive=1"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers, timeout=30.0)
            
            if response.status_code == 404:
                # Try 'master' if 'main' fails
                if branch == "main":
                    return await self.get_tree(owner, repo, "master", recursive)
                raise GitHubAPIError(f"Branch not found: {branch}", 404)
            elif response.status_code != 200:
                raise GitHubAPIError(f"Failed to get tree: {response.text}", response.status_code)
            
            data = response.json()
            return data.get("tree", [])
    
    async def get_file_content(
        self, 
        owner: str, 
        repo: str, 
        path: str,
        branch: str = "main"
    ) -> GitHubFile:
        """
        Get content of a specific file.
        
        Args:
            owner: Repository owner
            repo: Repository name
            path: File path
            branch: Branch name
            
        Returns:
            GitHubFile with decoded content
        """
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/contents/{path}?ref={branch}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers, timeout=30.0)
            
            if response.status_code != 200:
                raise GitHubAPIError(f"Failed to get file: {path}", response.status_code)
            
            data = response.json()
            
            # Decode base64 content
            content = ""
            if data.get("encoding") == "base64" and data.get("content"):
                try:
                    content = base64.b64decode(data["content"]).decode("utf-8")
                except (UnicodeDecodeError, ValueError):
                    # Binary file or encoding issue
                    content = "[Binary content]"
            
            return GitHubFile(
                path=data.get("path", path),
                name=data.get("name", path.split("/")[-1]),
                content=content,
                size=data.get("size", 0),
                sha=data.get("sha", ""),
            )
    
    async def get_files(
        self,
        owner: str,
        repo: str,
        branch: str = "main",
        include_patterns: List[str] = None,
        exclude_patterns: List[str] = None,
        max_files: int = 100,
        max_file_size: int = 500000  # 500KB
    ) -> List[GitHubFile]:
        """
        Get all matching files from repository.
        
        Args:
            owner: Repository owner
            repo: Repository name
            branch: Branch name
            include_patterns: Glob patterns to include (e.g., ["*.py", "*.js"])
            exclude_patterns: Glob patterns to exclude
            max_files: Maximum number of files to fetch
            max_file_size: Maximum file size in bytes
            
        Returns:
            List of GitHubFile objects
        """
        include_patterns = include_patterns or ["*.py", "*.js", "*.ts", "*.jsx", "*.tsx"]
        exclude_patterns = exclude_patterns or [
            "node_modules/*", "__pycache__/*", "*.min.js", 
            "dist/*", "build/*", ".git/*", "vendor/*"
        ]
        
        # Get file tree
        tree = await self.get_tree(owner, repo, branch)
        
        # Filter files
        files_to_fetch = []
        for item in tree:
            if item.get("type") != "blob":
                continue
            
            path = item.get("path", "")
            size = item.get("size", 0)
            
            # Skip large files
            if size > max_file_size:
                continue
            
            # Check exclude patterns
            excluded = any(fnmatch.fnmatch(path, pattern) for pattern in exclude_patterns)
            if excluded:
                continue
            
            # Check include patterns
            included = any(fnmatch.fnmatch(path, f"**/{pattern}") or fnmatch.fnmatch(path, pattern) 
                          for pattern in include_patterns)
            if not included:
                # Check just filename
                filename = path.split("/")[-1]
                included = any(fnmatch.fnmatch(filename, pattern) for pattern in include_patterns)
            
            if included:
                files_to_fetch.append({
                    "path": path,
                    "size": size,
                    "sha": item.get("sha")
                })
        
        # Limit number of files
        files_to_fetch = files_to_fetch[:max_files]
        
        # Fetch file contents in parallel (with concurrency limit)
        semaphore = asyncio.Semaphore(10)  # Max 10 concurrent requests
        
        async def fetch_with_semaphore(file_info):
            async with semaphore:
                try:
                    return await self.get_file_content(owner, repo, file_info["path"], branch)
                except Exception as e:
                    # Return None for failed fetches
                    return None
        
        tasks = [fetch_with_semaphore(f) for f in files_to_fetch]
        results = await asyncio.gather(*tasks)
        
        # Filter out failed fetches
        return [f for f in results if f is not None]
    
    async def analyze_repo(
        self,
        repo_url: str,
        branch: Optional[str] = None,
        include_patterns: List[str] = None,
        exclude_patterns: List[str] = None,
        max_files: int = 100
    ) -> Dict[str, Any]:
        """
        Complete repository analysis workflow.
        
        Args:
            repo_url: GitHub repository URL
            branch: Branch to analyze (defaults to repo's default branch)
            include_patterns: File patterns to include
            exclude_patterns: File patterns to exclude
            max_files: Maximum files to analyze
            
        Returns:
            Dictionary with repo info, files, and analysis data
        """
        owner, repo = self.parse_repo_url(repo_url)
        
        # Get repo info
        repo_info = await self.get_repo_info(owner, repo)
        
        # Use default branch if not specified
        if not branch:
            branch = repo_info.get("default_branch", "main")
        
        # Get files
        files = await self.get_files(
            owner, repo, branch,
            include_patterns=include_patterns,
            exclude_patterns=exclude_patterns,
            max_files=max_files
        )
        
        # Analyze structure
        directories = set()
        languages = {}
        
        for f in files:
            # Extract directory
            if "/" in f.path:
                dir_path = "/".join(f.path.split("/")[:-1])
                directories.add(dir_path)
            
            # Count languages by extension
            ext = f.name.split(".")[-1] if "." in f.name else "other"
            lang = self._extension_to_language(ext)
            languages[lang] = languages.get(lang, 0) + 1
        
        return {
            "repo_info": repo_info,
            "branch": branch,
            "files": files,
            "structure": {
                "total_files": len(files),
                "directories": sorted(list(directories)),
                "languages": languages,
            }
        }
    
    def _extension_to_language(self, ext: str) -> str:
        """Map file extension to language name"""
        mapping = {
            "py": "Python",
            "js": "JavaScript",
            "ts": "TypeScript",
            "jsx": "JavaScript (React)",
            "tsx": "TypeScript (React)",
            "java": "Java",
            "cpp": "C++",
            "c": "C",
            "cs": "C#",
            "go": "Go",
            "rs": "Rust",
            "rb": "Ruby",
            "php": "PHP",
            "swift": "Swift",
            "kt": "Kotlin",
            "scala": "Scala",
            "html": "HTML",
            "css": "CSS",
            "scss": "SCSS",
            "sql": "SQL",
            "json": "JSON",
            "yaml": "YAML",
            "yml": "YAML",
            "md": "Markdown",
        }
        return mapping.get(ext.lower(), ext.upper())
    
    async def check_rate_limit(self) -> Dict[str, Any]:
        """Check GitHub API rate limit status"""
        url = f"{self.BASE_URL}/rate_limit"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "limit": data.get("rate", {}).get("limit"),
                    "remaining": data.get("rate", {}).get("remaining"),
                    "reset": data.get("rate", {}).get("reset"),
                }
            return {"error": "Could not fetch rate limit"}
