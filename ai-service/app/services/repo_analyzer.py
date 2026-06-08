"""
Repository Analyzer Service

Analyzes repository code structure, detects bugs, and provides improvement suggestions.
Uses AST parsing for Python and regex patterns for other languages.
"""

import ast
import re
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

# Import Radon if available
try:
    from radon.complexity import cc_visit, cc_rank
    from radon.metrics import mi_visit
    RADON_AVAILABLE = True
except ImportError:
    RADON_AVAILABLE = False

from app.services.github_service import GitHubFile, GitHubService


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class BugType(str, Enum):
    SYNTAX = "syntax"
    LOGIC = "logic"
    SECURITY = "security"
    PERFORMANCE = "performance"
    STYLE = "style"
    BEST_PRACTICE = "best_practice"


@dataclass
class Bug:
    """Detected bug or issue"""
    file: str
    line: int
    severity: Severity
    bug_type: BugType
    message: str
    suggestion: Optional[str] = None
    code_snippet: Optional[str] = None


@dataclass
class Improvement:
    """Improvement suggestion"""
    file: str
    line: Optional[int]
    category: str
    priority: str
    title: str
    description: str
    code_before: Optional[str] = None
    code_after: Optional[str] = None


@dataclass
class FunctionAnalysis:
    """Analysis of a function"""
    name: str
    file: str
    line_start: int
    line_end: int
    parameters: List[str]
    complexity: int = 0
    is_async: bool = False
    has_docstring: bool = False
    return_type: Optional[str] = None


@dataclass
class FileAnalysisResult:
    """Analysis result for a single file"""
    path: str
    language: str
    lines_of_code: int
    functions: List[FunctionAnalysis] = field(default_factory=list)
    classes: List[Dict[str, Any]] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    bugs: List[Bug] = field(default_factory=list)
    complexity_score: float = 0.0


