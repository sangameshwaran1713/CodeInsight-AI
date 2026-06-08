"""
Code Complexity Analyzer

Detects loops, nested loops, recursion, and large functions.
Returns time complexity, space complexity, and optimization suggestions.

Tech Stack: Python, Radon, AST module
"""

import ast
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum

# Radon imports for complexity analysis
try:
    from radon.complexity import cc_visit, cc_rank
    from radon.metrics import mi_visit, mi_rank
    from radon.raw import analyze
    RADON_AVAILABLE = True
except ImportError:
    RADON_AVAILABLE = False


class ComplexityType(Enum):
    CONSTANT = "O(1)"
    LOGARITHMIC = "O(log n)"
    LINEAR = "O(n)"
    LINEARITHMIC = "O(n log n)"
    QUADRATIC = "O(n²)"
    CUBIC = "O(n³)"
    POLYNOMIAL = "O(n^k)"
    EXPONENTIAL = "O(2^n)"
    FACTORIAL = "O(n!)"


@dataclass
class LoopInfo:
    """Information about a detected loop"""
    line: int
    loop_type: str  # 'for', 'while', 'comprehension'
    variable: Optional[str] = None
    iterable: Optional[str] = None
    depth: int = 1
    is_nested: bool = False
    parent_loop_line: Optional[int] = None


@dataclass
class RecursionInfo:
    """Information about detected recursion"""
    function_name: str
    line: int
    call_line: int
    recursion_type: str  # 'direct', 'indirect', 'tail'
    is_tail_recursive: bool = False


@dataclass
class FunctionInfo:
    """Information about a function"""
    name: str
    line_start: int
    line_end: int
    line_count: int
    parameter_count: int
    local_variables: int
    loops: List[LoopInfo] = field(default_factory=list)
    nested_loop_depth: int = 0
    is_recursive: bool = False
    recursion_info: Optional[RecursionInfo] = None
    cyclomatic_complexity: int = 0
    is_large: bool = False


@dataclass
class ComplexityResult:
    """Result of complexity analysis"""
    time_complexity: str
    space_complexity: str
    confidence: str  # 'high', 'medium', 'low'
    factors: List[str] = field(default_factory=list)


