"""
Advanced Code Analysis Features

Additional analysis capabilities including:
- Dependency analysis and vulnerability detection
- Code duplication detection
- Dead code detection
- Design pattern recognition
- API endpoint extraction
- Test coverage estimation
"""

import ast
import re
import hashlib
from typing import List, Dict, Any, Optional, Set, Tuple
from dataclasses import dataclass, field
from collections import defaultdict
from enum import Enum


@dataclass
class Dependency:
    """Represents a project dependency"""
    name: str
    version: Optional[str] = None
    source: str = "import"  # import, requirements.txt, package.json
    is_dev: bool = False
    used_in_files: List[str] = field(default_factory=list)


@dataclass
class CodeDuplicate:
    """Represents a code duplication"""
    hash: str
    occurrences: List[Dict[str, Any]] = field(default_factory=list)
    lines: int = 0
    code_snippet: str = ""


@dataclass
class DeadCode:
    """Represents potentially dead code"""
    file: str
    line: int
    type: str  # function, variable, import, class
    name: str
    reason: str


@dataclass
class APIEndpoint:
    """Represents an API endpoint"""
    file: str
    line: int
    method: str  # GET, POST, PUT, DELETE, etc.
    path: str
    function_name: str
    parameters: List[str] = field(default_factory=list)
    has_auth: bool = False


@dataclass 
class DesignPattern:
    """Detected design pattern"""
    name: str
    file: str
    line: int
    confidence: float  # 0.0 - 1.0
    description: str