class RepoAnalyzer:
    """
    Analyzes repository code for structure, bugs, and improvements.
    
    Features:
    - AST-based analysis for Python
    - Pattern-based analysis for JavaScript/TypeScript
    - Bug detection across multiple categories
    - Improvement suggestions
    """
    
    # Common security issues patterns
    SECURITY_PATTERNS = {
        "python": [
            (r"eval\s*\(", "Use of eval() is dangerous", Severity.CRITICAL),
            (r"exec\s*\(", "Use of exec() is dangerous", Severity.CRITICAL),
            (r"pickle\.loads?\s*\(", "Unsafe pickle deserialization", Severity.HIGH),
            (r"subprocess\..*shell\s*=\s*True", "Shell injection vulnerability", Severity.HIGH),
            (r"os\.system\s*\(", "Use subprocess instead of os.system", Severity.MEDIUM),
            (r"password\s*=\s*['\"]", "Hardcoded password detected", Severity.CRITICAL),
            (r"api[_-]?key\s*=\s*['\"]", "Hardcoded API key detected", Severity.CRITICAL),
            (r"secret\s*=\s*['\"]", "Hardcoded secret detected", Severity.CRITICAL),
            (r"__import__\s*\(", "Dynamic import can be dangerous", Severity.MEDIUM),
        ],
        "javascript": [
            (r"eval\s*\(", "Use of eval() is dangerous", Severity.CRITICAL),
            (r"innerHTML\s*=", "innerHTML can cause XSS vulnerabilities", Severity.HIGH),
            (r"document\.write\s*\(", "document.write is dangerous", Severity.HIGH),
            (r"password\s*[=:]\s*['\"]", "Hardcoded password detected", Severity.CRITICAL),
            (r"api[_-]?key\s*[=:]\s*['\"]", "Hardcoded API key detected", Severity.CRITICAL),
            (r"new\s+Function\s*\(", "Dynamic function creation is dangerous", Severity.HIGH),
            (r"crypto\.createCipher\s*\(", "Use createCipheriv instead", Severity.MEDIUM),
        ],
    }
    
    # Performance issues patterns
    PERFORMANCE_PATTERNS = {
        "python": [
            (r"for\s+\w+\s+in\s+range\s*\(\s*len\s*\(", "Use enumerate() instead of range(len())", Severity.LOW),
            (r"\+\s*=.*\+\s*=.*\+\s*=", "Multiple string concatenations - use join()", Severity.LOW),
            (r"time\.sleep\s*\(\s*\d+\s*\)", "Blocking sleep in code", Severity.MEDIUM),
            (r"while\s+True\s*:", "Infinite loop without break condition nearby", Severity.MEDIUM),
        ],
        "javascript": [
            (r"document\.getElementById.*for", "Cache DOM queries outside loops", Severity.LOW),
            (r"\.forEach\(.*\.forEach\(", "Nested forEach - consider optimization", Severity.LOW),
            (r"JSON\.parse\(JSON\.stringify", "Deep clone can be slow", Severity.LOW),
        ],
    }
    
    # Style issues patterns
    STYLE_PATTERNS = {
        "python": [
            (r"^\s{1,3}[^\s#]", "Inconsistent indentation", Severity.LOW),
            (r"except\s*:", "Bare except clause", Severity.MEDIUM),
            (r"from\s+\w+\s+import\s+\*", "Wildcard import", Severity.LOW),
            (r"global\s+\w+", "Use of global variable", Severity.MEDIUM),
            (r"lambda\s*:", "Consider using named function for complex lambdas", Severity.INFO),
        ],
        "javascript": [
            (r"var\s+\w+", "Use let/const instead of var", Severity.LOW),
            (r"==(?!=)", "Use === instead of ==", Severity.LOW),
            (r"!=(?!=)", "Use !== instead of !=", Severity.LOW),
            (r"console\.log\s*\(", "Console.log in production code", Severity.INFO),
        ],
    }
    
    def __init__(self):
        self.github_service = GitHubService()
    
    async def analyze_repository(
        self,
        repo_url: str,
        branch: Optional[str] = None,
        include_patterns: Optional[List[str]] = None,
        exclude_patterns: Optional[List[str]] = None,
        max_files: int = 100
    ) -> Dict[str, Any]:
        """
        Analyze a GitHub repository.
        
        Args:
            repo_url: GitHub repository URL
            branch: Branch to analyze
            include_patterns: File patterns to include
            exclude_patterns: File patterns to exclude
            max_files: Maximum files to analyze
            
        Returns:
            Complete analysis report
        """
        start_time = time.time()
        
        # Fetch repository data
        repo_data = await self.github_service.analyze_repo(
            repo_url=repo_url,
            branch=branch,
            include_patterns=include_patterns,
            exclude_patterns=exclude_patterns,
            max_files=max_files
        )
        
        repo_info = repo_data["repo_info"]
        files = repo_data["files"]
        structure = repo_data["structure"]
        
        # Analyze each file
        file_analyses = []
        all_bugs = []
        all_improvements = []
        
        for github_file in files:
            analysis = self._analyze_file(github_file)
            file_analyses.append(analysis)
            all_bugs.extend(analysis.bugs)
        
        # Generate improvements
        all_improvements = self._generate_improvements(file_analyses, all_bugs)
        
        # Find entry points
        entry_points = self._find_entry_points(files)
        
        # Calculate summary
        total_lines = sum(a.lines_of_code for a in file_analyses)
        total_functions = sum(len(a.functions) for a in file_analyses)
        total_classes = sum(len(a.classes) for a in file_analyses)
        avg_complexity = 0.0
        if file_analyses:
            complexities = [a.complexity_score for a in file_analyses if a.complexity_score > 0]
            if complexities:
                avg_complexity = sum(complexities) / len(complexities)
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            "success": True,
            "repo_info": repo_info,
            "structure": {
                "total_files": structure["total_files"],
                "total_lines": total_lines,
                "languages": structure["languages"],
                "directories": structure["directories"],
                "entry_points": entry_points,
            },
            "files_analyzed": len(file_analyses),
            "file_analyses": [self._file_analysis_to_dict(a) for a in file_analyses],
            "bugs": [self._bug_to_dict(b) for b in all_bugs],
            "improvements": [self._improvement_to_dict(i) for i in all_improvements],
            "summary": {
                "total_functions": total_functions,
                "total_classes": total_classes,
                "average_complexity": round(avg_complexity, 2),
                "bug_count": len(all_bugs),
                "bugs_by_severity": self._count_by_severity(all_bugs),
                "improvement_count": len(all_improvements),
                "code_health_score": self._calculate_health_score(all_bugs, total_lines),
            },
            "processing_time_ms": round(processing_time, 2)
        }
    
    def _analyze_file(self, github_file: GitHubFile) -> FileAnalysisResult:
        """Analyze a single file"""
        content = github_file.content
        path = github_file.path
        
        # Determine language
        ext = path.split(".")[-1] if "." in path else ""
        language = self._get_language(ext)
        
        # Count lines
        lines = content.split("\n")
        lines_of_code = len([l for l in lines if l.strip() and not l.strip().startswith("#")])
        
        result = FileAnalysisResult(
            path=path,
            language=language,
            lines_of_code=lines_of_code,
        )
        
        # Language-specific analysis
        if language == "python":
            self._analyze_python(content, path, result)
        elif language in ["javascript", "typescript"]:
            self._analyze_javascript(content, path, result)
        
        # Run pattern-based bug detection
        self._detect_pattern_bugs(content, path, language, result)
        
        return result
    
    def _analyze_python(self, content: str, path: str, result: FileAnalysisResult):
        """Analyze Python code using AST"""
        try:
            tree = ast.parse(content)
        except SyntaxError as e:
            result.bugs.append(Bug(
                file=path,
                line=e.lineno or 1,
                severity=Severity.CRITICAL,
                bug_type=BugType.SYNTAX,
                message=f"Syntax error: {e.msg}",
            ))
            return
        
        lines = content.split("\n")
        
        # Extract imports
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    result.imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    result.imports.append(node.module)
        
        # Analyze functions and classes
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func = self._analyze_python_function(node, path, lines)
                result.functions.append(func)
                
                # Check for missing docstring
                if not func.has_docstring and not func.name.startswith("_"):
                    result.bugs.append(Bug(
                        file=path,
                        line=func.line_start,
                        severity=Severity.INFO,
                        bug_type=BugType.STYLE,
                        message=f"Function '{func.name}' is missing a docstring",
                        suggestion="Add a docstring describing the function's purpose",
                    ))
                
                # Check for high complexity
                if func.complexity > 10:
                    result.bugs.append(Bug(
                        file=path,
                        line=func.line_start,
                        severity=Severity.MEDIUM,
                        bug_type=BugType.BEST_PRACTICE,
                        message=f"Function '{func.name}' has high complexity ({func.complexity})",
                        suggestion="Consider breaking into smaller functions",
                    ))
            
            elif isinstance(node, ast.ClassDef):
                class_info = self._analyze_python_class(node)
                result.classes.append(class_info)
        
        # Calculate overall complexity with Radon
        if RADON_AVAILABLE:
            try:
                mi = mi_visit(content, multi=True)
                if isinstance(mi, float):
                    result.complexity_score = round(mi, 2)
            except:
                pass
    
    def _analyze_python_function(self, node, path: str, lines: List[str]) -> FunctionAnalysis:
        """Analyze a Python function"""
        line_end = node.end_lineno if hasattr(node, 'end_lineno') and node.end_lineno else node.lineno
        
        # Get parameters
        params = [arg.arg for arg in node.args.args]
        
        # Check for docstring
        has_docstring = ast.get_docstring(node) is not None
        
        # Get return type annotation
        return_type = None
        if node.returns and hasattr(ast, 'unparse'):
            return_type = ast.unparse(node.returns)
        
        # Calculate complexity using Radon
        complexity = 1
        if RADON_AVAILABLE:
            try:
                func_code = "\n".join(lines[node.lineno - 1:line_end])
                # Dedent
                min_indent = float('inf')
                for line in func_code.split('\n'):
                    stripped = line.lstrip()
                    if stripped:
                        indent = len(line) - len(stripped)
                        min_indent = min(min_indent, indent)
                if min_indent != float('inf'):
                    func_code = '\n'.join(line[min_indent:] if len(line) > min_indent else line 
                                         for line in func_code.split('\n'))
                
                cc_results = cc_visit(func_code)
                if cc_results:
                    complexity = cc_results[0].complexity
            except:
                pass
        
        return FunctionAnalysis(
            name=node.name,
            file=path,
            line_start=node.lineno,
            line_end=line_end,
            parameters=params,
            complexity=complexity,
            is_async=isinstance(node, ast.AsyncFunctionDef),
            has_docstring=has_docstring,
            return_type=return_type,
        )
    
    def _analyze_python_class(self, node: ast.ClassDef) -> Dict[str, Any]:
        """Analyze a Python class"""
        methods = []
        for item in node.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                methods.append({
                    "name": item.name,
                    "line": item.lineno,
                    "is_async": isinstance(item, ast.AsyncFunctionDef),
                })
        
        return {
            "name": node.name,
            "line": node.lineno,
            "bases": [ast.unparse(b) if hasattr(ast, 'unparse') else str(b) for b in node.bases],
            "methods": methods,
            "has_docstring": ast.get_docstring(node) is not None,
        }
    
    def _analyze_javascript(self, content: str, path: str, result: FileAnalysisResult):
        """Analyze JavaScript/TypeScript code using regex patterns"""
        lines = content.split("\n")
        
        # Extract imports
        import_pattern = r"(?:import\s+.*\s+from\s+['\"](.+)['\"]|require\s*\(\s*['\"](.+)['\"]\s*\))"
        for match in re.finditer(import_pattern, content):
            module = match.group(1) or match.group(2)
            result.imports.append(module)
        
        # Extract functions
        func_pattern = r"(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)"
        for match in re.finditer(func_pattern, content):
            line_num = content[:match.start()].count("\n") + 1
            result.functions.append(FunctionAnalysis(
                name=match.group(1),
                file=path,
                line_start=line_num,
                line_end=line_num,
                parameters=match.group(2).split(",") if match.group(2) else [],
                is_async="async" in content[max(0, match.start()-10):match.start()],
            ))
        
        # Arrow functions
        arrow_pattern = r"(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>"
        for match in re.finditer(arrow_pattern, content):
            line_num = content[:match.start()].count("\n") + 1
            result.functions.append(FunctionAnalysis(
                name=match.group(1),
                file=path,
                line_start=line_num,
                line_end=line_num,
                parameters=[],
                is_async="async" in content[max(0, match.start()-10):match.end()],
            ))
        
        # Extract classes
        class_pattern = r"class\s+(\w+)(?:\s+extends\s+(\w+))?"
        for match in re.finditer(class_pattern, content):
            line_num = content[:match.start()].count("\n") + 1
            result.classes.append({
                "name": match.group(1),
                "line": line_num,
                "extends": match.group(2),
            })
    
    def _detect_pattern_bugs(self, content: str, path: str, language: str, result: FileAnalysisResult):
        """Detect bugs using regex patterns"""
        # Security patterns
        security_patterns = self.SECURITY_PATTERNS.get(language, [])
        for pattern, message, severity in security_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count("\n") + 1
                result.bugs.append(Bug(
                    file=path,
                    line=line_num,
                    severity=severity,
                    bug_type=BugType.SECURITY,
                    message=message,
                    code_snippet=match.group(0)[:50],
                ))
        
        # Performance patterns
        perf_patterns = self.PERFORMANCE_PATTERNS.get(language, [])
        for pattern, message, severity in perf_patterns:
            for match in re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE):
                line_num = content[:match.start()].count("\n") + 1
                result.bugs.append(Bug(
                    file=path,
                    line=line_num,
                    severity=severity,
                    bug_type=BugType.PERFORMANCE,
                    message=message,
                ))
        
        # Style patterns
        style_patterns = self.STYLE_PATTERNS.get(language, [])
        for pattern, message, severity in style_patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[:match.start()].count("\n") + 1
                result.bugs.append(Bug(
                    file=path,
                    line=line_num,
                    severity=severity,
                    bug_type=BugType.STYLE,
                    message=message,
                ))
    
    def _generate_improvements(
        self, 
        file_analyses: List[FileAnalysisResult], 
        bugs: List[Bug]
    ) -> List[Improvement]:
        """Generate improvement suggestions based on analysis"""
        improvements = []
        
        # Group bugs by file
        bugs_by_file = {}
        for bug in bugs:
            bugs_by_file.setdefault(bug.file, []).append(bug)
        
        # Analyze each file
        for analysis in file_analyses:
            path = analysis.path
            file_bugs = bugs_by_file.get(path, [])
            
            # Check for missing documentation
            undocumented = [f for f in analysis.functions if not f.has_docstring]
            if len(undocumented) > 3:
                improvements.append(Improvement(
                    file=path,
                    line=None,
                    category="documentation",
                    priority="medium",
                    title="Add Documentation",
                    description=f"{len(undocumented)} functions are missing docstrings",
                ))
            
            # Check for high complexity
            complex_funcs = [f for f in analysis.functions if f.complexity > 8]
            if complex_funcs:
                improvements.append(Improvement(
                    file=path,
                    line=complex_funcs[0].line_start,
                    category="maintainability",
                    priority="high",
                    title="Reduce Function Complexity",
                    description=f"{len(complex_funcs)} function(s) have high cyclomatic complexity",
                ))
            
            # Check for security issues
            security_bugs = [b for b in file_bugs if b.bug_type == BugType.SECURITY]
            if security_bugs:
                improvements.append(Improvement(
                    file=path,
                    line=security_bugs[0].line,
                    category="security",
                    priority="critical",
                    title="Fix Security Vulnerabilities",
                    description=f"{len(security_bugs)} security issue(s) detected",
                ))
            
            # Check for too many functions in one file
            if len(analysis.functions) > 20:
                improvements.append(Improvement(
                    file=path,
                    line=None,
                    category="architecture",
                    priority="medium",
                    title="Consider Splitting File",
                    description=f"File has {len(analysis.functions)} functions, consider splitting into modules",
                ))
            
            # Check for large file
            if analysis.lines_of_code > 500:
                improvements.append(Improvement(
                    file=path,
                    line=None,
                    category="maintainability",
                    priority="low",
                    title="Large File",
                    description=f"File has {analysis.lines_of_code} lines, consider refactoring",
                ))
        
        return improvements
    
    def _find_entry_points(self, files: List[GitHubFile]) -> List[str]:
        """Find likely entry points in the repository"""
        entry_point_names = [
            "main.py", "app.py", "index.py", "run.py", "__main__.py",
            "index.js", "index.ts", "main.js", "main.ts", "app.js", "app.ts",
            "server.js", "server.ts", "index.jsx", "index.tsx",
        ]
        
        entry_points = []
        for f in files:
            filename = f.name.lower()
            if filename in entry_point_names:
                entry_points.append(f.path)
            elif "if __name__" in f.content:
                entry_points.append(f.path)
        
        return entry_points
    
    def _get_language(self, ext: str) -> str:
        """Get language from file extension"""
        mapping = {
            "py": "python",
            "js": "javascript",
            "jsx": "javascript",
            "ts": "typescript",
            "tsx": "typescript",
            "java": "java",
            "cpp": "cpp",
            "c": "c",
            "cs": "csharp",
            "go": "go",
            "rs": "rust",
            "rb": "ruby",
            "php": "php",
        }
        return mapping.get(ext.lower(), "unknown")
    
    def _count_by_severity(self, bugs: List[Bug]) -> Dict[str, int]:
        """Count bugs by severity"""
        counts = {s.value: 0 for s in Severity}
        for bug in bugs:
            counts[bug.severity.value] = counts.get(bug.severity.value, 0) + 1
        return counts
    
    def _calculate_health_score(self, bugs: List[Bug], total_lines: int) -> float:
        """Calculate code health score (0-100)"""
        if total_lines == 0:
            return 100.0
        
        # Weighted deductions
        deductions = 0
        for bug in bugs:
            if bug.severity == Severity.CRITICAL:
                deductions += 10
            elif bug.severity == Severity.HIGH:
                deductions += 5
            elif bug.severity == Severity.MEDIUM:
                deductions += 2
            elif bug.severity == Severity.LOW:
                deductions += 1
        
        # Normalize by lines of code
        normalized_deduction = min(deductions * (1000 / total_lines), 100)
        
        return max(0, round(100 - normalized_deduction, 1))
    
    def _bug_to_dict(self, bug: Bug) -> Dict[str, Any]:
        """Convert Bug to dictionary"""
        return {
            "file": bug.file,
            "line": bug.line,
            "severity": bug.severity.value,
            "type": bug.bug_type.value,
            "message": bug.message,
            "suggestion": bug.suggestion,
            "code_snippet": bug.code_snippet,
        }
    
    def _improvement_to_dict(self, imp: Improvement) -> Dict[str, Any]:
        """Convert Improvement to dictionary"""
        return {
            "file": imp.file,
            "line": imp.line,
            "category": imp.category,
            "priority": imp.priority,
            "title": imp.title,
            "description": imp.description,
            "code_before": imp.code_before,
            "code_after": imp.code_after,
        }
    
    def _file_analysis_to_dict(self, analysis: FileAnalysisResult) -> Dict[str, Any]:
        """Convert FileAnalysisResult to dictionary"""
        return {
            "path": analysis.path,
            "language": analysis.language,
            "lines_of_code": analysis.lines_of_code,
            "functions": [
                {
                    "name": f.name,
                    "line_start": f.line_start,
                    "line_end": f.line_end,
                    "parameters": f.parameters,
                    "complexity": f.complexity,
                    "is_async": f.is_async,
                    "has_docstring": f.has_docstring,
                    "return_type": f.return_type,
                }
                for f in analysis.functions
            ],
            "classes": analysis.classes,
            "imports": analysis.imports,
            "bugs": [self._bug_to_dict(b) for b in analysis.bugs],
            "complexity_score": analysis.complexity_score,
        }


# Convenience function
async def analyze_github_repo(
    repo_url: str,
    branch: Optional[str] = None,
    include_patterns: Optional[List[str]] = None,
    exclude_patterns: Optional[List[str]] = None,
    max_files: int = 100
) -> Dict[str, Any]:
    """
    Analyze a GitHub repository.
    
    Args:
        repo_url: GitHub repository URL
        branch: Branch to analyze
        include_patterns: File patterns to include
        exclude_patterns: File patterns to exclude
        max_files: Maximum files to analyze
        
    Returns:
        Complete analysis report
    """
    analyzer = RepoAnalyzer()
    return await analyzer.analyze_repository(
        repo_url=repo_url,
        branch=branch,
        include_patterns=include_patterns,
        exclude_patterns=exclude_patterns,
        max_files=max_files
    )