class ComplexityAnalyzer:
    """
    Analyzes Python code for complexity patterns.
    
    Detects:
    - Loops (for, while, comprehensions)
    - Nested loops
    - Recursion (direct, indirect, tail)
    - Large functions
    
    Returns:
    - Time complexity estimation
    - Space complexity estimation
    - Optimization suggestions
    """
    
    # Thresholds for large functions
    LARGE_FUNCTION_LINES = 50
    LARGE_FUNCTION_PARAMS = 7
    LARGE_FUNCTION_COMPLEXITY = 10
    
    def analyze(self, code: str) -> Dict[str, Any]:
        """
        Main entry point for complexity analysis.
        
        Args:
            code: Python source code to analyze
            
        Returns:
            Comprehensive complexity analysis results
        """
        result = {
            "success": True,
            "loops": [],
            "nested_loops": [],
            "recursion": [],
            "large_functions": [],
            "functions": [],
            "time_complexity": None,
            "space_complexity": None,
            "optimization_suggestions": [],
            "metrics": {},
        }
        
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return {
                "success": False,
                "error": f"Syntax error at line {e.lineno}: {e.msg}",
            }
        
        # Analyze functions
        functions = self._analyze_functions(tree, code)
        result["functions"] = [self._function_to_dict(f) for f in functions]
        
        # Extract specific patterns
        all_loops = []
        nested_loops = []
        recursions = []
        large_funcs = []
        
        for func in functions:
            all_loops.extend(func.loops)
            nested_loops.extend([l for l in func.loops if l.is_nested])
            if func.is_recursive and func.recursion_info:
                recursions.append(func.recursion_info)
            if func.is_large:
                large_funcs.append(func)
        
        result["loops"] = [self._loop_to_dict(l) for l in all_loops]
        result["nested_loops"] = [self._loop_to_dict(l) for l in nested_loops]
        result["recursion"] = [self._recursion_to_dict(r) for r in recursions]
        result["large_functions"] = [self._function_to_dict(f) for f in large_funcs]
        
        # Calculate overall complexity
        complexity = self._estimate_complexity(functions, all_loops, recursions)
        result["time_complexity"] = {
            "notation": complexity.time_complexity,
            "confidence": complexity.confidence,
            "factors": complexity.factors,
        }
        result["space_complexity"] = {
            "notation": complexity.space_complexity,
            "confidence": complexity.confidence,
        }
        
        # Generate optimization suggestions
        result["optimization_suggestions"] = self._generate_suggestions(
            functions, all_loops, nested_loops, recursions, large_funcs
        )
        
        # Add Radon metrics if available
        if RADON_AVAILABLE:
            result["metrics"] = self._get_radon_metrics(code)
        
        return result
    
    def _analyze_functions(self, tree: ast.AST, code: str) -> List[FunctionInfo]:
        """Analyze all functions in the code"""
        functions = []
        lines = code.split('\n')
        
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_info = self._analyze_single_function(node, lines)
                functions.append(func_info)
        
        return functions
    
    def _analyze_single_function(self, node, lines: List[str]) -> FunctionInfo:
        """Analyze a single function for complexity patterns"""
        line_end = node.end_lineno if hasattr(node, 'end_lineno') and node.end_lineno else node.lineno
        line_count = line_end - node.lineno + 1
        
        # Count local variables
        local_vars = self._count_local_variables(node)
        
        # Detect loops
        loops = self._detect_loops(node)
        
        # Calculate max nested depth
        nested_depth = self._calculate_max_nesting(loops)
        
        # Detect recursion
        recursion_info = self._detect_recursion(node)
        
        # Get cyclomatic complexity using Radon if available
        cc = 0
        if RADON_AVAILABLE:
            try:
                func_code = '\n'.join(lines[node.lineno - 1:line_end])
                # Dedent to make it valid
                func_code = self._dedent_code(func_code)
                cc_results = cc_visit(func_code)
                if cc_results:
                    cc = cc_results[0].complexity
            except:
                pass
        
        # Determine if function is large
        is_large = (
            line_count > self.LARGE_FUNCTION_LINES or
            len(node.args.args) > self.LARGE_FUNCTION_PARAMS or
            cc > self.LARGE_FUNCTION_COMPLEXITY
        )
        
        return FunctionInfo(
            name=node.name,
            line_start=node.lineno,
            line_end=line_end,
            line_count=line_count,
            parameter_count=len(node.args.args),
            local_variables=local_vars,
            loops=loops,
            nested_loop_depth=nested_depth,
            is_recursive=recursion_info is not None,
            recursion_info=recursion_info,
            cyclomatic_complexity=cc,
            is_large=is_large,
        )
    
    def _dedent_code(self, code: str) -> str:
        """Remove common leading whitespace from code"""
        lines = code.split('\n')
        if not lines:
            return code
        
        # Find minimum indentation (ignoring empty lines)
        min_indent = float('inf')
        for line in lines:
            stripped = line.lstrip()
            if stripped:
                indent = len(line) - len(stripped)
                min_indent = min(min_indent, indent)
        
        if min_indent == float('inf'):
            return code
        
        # Remove the common indentation
        return '\n'.join(line[min_indent:] if len(line) > min_indent else line for line in lines)
    
    def _count_local_variables(self, node: ast.FunctionDef) -> int:
        """Count local variable assignments in a function"""
        variables = set()
        
        for child in ast.walk(node):
            if isinstance(child, ast.Assign):
                for target in child.targets:
                    if isinstance(target, ast.Name):
                        variables.add(target.id)
                    elif isinstance(target, ast.Tuple):
                        for elt in target.elts:
                            if isinstance(elt, ast.Name):
                                variables.add(elt.id)
            elif isinstance(child, ast.AnnAssign) and child.target:
                if isinstance(child.target, ast.Name):
                    variables.add(child.target.id)
        
        return len(variables)
    
    def _detect_loops(self, node: ast.FunctionDef) -> List[LoopInfo]:
        """Detect all loops in a function including nested loops"""
        loops = []
        
        class LoopVisitor(ast.NodeVisitor):
            def __init__(self):
                self.loop_stack = []
                self.loops = []
            
            def visit_For(self, node):
                loop_info = LoopInfo(
                    line=node.lineno,
                    loop_type='for',
                    variable=node.target.id if isinstance(node.target, ast.Name) else None,
                    iterable=ast.unparse(node.iter) if hasattr(ast, 'unparse') else str(type(node.iter)),
                    depth=len(self.loop_stack) + 1,
                    is_nested=len(self.loop_stack) > 0,
                    parent_loop_line=self.loop_stack[-1] if self.loop_stack else None,
                )
                self.loops.append(loop_info)
                self.loop_stack.append(node.lineno)
                self.generic_visit(node)
                self.loop_stack.pop()
            
            def visit_While(self, node):
                loop_info = LoopInfo(
                    line=node.lineno,
                    loop_type='while',
                    depth=len(self.loop_stack) + 1,
                    is_nested=len(self.loop_stack) > 0,
                    parent_loop_line=self.loop_stack[-1] if self.loop_stack else None,
                )
                self.loops.append(loop_info)
                self.loop_stack.append(node.lineno)
                self.generic_visit(node)
                self.loop_stack.pop()
            
            def visit_ListComp(self, node):
                for generator in node.generators:
                    loop_info = LoopInfo(
                        line=node.lineno,
                        loop_type='list_comprehension',
                        variable=generator.target.id if isinstance(generator.target, ast.Name) else None,
                        depth=len(self.loop_stack) + 1,
                        is_nested=len(self.loop_stack) > 0,
                        parent_loop_line=self.loop_stack[-1] if self.loop_stack else None,
                    )
                    self.loops.append(loop_info)
                self.generic_visit(node)
            
            def visit_SetComp(self, node):
                for generator in node.generators:
                    loop_info = LoopInfo(
                        line=node.lineno,
                        loop_type='set_comprehension',
                        variable=generator.target.id if isinstance(generator.target, ast.Name) else None,
                        depth=len(self.loop_stack) + 1,
                        is_nested=len(self.loop_stack) > 0,
                        parent_loop_line=self.loop_stack[-1] if self.loop_stack else None,
                    )
                    self.loops.append(loop_info)
                self.generic_visit(node)
            
            def visit_DictComp(self, node):
                for generator in node.generators:
                    loop_info = LoopInfo(
                        line=node.lineno,
                        loop_type='dict_comprehension',
                        variable=generator.target.id if isinstance(generator.target, ast.Name) else None,
                        depth=len(self.loop_stack) + 1,
                        is_nested=len(self.loop_stack) > 0,
                        parent_loop_line=self.loop_stack[-1] if self.loop_stack else None,
                    )
                    self.loops.append(loop_info)
                self.generic_visit(node)
            
            def visit_GeneratorExp(self, node):
                for generator in node.generators:
                    loop_info = LoopInfo(
                        line=node.lineno,
                        loop_type='generator_expression',
                        variable=generator.target.id if isinstance(generator.target, ast.Name) else None,
                        depth=len(self.loop_stack) + 1,
                        is_nested=len(self.loop_stack) > 0,
                        parent_loop_line=self.loop_stack[-1] if self.loop_stack else None,
                    )
                    self.loops.append(loop_info)
                self.generic_visit(node)
        
        visitor = LoopVisitor()
        visitor.visit(node)
        return visitor.loops
    
    def _calculate_max_nesting(self, loops: List[LoopInfo]) -> int:
        """Calculate maximum loop nesting depth"""
        if not loops:
            return 0
        return max(loop.depth for loop in loops)
    
    def _detect_recursion(self, node: ast.FunctionDef) -> Optional[RecursionInfo]:
        """Detect if a function is recursive"""
        func_name = node.name
        
        class RecursionVisitor(ast.NodeVisitor):
            def __init__(self):
                self.recursive_calls = []
                self.last_statement = None
            
            def visit_Call(self, node):
                if isinstance(node.func, ast.Name) and node.func.id == func_name:
                    self.recursive_calls.append(node.lineno)
                self.generic_visit(node)
        
        visitor = RecursionVisitor()
        visitor.visit(node)
        
        if not visitor.recursive_calls:
            return None
        
        # Check if tail recursive (last statement is return with recursive call)
        is_tail = False
        if node.body:
            last_stmt = node.body[-1]
            if isinstance(last_stmt, ast.Return) and last_stmt.value:
                if isinstance(last_stmt.value, ast.Call):
                    if isinstance(last_stmt.value.func, ast.Name):
                        if last_stmt.value.func.id == func_name:
                            is_tail = True
        
        return RecursionInfo(
            function_name=func_name,
            line=node.lineno,
            call_line=visitor.recursive_calls[0],
            recursion_type='tail' if is_tail else 'direct',
            is_tail_recursive=is_tail,
        )
    
    def _estimate_complexity(
        self,
        functions: List[FunctionInfo],
        loops: List[LoopInfo],
        recursions: List[RecursionInfo]
    ) -> ComplexityResult:
        """Estimate overall time and space complexity"""
        factors = []
        
        # Determine time complexity based on patterns
        max_nesting = max((f.nested_loop_depth for f in functions), default=0)
        has_recursion = any(f.is_recursive for f in functions)
        
        # Time complexity estimation
        if has_recursion:
            # Check for tail recursion
            tail_recursive = any(
                r.is_tail_recursive for r in recursions
            )
            if tail_recursive:
                time_complexity = ComplexityType.LINEAR.value
                factors.append("Tail recursion detected (can be optimized to O(n))")
            else:
                time_complexity = ComplexityType.EXPONENTIAL.value
                factors.append("Non-tail recursion detected")
        elif max_nesting >= 3:
            time_complexity = ComplexityType.CUBIC.value
            factors.append(f"Triple nested loops detected (depth {max_nesting})")
        elif max_nesting == 2:
            time_complexity = ComplexityType.QUADRATIC.value
            factors.append("Nested loops detected (depth 2)")
        elif max_nesting == 1:
            time_complexity = ComplexityType.LINEAR.value
            factors.append("Single loop detected")
        elif loops:
            time_complexity = ComplexityType.LINEAR.value
            factors.append("Iteration detected")
        else:
            time_complexity = ComplexityType.CONSTANT.value
            factors.append("No loops or recursion detected")
        
        # Space complexity estimation
        total_local_vars = sum(f.local_variables for f in functions)
        has_data_structures = False  # Could be enhanced to detect list/dict creation
        
        if has_recursion:
            space_complexity = ComplexityType.LINEAR.value
            factors.append("Recursion uses stack space proportional to depth")
        elif total_local_vars > 20:
            space_complexity = ComplexityType.LINEAR.value
            factors.append(f"Many local variables ({total_local_vars})")
        else:
            space_complexity = ComplexityType.CONSTANT.value
        
        # Confidence level
        if len(functions) == 0 or len(loops) == 0:
            confidence = "high"
        elif has_recursion or max_nesting > 2:
            confidence = "medium"
        else:
            confidence = "high"
        
        return ComplexityResult(
            time_complexity=time_complexity,
            space_complexity=space_complexity,
            confidence=confidence,
            factors=factors,
        )
    
    def _generate_suggestions(
        self,
        functions: List[FunctionInfo],
        loops: List[LoopInfo],
        nested_loops: List[LoopInfo],
        recursions: List[RecursionInfo],
        large_funcs: List[FunctionInfo]
    ) -> List[Dict[str, Any]]:
        """Generate optimization suggestions"""
        suggestions = []
        
        # Nested loop suggestions
        if nested_loops:
            max_depth = max(l.depth for l in nested_loops)
            if max_depth >= 3:
                suggestions.append({
                    "type": "critical",
                    "category": "nested_loops",
                    "title": f"Deep Nested Loops (Depth: {max_depth})",
                    "description": f"Found loops nested {max_depth} levels deep, resulting in O(n^{max_depth}) complexity.",
                    "suggestion": "Consider using hash maps, breaking into separate functions, or using more efficient algorithms.",
                    "lines": [l.line for l in nested_loops if l.depth >= 3],
                })
            elif max_depth == 2:
                suggestions.append({
                    "type": "warning",
                    "category": "nested_loops",
                    "title": "Nested Loops Detected",
                    "description": "Nested loops result in O(n²) quadratic complexity.",
                    "suggestion": "If iterating over the same collection, consider using a hash set for O(1) lookups, or restructure the algorithm.",
                    "lines": [l.line for l in nested_loops],
                })
        
        # Recursion suggestions
        for rec in recursions:
            if rec.is_tail_recursive:
                suggestions.append({
                    "type": "info",
                    "category": "recursion",
                    "title": f"Tail Recursion in '{rec.function_name}'",
                    "description": "Tail recursion detected. Python doesn't optimize tail calls by default.",
                    "suggestion": "Consider converting to iteration for better performance and to avoid stack overflow on large inputs.",
                    "lines": [rec.line, rec.call_line],
                })
            else:
                suggestions.append({
                    "type": "warning",
                    "category": "recursion",
                    "title": f"Non-Tail Recursion in '{rec.function_name}'",
                    "description": "Non-tail recursion can lead to exponential time complexity and stack overflow.",
                    "suggestion": "Add memoization (functools.lru_cache), convert to dynamic programming, or use iteration.",
                    "lines": [rec.line, rec.call_line],
                })
        
        # Large function suggestions
        for func in large_funcs:
            reasons = []
            if func.line_count > self.LARGE_FUNCTION_LINES:
                reasons.append(f"{func.line_count} lines")
            if func.parameter_count > self.LARGE_FUNCTION_PARAMS:
                reasons.append(f"{func.parameter_count} parameters")
            if func.cyclomatic_complexity > self.LARGE_FUNCTION_COMPLEXITY:
                reasons.append(f"cyclomatic complexity {func.cyclomatic_complexity}")
            
            suggestions.append({
                "type": "refactor",
                "category": "large_function",
                "title": f"Large Function: '{func.name}'",
                "description": f"Function is large ({', '.join(reasons)}), making it harder to maintain and test.",
                "suggestion": "Break down into smaller, single-responsibility functions. Consider the Single Responsibility Principle.",
                "lines": [func.line_start],
            })
        
        # Loop-specific optimizations
        for loop in loops:
            if loop.loop_type == 'while':
                suggestions.append({
                    "type": "info",
                    "category": "loop_type",
                    "title": "'while' Loop at Line " + str(loop.line),
                    "description": "While loops can be harder to reason about and may risk infinite loops.",
                    "suggestion": "If iterating over a collection, prefer 'for' loops. Ensure termination condition is clear.",
                    "lines": [loop.line],
                })
        
        # Comprehension suggestions for regular loops
        simple_for_loops = [l for l in loops if l.loop_type == 'for' and not l.is_nested]
        if simple_for_loops:
            suggestions.append({
                "type": "tip",
                "category": "pythonic",
                "title": "Consider List Comprehensions",
                "description": f"Found {len(simple_for_loops)} simple for loop(s) that might be convertible to comprehensions.",
                "suggestion": "List comprehensions are often faster and more Pythonic: [x for x in items if condition]",
                "lines": [l.line for l in simple_for_loops[:3]],
            })
        
        # General optimization tips
        if not suggestions:
            suggestions.append({
                "type": "success",
                "category": "general",
                "title": "No Major Complexity Issues",
                "description": "The code appears to have reasonable complexity.",
                "suggestion": "Continue following best practices. Consider profiling for specific performance bottlenecks.",
                "lines": [],
            })
        
        return suggestions
    
    def _get_radon_metrics(self, code: str) -> Dict[str, Any]:
        """Get Radon complexity metrics"""
        metrics = {
            "cyclomatic_complexity": [],
            "maintainability_index": None,
            "raw_metrics": None,
        }
        
        try:
            # Cyclomatic Complexity
            cc_results = cc_visit(code)
            for item in cc_results:
                metrics["cyclomatic_complexity"].append({
                    "name": item.name,
                    "type": item.letter,
                    "complexity": item.complexity,
                    "rank": cc_rank(item.complexity),
                    "line": item.lineno,
                })
            
            # Maintainability Index
            mi = mi_visit(code, multi=True)
            if isinstance(mi, float):
                metrics["maintainability_index"] = {
                    "score": round(mi, 2),
                    "rank": mi_rank(mi),
                }
            
            # Raw metrics
            raw = analyze(code)
            metrics["raw_metrics"] = {
                "loc": raw.loc,
                "lloc": raw.lloc,
                "sloc": raw.sloc,
                "comments": raw.comments,
                "blank": raw.blank,
                "comment_ratio": round(raw.comments / raw.sloc * 100, 1) if raw.sloc > 0 else 0,
            }
        except Exception as e:
            metrics["error"] = str(e)
        
        return metrics
    
    def _loop_to_dict(self, loop: LoopInfo) -> Dict[str, Any]:
        """Convert LoopInfo to dictionary"""
        return {
            "line": loop.line,
            "type": loop.loop_type,
            "variable": loop.variable,
            "iterable": loop.iterable,
            "depth": loop.depth,
            "is_nested": loop.is_nested,
            "parent_line": loop.parent_loop_line,
        }
    
    def _recursion_to_dict(self, rec: RecursionInfo) -> Dict[str, Any]:
        """Convert RecursionInfo to dictionary"""
        return {
            "function": rec.function_name,
            "definition_line": rec.line,
            "call_line": rec.call_line,
            "type": rec.recursion_type,
            "is_tail_recursive": rec.is_tail_recursive,
        }
    
    def _function_to_dict(self, func: FunctionInfo) -> Dict[str, Any]:
        """Convert FunctionInfo to dictionary"""
        return {
            "name": func.name,
            "line_start": func.line_start,
            "line_end": func.line_end,
            "line_count": func.line_count,
            "parameter_count": func.parameter_count,
            "local_variables": func.local_variables,
            "loop_count": len(func.loops),
            "max_nesting_depth": func.nested_loop_depth,
            "is_recursive": func.is_recursive,
            "cyclomatic_complexity": func.cyclomatic_complexity,
            "is_large": func.is_large,
        }