class AdvancedAnalyzer:
    """
    Advanced code analysis features.
    """
    
    # Known vulnerable package versions (simplified)
    VULNERABLE_PACKAGES = {
        "requests": [("2.0.0", "2.3.0", "CVE-2014-1829: Session fixation")],
        "django": [("1.0", "1.11.28", "Multiple security vulnerabilities")],
        "flask": [("0.1", "0.12.2", "CVE-2018-1000656: DOS vulnerability")],
        "urllib3": [("1.0", "1.24.2", "CVE-2019-11324: CRLF injection")],
        "pyyaml": [("1.0", "5.3.1", "CVE-2020-1747: Arbitrary code execution")],
        "pillow": [("1.0", "6.2.2", "Multiple buffer overflow vulnerabilities")],
    }
    
    # Common design patterns signatures
    PATTERN_SIGNATURES = {
        "singleton": {
            "python": [
                r"_instance\s*=\s*None",
                r"def\s+get_instance\s*\(",
                r"cls\._instance",
            ],
        },
        "factory": {
            "python": [
                r"def\s+create_\w+\s*\(",
                r"def\s+make_\w+\s*\(",
                r"Factory",
            ],
        },
        "observer": {
            "python": [
                r"def\s+subscribe\s*\(",
                r"def\s+notify\s*\(",
                r"observers?\s*[=:]",
                r"listeners?\s*[=:]",
            ],
        },
        "decorator": {
            "python": [
                r"@\w+",
                r"def\s+\w+\s*\(\s*func\s*\)",
                r"functools\.wraps",
            ],
        },
        "strategy": {
            "python": [
                r"def\s+set_strategy\s*\(",
                r"strategy\s*=",
                r"Strategy",
            ],
        },
    }
    
    def analyze_dependencies(
        self, 
        files: List[Any],  # List[GitHubFile]
        include_dev: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze project dependencies.
        
        Returns:
        - List of dependencies with usage info
        - Potential vulnerabilities
        - Unused dependencies
        """
        dependencies = {}
        import_usage = defaultdict(list)
        
        # Extract imports from code files
        for f in files:
            if f.path.endswith('.py'):
                imports = self._extract_python_imports(f.content)
                for imp in imports:
                    import_usage[imp].append(f.path)
            elif f.path.endswith(('.js', '.ts', '.jsx', '.tsx')):
                imports = self._extract_js_imports(f.content)
                for imp in imports:
                    import_usage[imp].append(f.path)
        
        # Parse requirements files
        requirements = {}
        for f in files:
            if f.name == 'requirements.txt' or f.name.endswith('requirements.txt'):
                requirements.update(self._parse_requirements(f.content))
            elif f.name == 'package.json':
                pkg_deps = self._parse_package_json(f.content)
                requirements.update(pkg_deps)
            elif f.name == 'Pipfile':
                requirements.update(self._parse_pipfile(f.content))
        
        # Build dependency list
        all_deps = set(import_usage.keys()) | set(requirements.keys())
        
        dep_list = []
        for dep_name in all_deps:
            dep = Dependency(
                name=dep_name,
                version=requirements.get(dep_name),
                source="requirements" if dep_name in requirements else "import",
                used_in_files=import_usage.get(dep_name, []),
            )
            dep_list.append(dep)
        
        # Check for vulnerabilities
        vulnerabilities = []
        for dep in dep_list:
            vuln = self._check_vulnerability(dep.name, dep.version)
            if vuln:
                vulnerabilities.append({
                    "package": dep.name,
                    "version": dep.version,
                    "vulnerability": vuln,
                })
        
        # Find unused dependencies (in requirements but not imported)
        unused = []
        for dep_name in requirements:
            if dep_name not in import_usage:
                unused.append(dep_name)
        
        return {
            "dependencies": [self._dep_to_dict(d) for d in dep_list],
            "total_count": len(dep_list),
            "vulnerabilities": vulnerabilities,
            "unused_dependencies": unused,
            "most_used": sorted(
                [(k, len(v)) for k, v in import_usage.items()],
                key=lambda x: x[1],
                reverse=True
            )[:10],
        }
    
    def detect_duplicates(
        self, 
        files: List[Any],
        min_lines: int = 6,
        similarity_threshold: float = 0.9
    ) -> Dict[str, Any]:
        """
        Detect code duplication across files.
        
        Uses normalized code hashing to find similar blocks.
        """
        code_blocks = []
        
        for f in files:
            if not self._is_code_file(f.path):
                continue
            
            lines = f.content.split('\n')
            
            # Sliding window of code blocks
            for i in range(len(lines) - min_lines + 1):
                block = '\n'.join(lines[i:i + min_lines])
                normalized = self._normalize_code(block)
                
                if len(normalized.strip()) < 50:  # Skip trivial blocks
                    continue
                
                block_hash = hashlib.md5(normalized.encode()).hexdigest()
                
                code_blocks.append({
                    "file": f.path,
                    "line_start": i + 1,
                    "line_end": i + min_lines,
                    "hash": block_hash,
                    "code": block[:200],  # First 200 chars for preview
                })
        
        # Group by hash
        hash_groups = defaultdict(list)
        for block in code_blocks:
            hash_groups[block["hash"]].append(block)
        
        # Find duplicates (hash appears more than once)
        duplicates = []
        for hash_val, occurrences in hash_groups.items():
            if len(occurrences) > 1:
                # Check if they're in different locations
                locations = set((o["file"], o["line_start"]) for o in occurrences)
                if len(locations) > 1:
                    duplicates.append({
                        "hash": hash_val,
                        "occurrences": occurrences,
                        "count": len(occurrences),
                        "lines": min_lines,
                    })
        
        # Sort by occurrence count
        duplicates.sort(key=lambda x: x["count"], reverse=True)
        
        total_duplicate_lines = sum(d["count"] * d["lines"] for d in duplicates)
        
        return {
            "duplicates": duplicates[:20],  # Top 20
            "total_duplicate_blocks": len(duplicates),
            "total_duplicate_lines": total_duplicate_lines,
            "duplication_percentage": 0,  # Would need total lines
        }
    
    def detect_dead_code(self, files: List[Any]) -> Dict[str, Any]:
        """
        Detect potentially dead code.
        
        Looks for:
        - Unused imports
        - Unused functions
        - Unused variables
        - Unreachable code
        """
        dead_code = []
        
        for f in files:
            if not f.path.endswith('.py'):
                continue
            
            try:
                tree = ast.parse(f.content)
            except SyntaxError:
                continue
            
            # Collect all definitions and usages
            definitions = self._collect_definitions(tree)
            usages = self._collect_usages(tree, f.content)
            
            # Find unused definitions
            for def_type, defs in definitions.items():
                for name, line in defs:
                    # Skip private/magic methods
                    if name.startswith('_'):
                        continue
                    
                    if name not in usages:
                        dead_code.append(DeadCode(
                            file=f.path,
                            line=line,
                            type=def_type,
                            name=name,
                            reason=f"'{name}' is defined but never used",
                        ))
            
            # Detect unreachable code after return/raise
            unreachable = self._find_unreachable_code(tree)
            for line, reason in unreachable:
                dead_code.append(DeadCode(
                    file=f.path,
                    line=line,
                    type="unreachable",
                    name="",
                    reason=reason,
                ))
        
        return {
            "dead_code": [self._dead_code_to_dict(d) for d in dead_code],
            "total_count": len(dead_code),
            "by_type": self._count_by_field(dead_code, "type"),
        }
    
    def extract_api_endpoints(self, files: List[Any]) -> Dict[str, Any]:
        """
        Extract API endpoints from code.
        
        Supports:
        - FastAPI
        - Flask
        - Django
        - Express.js
        """
        endpoints = []
        
        for f in files:
            if f.path.endswith('.py'):
                endpoints.extend(self._extract_python_endpoints(f.path, f.content))
            elif f.path.endswith(('.js', '.ts')):
                endpoints.extend(self._extract_js_endpoints(f.path, f.content))
        
        # Group by path
        by_path = defaultdict(list)
        for ep in endpoints:
            by_path[ep.path].append(ep)
        
        return {
            "endpoints": [self._endpoint_to_dict(e) for e in endpoints],
            "total_count": len(endpoints),
            "by_method": self._count_endpoints_by_method(endpoints),
            "authenticated_count": sum(1 for e in endpoints if e.has_auth),
        }
    
    def detect_design_patterns(self, files: List[Any]) -> Dict[str, Any]:
        """
        Detect common design patterns in code.
        """
        patterns = []
        
        for f in files:
            if not f.path.endswith('.py'):
                continue
            
            for pattern_name, signatures in self.PATTERN_SIGNATURES.items():
                python_sigs = signatures.get("python", [])
                matches = 0
                match_lines = []
                
                for sig in python_sigs:
                    for match in re.finditer(sig, f.content):
                        matches += 1
                        line_num = f.content[:match.start()].count('\n') + 1
                        match_lines.append(line_num)
                
                if matches >= 2:  # At least 2 signature matches
                    confidence = min(matches / len(python_sigs), 1.0)
                    patterns.append(DesignPattern(
                        name=pattern_name,
                        file=f.path,
                        line=match_lines[0] if match_lines else 1,
                        confidence=round(confidence, 2),
                        description=f"{pattern_name.title()} pattern indicators found",
                    ))
        
        return {
            "patterns": [self._pattern_to_dict(p) for p in patterns],
            "total_count": len(patterns),
            "by_pattern": self._count_by_field(patterns, "name"),
        }
    
    def estimate_test_coverage(self, files: List[Any]) -> Dict[str, Any]:
        """
        Estimate test coverage based on file analysis.
        """
        source_files = []
        test_files = []
        
        for f in files:
            if not self._is_code_file(f.path):
                continue
            
            if self._is_test_file(f.path):
                test_files.append(f)
            else:
                source_files.append(f)
        
        # Extract tested functions from test files
        tested_items = set()
        for f in test_files:
            tested_items.update(self._extract_tested_items(f.content))
        
        # Extract all functions from source files
        all_functions = []
        for f in source_files:
            if f.path.endswith('.py'):
                funcs = self._extract_function_names(f.content)
                all_functions.extend([(f.path, func) for func in funcs])
        
        # Calculate coverage estimate
        covered = sum(1 for _, func in all_functions if func in tested_items)
        total = len(all_functions)
        
        coverage_percent = (covered / total * 100) if total > 0 else 0
        
        # Find untested functions
        untested = [(path, func) for path, func in all_functions if func not in tested_items][:20]
        
        return {
            "source_files": len(source_files),
            "test_files": len(test_files),
            "total_functions": total,
            "estimated_covered": covered,
            "coverage_percentage": round(coverage_percent, 1),
            "untested_functions": [{"file": p, "function": f} for p, f in untested],
            "has_tests": len(test_files) > 0,
        }
    
    # === Helper Methods ===
    
    def _extract_python_imports(self, content: str) -> List[str]:
        """Extract import names from Python code"""
        imports = []
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name.split('.')[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module.split('.')[0])
        except:
            pass
        return list(set(imports))
    
    def _extract_js_imports(self, content: str) -> List[str]:
        """Extract import names from JavaScript/TypeScript code"""
        imports = []
        patterns = [
            r"import\s+.*\s+from\s+['\"]([^'\"]+)['\"]",
            r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)",
        ]
        for pattern in patterns:
            for match in re.finditer(pattern, content):
                module = match.group(1)
                if not module.startswith('.'):  # Skip relative imports
                    imports.append(module.split('/')[0])
        return list(set(imports))
    
    def _parse_requirements(self, content: str) -> Dict[str, Optional[str]]:
        """Parse requirements.txt"""
        deps = {}
        for line in content.split('\n'):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            # Handle various formats
            match = re.match(r'^([a-zA-Z0-9_-]+)([=<>!]+.*)?$', line)
            if match:
                name = match.group(1).lower()
                version = match.group(2) if match.group(2) else None
                deps[name] = version
        return deps
    
    def _parse_package_json(self, content: str) -> Dict[str, Optional[str]]:
        """Parse package.json"""
        import json
        deps = {}
        try:
            pkg = json.loads(content)
            for dep_type in ['dependencies', 'devDependencies']:
                if dep_type in pkg:
                    for name, version in pkg[dep_type].items():
                        deps[name] = version
        except:
            pass
        return deps
    
    def _parse_pipfile(self, content: str) -> Dict[str, Optional[str]]:
        """Parse Pipfile (simplified)"""
        deps = {}
        in_packages = False
        for line in content.split('\n'):
            if '[packages]' in line or '[dev-packages]' in line:
                in_packages = True
                continue
            if line.startswith('[') and in_packages:
                in_packages = False
            if in_packages and '=' in line:
                parts = line.split('=')
                name = parts[0].strip().strip('"')
                deps[name] = None
        return deps
    
    def _check_vulnerability(self, name: str, version: Optional[str]) -> Optional[str]:
        """Check if package has known vulnerabilities"""
        name_lower = name.lower()
        if name_lower in self.VULNERABLE_PACKAGES:
            for min_ver, max_ver, cve in self.VULNERABLE_PACKAGES[name_lower]:
                # Simplified version check
                return cve
        return None
    
    def _is_code_file(self, path: str) -> bool:
        """Check if file is a code file"""
        code_extensions = {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.go', '.rs'}
        return any(path.endswith(ext) for ext in code_extensions)
    
    def _is_test_file(self, path: str) -> bool:
        """Check if file is a test file"""
        test_indicators = ['test_', '_test.', 'tests/', 'test/', '.test.', '.spec.']
        path_lower = path.lower()
        return any(ind in path_lower for ind in test_indicators)
    
    def _normalize_code(self, code: str) -> str:
        """Normalize code for comparison"""
        # Remove comments
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        # Normalize whitespace
        code = re.sub(r'\s+', ' ', code)
        # Remove string literals
        code = re.sub(r'["\'].*?["\']', '""', code)
        return code.strip()
    
    def _collect_definitions(self, tree: ast.AST) -> Dict[str, List[Tuple[str, int]]]:
        """Collect all definitions from AST"""
        definitions = {
            "function": [],
            "class": [],
            "variable": [],
            "import": [],
        }
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                definitions["function"].append((node.name, node.lineno))
            elif isinstance(node, ast.ClassDef):
                definitions["class"].append((node.name, node.lineno))
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    name = alias.asname or alias.name.split('.')[0]
                    definitions["import"].append((name, node.lineno))
            elif isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    name = alias.asname or alias.name
                    definitions["import"].append((name, node.lineno))
        
        return definitions
    
    def _collect_usages(self, tree: ast.AST, content: str) -> Set[str]:
        """Collect all name usages"""
        usages = set()
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Name):
                usages.add(node.id)
            elif isinstance(node, ast.Attribute):
                if isinstance(node.value, ast.Name):
                    usages.add(node.value.id)
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    usages.add(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    if isinstance(node.func.value, ast.Name):
                        usages.add(node.func.value.id)
        
        return usages
    
    def _find_unreachable_code(self, tree: ast.AST) -> List[Tuple[int, str]]:
        """Find code after return/raise statements"""
        unreachable = []
        
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                in_return = False
                for stmt in node.body:
                    if in_return:
                        unreachable.append((stmt.lineno, "Code after return statement"))
                        break
                    if isinstance(stmt, (ast.Return, ast.Raise)):
                        in_return = True
        
        return unreachable
    
    def _extract_python_endpoints(self, path: str, content: str) -> List[APIEndpoint]:
        """Extract API endpoints from Python code"""
        endpoints = []
        
        # FastAPI patterns
        fastapi_pattern = r'@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["\']([^"\']+)["\']'
        for match in re.finditer(fastapi_pattern, content, re.IGNORECASE):
            method = match.group(1).upper()
            path_str = match.group(2)
            line = content[:match.start()].count('\n') + 1
            
            # Get function name
            func_match = re.search(r'def\s+(\w+)\s*\(', content[match.end():match.end()+200])
            func_name = func_match.group(1) if func_match else "unknown"
            
            # Check for auth decorator
            has_auth = bool(re.search(r'@.*(?:auth|login|token|jwt|secure)', 
                                      content[max(0, match.start()-200):match.start()], re.IGNORECASE))
            
            endpoints.append(APIEndpoint(
                file=path,
                line=line,
                method=method,
                path=path_str,
                function_name=func_name,
                has_auth=has_auth,
            ))
        
        # Flask patterns
        flask_pattern = r'@(?:app|blueprint|bp)\.(route|get|post|put|delete)\s*\(\s*["\']([^"\']+)["\']'
        for match in re.finditer(flask_pattern, content, re.IGNORECASE):
            method = match.group(1).upper()
            if method == 'ROUTE':
                # Check for methods parameter
                methods_match = re.search(r'methods\s*=\s*\[([^\]]+)\]', content[match.start():match.end()+100])
                method = methods_match.group(1).replace("'", "").replace('"', '') if methods_match else "GET"
            
            path_str = match.group(2)
            line = content[:match.start()].count('\n') + 1
            
            endpoints.append(APIEndpoint(
                file=path,
                line=line,
                method=method,
                path=path_str,
                function_name="",
            ))
        
        return endpoints
    
    def _extract_js_endpoints(self, path: str, content: str) -> List[APIEndpoint]:
        """Extract API endpoints from JavaScript/TypeScript code"""
        endpoints = []
        
        # Express patterns
        express_pattern = r'(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["\']([^"\']+)["\']'
        for match in re.finditer(express_pattern, content, re.IGNORECASE):
            method = match.group(1).upper()
            path_str = match.group(2)
            line = content[:match.start()].count('\n') + 1
            
            endpoints.append(APIEndpoint(
                file=path,
                line=line,
                method=method,
                path=path_str,
                function_name="",
            ))
        
        return endpoints
    
    def _extract_tested_items(self, content: str) -> Set[str]:
        """Extract function/class names being tested"""
        tested = set()
        
        # test_function_name pattern
        for match in re.finditer(r'def\s+test_(\w+)', content):
            tested.add(match.group(1))
        
        # Direct function calls in tests
        for match in re.finditer(r'[^\w](\w+)\s*\(', content):
            tested.add(match.group(1))
        
        return tested
    
    def _extract_function_names(self, content: str) -> List[str]:
        """Extract function names from Python code"""
        functions = []
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    if not node.name.startswith('_'):
                        functions.append(node.name)
        except:
            pass
        return functions
    
    def _count_by_field(self, items: List[Any], field: str) -> Dict[str, int]:
        """Count items by a field value"""
        counts = defaultdict(int)
        for item in items:
            value = getattr(item, field, "unknown")
            counts[value] += 1
        return dict(counts)
    
    def _count_endpoints_by_method(self, endpoints: List[APIEndpoint]) -> Dict[str, int]:
        """Count endpoints by HTTP method"""
        counts = defaultdict(int)
        for ep in endpoints:
            counts[ep.method] += 1
        return dict(counts)
    
    def _dep_to_dict(self, dep: Dependency) -> Dict[str, Any]:
        return {
            "name": dep.name,
            "version": dep.version,
            "source": dep.source,
            "is_dev": dep.is_dev,
            "used_in_files": dep.used_in_files,
        }
    
    def _dead_code_to_dict(self, dc: DeadCode) -> Dict[str, Any]:
        return {
            "file": dc.file,
            "line": dc.line,
            "type": dc.type,
            "name": dc.name,
            "reason": dc.reason,
        }
    
    def _endpoint_to_dict(self, ep: APIEndpoint) -> Dict[str, Any]:
        return {
            "file": ep.file,
            "line": ep.line,
            "method": ep.method,
            "path": ep.path,
            "function_name": ep.function_name,
            "has_auth": ep.has_auth,
        }
    
    def _pattern_to_dict(self, p: DesignPattern) -> Dict[str, Any]:
        return {
            "name": p.name,
            "file": p.file,
            "line": p.line,
            "confidence": p.confidence,
            "description": p.description,
        }


# Convenience function
def run_advanced_analysis(files: List[Any]) -> Dict[str, Any]:
    """
    Run all advanced analysis features.
    """
    analyzer = AdvancedAnalyzer()
    
    return {
        "dependencies": analyzer.analyze_dependencies(files),
        "duplicates": analyzer.detect_duplicates(files),
        "dead_code": analyzer.detect_dead_code(files),
        "api_endpoints": analyzer.extract_api_endpoints(files),
        "design_patterns": analyzer.detect_design_patterns(files),
        "test_coverage": analyzer.estimate_test_coverage(files),
    }
