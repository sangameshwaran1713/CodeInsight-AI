import ast
import io
import sys
from typing import Dict, Any, List, Optional

# Radon imports for complexity analysis
try:
    from radon.complexity import cc_visit, cc_rank
    from radon.metrics import mi_visit, mi_rank
    from radon.raw import analyze
    RADON_AVAILABLE = True
except ImportError:
    RADON_AVAILABLE = False

# Pylint imports for bug detection
try:
    from pylint import lint
    from pylint.reporters import JSONReporter
    PYLINT_AVAILABLE = True
except ImportError:
    PYLINT_AVAILABLE = False


class StaticAnalysisService:
    """Service for static code analysis using AST, Radon, and Pylint"""
    
    def extract_functions(self, code: str) -> List[Dict[str, Any]]:
        """Extract function definitions from Python code using AST"""
        functions = []
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                    func_info = {
                        "name": node.name,
                        "type": "async_function" if isinstance(node, ast.AsyncFunctionDef) else "function",
                        "line_start": node.lineno,
                        "line_end": node.end_lineno if hasattr(node, 'end_lineno') else None,
                        "parameters": [],
                        "decorators": [ast.unparse(d) if hasattr(ast, 'unparse') else str(d) for d in node.decorator_list],
                        "docstring": ast.get_docstring(node),
                        "returns": ast.unparse(node.returns) if node.returns and hasattr(ast, 'unparse') else None,
                    }
                    
                    # Extract parameters
                    for arg in node.args.args:
                        param = {
                            "name": arg.arg,
                            "annotation": ast.unparse(arg.annotation) if arg.annotation and hasattr(ast, 'unparse') else None,
                        }
                        func_info["parameters"].append(param)
                    
                    # Default values
                    defaults = node.args.defaults
                    if defaults:
                        for i, default in enumerate(defaults):
                            idx = len(func_info["parameters"]) - len(defaults) + i
                            if idx >= 0:
                                func_info["parameters"][idx]["default"] = ast.unparse(default) if hasattr(ast, 'unparse') else str(default)
                    
                    functions.append(func_info)
                
                elif isinstance(node, ast.ClassDef):
                    class_info = {
                        "name": node.name,
                        "type": "class",
                        "line_start": node.lineno,
                        "line_end": node.end_lineno if hasattr(node, 'end_lineno') else None,
                        "bases": [ast.unparse(b) if hasattr(ast, 'unparse') else str(b) for b in node.bases],
                        "decorators": [ast.unparse(d) if hasattr(ast, 'unparse') else str(d) for d in node.decorator_list],
                        "docstring": ast.get_docstring(node),
                        "methods": [],
                    }
                    
                    # Extract methods
                    for item in node.body:
                        if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                            method_info = {
                                "name": item.name,
                                "type": "async_method" if isinstance(item, ast.AsyncFunctionDef) else "method",
                                "line": item.lineno,
                                "is_static": any(isinstance(d, ast.Name) and d.id == 'staticmethod' for d in item.decorator_list),
                                "is_classmethod": any(isinstance(d, ast.Name) and d.id == 'classmethod' for d in item.decorator_list),
                            }
                            class_info["methods"].append(method_info)
                    
                    functions.append(class_info)
        
        except SyntaxError as e:
            return [{"error": f"Syntax error: {e.msg} at line {e.lineno}"}]
        except Exception as e:
            return [{"error": str(e)}]
        
        return functions

    def analyze_imports(self, code: str) -> Dict[str, Any]:
        """Analyze imports in Python code"""
        result = {
            "imports": [],
            "from_imports": [],
            "standard_library": [],
            "third_party": [],
        }
        
        # Common standard library modules
        stdlib = {
            'os', 'sys', 'io', 'json', 'ast', 'typing', 'collections', 'functools',
            'itertools', 'datetime', 'time', 'math', 'random', 're', 'pathlib',
            'logging', 'unittest', 'argparse', 'subprocess', 'threading', 'multiprocessing',
            'socket', 'http', 'urllib', 'email', 'html', 'xml', 'sqlite3', 'tempfile',
            'shutil', 'copy', 'pickle', 'hashlib', 'base64', 'contextlib', 'abc',
        }
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        import_info = {
                            "module": alias.name,
                            "alias": alias.asname,
                            "line": node.lineno,
                        }
                        result["imports"].append(import_info)
                        
                        root_module = alias.name.split('.')[0]
                        if root_module in stdlib:
                            result["standard_library"].append(alias.name)
                        else:
                            result["third_party"].append(alias.name)
                
                elif isinstance(node, ast.ImportFrom):
                    import_info = {
                        "module": node.module,
                        "names": [{"name": a.name, "alias": a.asname} for a in node.names],
                        "level": node.level,  # For relative imports
                        "line": node.lineno,
                    }
                    result["from_imports"].append(import_info)
                    
                    if node.module:
                        root_module = node.module.split('.')[0]
                        if root_module in stdlib:
                            result["standard_library"].append(node.module)
                        else:
                            result["third_party"].append(node.module)
        
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def analyze_python_complexity(self, code: str) -> Dict[str, Any]:
        """Analyze Python code complexity using Radon"""
        result = {
            "cyclomatic_complexity": [],
            "maintainability_index": None,
            "raw_metrics": None,
            "available": RADON_AVAILABLE,
        }
        
        if not RADON_AVAILABLE:
            result["error"] = "Radon library not available"
            return result
        
        try:
            # Cyclomatic Complexity
            cc_results = cc_visit(code)
            for item in cc_results:
                result["cyclomatic_complexity"].append({
                    "name": item.name,
                    "type": item.letter,  # F = function, C = class, M = method
                    "complexity": item.complexity,
                    "rank": cc_rank(item.complexity),
                    "line": item.lineno,
                })
            
            # Maintainability Index
            mi = mi_visit(code, multi=True)
            result["maintainability_index"] = {
                "score": round(mi, 2) if isinstance(mi, float) else mi,
                "rank": mi_rank(mi) if isinstance(mi, float) else "N/A",
            }
            
            # Raw metrics (LOC, SLOC, comments, etc.)
            raw = analyze(code)
            result["raw_metrics"] = {
                "loc": raw.loc,  # Lines of code
                "lloc": raw.lloc,  # Logical lines of code
                "sloc": raw.sloc,  # Source lines of code
                "comments": raw.comments,
                "multi": raw.multi,  # Multi-line strings
                "blank": raw.blank,
                "single_comments": raw.single_comments,
            }
            
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def analyze_python_bugs(self, code: str) -> Dict[str, Any]:
        """Analyze Python code for bugs using AST and Pylint"""
        result = {
            "syntax_check": None,
            "ast_issues": [],
            "pylint_issues": [],
            "available": True,
        }
        
        # Syntax check using AST
        try:
            tree = ast.parse(code)
            result["syntax_check"] = {"valid": True, "message": "Syntax is valid"}
            
            # AST-based analysis
            result["ast_issues"] = self._analyze_ast(tree, code)
            
        except SyntaxError as e:
            result["syntax_check"] = {
                "valid": False,
                "message": f"Syntax error at line {e.lineno}: {e.msg}",
                "line": e.lineno,
                "offset": e.offset,
            }
            return result
        
        # Pylint analysis (if available)
        if PYLINT_AVAILABLE:
            result["pylint_issues"] = self._run_pylint(code)
        else:
            result["pylint_available"] = False
        
        return result
    
    def _analyze_ast(self, tree: ast.AST, code: str) -> List[Dict[str, Any]]:
        """Analyze AST for common issues"""
        issues = []
        
        class IssueVisitor(ast.NodeVisitor):
            def __init__(self):
                self.issues = []
                self.defined_vars = set()
                self.used_vars = set()
            
            def visit_Name(self, node):
                if isinstance(node.ctx, ast.Store):
                    self.defined_vars.add((node.id, node.lineno))
                elif isinstance(node.ctx, ast.Load):
                    self.used_vars.add((node.id, node.lineno))
                self.generic_visit(node)
            
            def visit_ExceptHandler(self, node):
                # Check for bare except
                if node.type is None:
                    self.issues.append({
                        "type": "warning",
                        "line": node.lineno,
                        "message": "Bare 'except:' clause - consider catching specific exceptions",
                        "severity": "medium",
                    })
                self.generic_visit(node)
            
            def visit_Assert(self, node):
                # Assert statements can be disabled with -O flag
                self.issues.append({
                    "type": "info",
                    "line": node.lineno,
                    "message": "Assert statement may be disabled in optimized mode (-O)",
                    "severity": "low",
                })
                self.generic_visit(node)
            
            def visit_Global(self, node):
                # Global variables are generally discouraged
                self.issues.append({
                    "type": "warning",
                    "line": node.lineno,
                    "message": f"Global variable(s) used: {', '.join(node.names)} - consider refactoring",
                    "severity": "medium",
                })
                self.generic_visit(node)
            
            def visit_Pass(self, node):
                # Pass in try/except might hide errors
                self.generic_visit(node)
            
            def visit_Compare(self, node):
                # Check for 'is' comparison with literals
                for op in node.ops:
                    if isinstance(op, (ast.Is, ast.IsNot)):
                        for comparator in node.comparators:
                            if isinstance(comparator, (ast.Constant, ast.Num, ast.Str)):
                                self.issues.append({
                                    "type": "warning",
                                    "line": node.lineno,
                                    "message": "Using 'is' with a literal - use '==' instead",
                                    "severity": "medium",
                                })
                self.generic_visit(node)
        
        visitor = IssueVisitor()
        visitor.visit(tree)
        issues.extend(visitor.issues)
        
        return issues
    
    def _run_pylint(self, code: str) -> List[Dict[str, Any]]:
        """Run Pylint on the code and return issues"""
        issues = []
        
        try:
            import tempfile
            import os
            import json
            
            # Write code to temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                # Capture pylint output
                old_stdout = sys.stdout
                sys.stdout = io.StringIO()
                
                # Run pylint with JSON output
                results = lint.Run(
                    [temp_file, '--output-format=json', '--disable=C0114,C0115,C0116'],
                    exit=False
                )
                
                output = sys.stdout.getvalue()
                sys.stdout = old_stdout
                
                if output:
                    pylint_results = json.loads(output)
                    for item in pylint_results:
                        issues.append({
                            "type": item.get("type", "convention"),
                            "line": item.get("line", 0),
                            "column": item.get("column", 0),
                            "message": item.get("message", ""),
                            "symbol": item.get("symbol", ""),
                            "severity": self._pylint_type_to_severity(item.get("type", "")),
                        })
            finally:
                os.unlink(temp_file)
                
        except Exception as e:
            issues.append({
                "type": "error",
                "message": f"Pylint analysis failed: {str(e)}",
                "severity": "info",
            })
        
        return issues
    
    def _pylint_type_to_severity(self, pylint_type: str) -> str:
        """Convert Pylint message type to severity"""
        mapping = {
            "error": "high",
            "warning": "medium",
            "convention": "low",
            "refactor": "low",
            "fatal": "critical",
        }
        return mapping.get(pylint_type.lower(), "low")
