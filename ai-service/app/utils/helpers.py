"""
Utility functions for the AI service
"""
import re
from typing import List, Dict, Any


def clean_code(code: str) -> str:
    """Remove excessive whitespace and normalize line endings"""
    # Normalize line endings
    code = code.replace('\r\n', '\n').replace('\r', '\n')
    # Remove trailing whitespace from each line
    lines = [line.rstrip() for line in code.split('\n')]
    # Remove excessive blank lines (more than 2 consecutive)
    cleaned_lines = []
    blank_count = 0
    for line in lines:
        if line == '':
            blank_count += 1
            if blank_count <= 2:
                cleaned_lines.append(line)
        else:
            blank_count = 0
            cleaned_lines.append(line)
    return '\n'.join(cleaned_lines)


def count_lines(code: str) -> int:
    """Count the number of lines in code"""
    return len(code.split('\n'))


def extract_functions(code: str, language: str) -> List[str]:
    """Extract function names from code based on language"""
    patterns = {
        'python': r'def\s+(\w+)\s*\(',
        'javascript': r'(?:function\s+(\w+)|(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))',
        'typescript': r'(?:function\s+(\w+)|(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))',
        'java': r'(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(',
        'cpp': r'\w+\s+(\w+)\s*\([^)]*\)\s*{',
        'go': r'func\s+(\w+)\s*\(',
    }
    
    pattern = patterns.get(language, patterns['python'])
    matches = re.findall(pattern, code)
    
    # Flatten and filter empty strings
    functions = []
    for match in matches:
        if isinstance(match, tuple):
            functions.extend([m for m in match if m])
        else:
            functions.append(match)
    
    return functions


def estimate_complexity_simple(code: str) -> Dict[str, Any]:
    """Simple heuristic-based complexity estimation"""
    lines = code.split('\n')
    
    # Count loops
    loop_keywords = ['for', 'while', 'foreach', 'do']
    loop_count = sum(
        1 for line in lines 
        for keyword in loop_keywords 
        if re.search(rf'\b{keyword}\b', line)
    )
    
    # Count nested loops (rough estimation)
    nested_loop_count = 0
    indent_level = 0
    in_loop = False
    
    for line in lines:
        stripped = line.lstrip()
        current_indent = len(line) - len(stripped)
        
        has_loop = any(
            re.search(rf'\b{kw}\b', stripped) 
            for kw in loop_keywords
        )
        
        if has_loop:
            if in_loop:
                nested_loop_count += 1
            in_loop = True
            indent_level = current_indent
        elif current_indent <= indent_level and stripped:
            in_loop = False
    
    # Estimate Big O
    if nested_loop_count >= 2:
        time_complexity = "O(n³) or higher"
    elif nested_loop_count == 1:
        time_complexity = "O(n²)"
    elif loop_count > 0:
        time_complexity = "O(n)"
    else:
        time_complexity = "O(1)"
    
    return {
        "estimated_time_complexity": time_complexity,
        "loop_count": loop_count,
        "nested_loops_detected": nested_loop_count,
        "total_lines": len(lines),
    }


def format_analysis_response(analysis_type: str, result: str) -> Dict[str, Any]:
    """Format analysis result into a structured response"""
    return {
        "type": analysis_type,
        "result": result,
        "formatted": True,
    }