# Convenience function for easy import
def analyze_complexity(code: str) -> Dict[str, Any]:
    """
    Analyze code complexity.
    
    Args:
        code: Python source code to analyze
        
    Returns:
        Dictionary with complexity analysis results including:
        - loops: All detected loops
        - nested_loops: Only nested loops
        - recursion: Detected recursive functions
        - large_functions: Functions exceeding thresholds
        - time_complexity: Estimated Big O time complexity
        - space_complexity: Estimated space complexity
        - optimization_suggestions: List of improvement suggestions
        - metrics: Radon metrics (if available)
    """
    analyzer = ComplexityAnalyzer()
    return analyzer.analyze(code)


# Example usage and testing
if __name__ == "__main__":
    test_code = '''
def fibonacci(n):
    """Recursive fibonacci - O(2^n) time complexity"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def matrix_multiply(a, b):
    """Matrix multiplication - O(n^3) time complexity"""
    n = len(a)
    result = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                result[i][j] += a[i][k] * b[k][j]
    return result

def find_duplicates(arr):
    """Find duplicates - O(n) with hash set"""
    seen = set()
    duplicates = []
    for item in arr:
        if item in seen:
            duplicates.append(item)
        seen.add(item)
    return duplicates

def large_function_example(a, b, c, d, e, f, g, h):
    """Example of a large function with many parameters"""
    result = 0
    temp1 = a + b
    temp2 = c + d
    temp3 = e + f
    temp4 = g + h
    
    for i in range(100):
        result += temp1
        result += temp2
        result += temp3
        result += temp4
        
    return result
'''
    
    import json
    result = analyze_complexity(test_code)
    print(json.dumps(result, indent=2))
