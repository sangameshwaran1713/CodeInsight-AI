"""
LLM-Powered Repository Analysis

Uses OpenAI GPT models to provide intelligent code analysis including:
- Architecture recommendations
- Code quality assessment
- Security vulnerability explanations
- Refactoring suggestions
- Documentation generation
- Performance optimization tips
"""

import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import json

# Try to import OpenAI
try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from app.config import settings


@dataclass
class LLMInsight:
    """An insight from LLM analysis"""
    category: str
    title: str
    description: str
    priority: str  # critical, high, medium, low
    affected_files: List[str]
    suggestions: List[str]
    code_examples: Optional[Dict[str, str]] = None


class LLMRepoAnalyzer:
    """
    LLM-powered repository analyzer for deep code insights.
    """
    
    # Analysis prompts
    PROMPTS = {
        "architecture": """Analyze the repository structure and code to provide architecture recommendations:

Repository Structure:
{structure}

Files Summary:
{files_summary}

Provide analysis in JSON format:
{{
    "architecture_type": "detected architecture pattern (MVC, microservices, monolith, etc.)",
    "strengths": ["list of architectural strengths"],
    "weaknesses": ["list of architectural weaknesses"],
    "recommendations": [
        {{
            "title": "recommendation title",
            "description": "detailed description",
            "priority": "high/medium/low",
            "affected_areas": ["list of affected files/modules"]
        }}
    ],
    "suggested_structure": "description of recommended structure improvements"
}}""",

        "code_quality": """Analyze the following code files for quality issues:

{code_samples}

Detected Issues (from static analysis):
{static_issues}

Provide code quality assessment in JSON format:
{{
    "overall_score": 0-100,
    "grade": "A/B/C/D/F",
    "summary": "brief overall assessment",
    "categories": {{
        "readability": {{"score": 0-100, "issues": ["..."]}},
        "maintainability": {{"score": 0-100, "issues": ["..."]}},
        "testability": {{"score": 0-100, "issues": ["..."]}},
        "documentation": {{"score": 0-100, "issues": ["..."]}}
    }},
    "critical_issues": [
        {{
            "file": "path",
            "line": number,
            "issue": "description",
            "fix": "suggested fix"
        }}
    ],
    "improvement_roadmap": ["ordered list of improvements to make"]
}}""",

        "security": """Analyze the following code for security vulnerabilities:

{code_samples}

Known vulnerabilities detected:
{known_vulns}

Provide security analysis in JSON format:
{{
    "risk_level": "critical/high/medium/low",
    "summary": "security assessment summary",
    "vulnerabilities": [
        {{
            "type": "vulnerability type (XSS, SQL Injection, etc.)",
            "severity": "critical/high/medium/low",
            "file": "affected file",
            "line": line_number,
            "description": "detailed description",
            "exploitation": "how it could be exploited",
            "remediation": "how to fix it",
            "code_fix": "code example showing the fix"
        }}
    ],
    "security_best_practices": ["list of security improvements to implement"],
    "compliance_notes": "notes on compliance with security standards"
}}""",

        "performance": """Analyze the following code for performance issues:

{code_samples}

Complexity Analysis:
{complexity_data}

Provide performance analysis in JSON format:
{{
    "performance_score": 0-100,
    "summary": "performance assessment summary",
    "bottlenecks": [
        {{
            "file": "path",
            "function": "function name",
            "issue": "performance issue description",
            "impact": "high/medium/low",
            "current_complexity": "O(n^2) etc.",
            "suggested_complexity": "O(n) etc.",
            "optimization": "how to optimize",
            "code_before": "current code snippet",
            "code_after": "optimized code snippet"
        }}
    ],
    "memory_concerns": ["list of memory-related issues"],
    "async_opportunities": ["places where async could improve performance"],
    "caching_recommendations": ["recommendations for caching"]
}}""",

        "refactoring": """Analyze the following code and suggest refactoring improvements:

{code_samples}

Code Metrics:
- Functions: {function_count}
- Classes: {class_count}
- Average complexity: {avg_complexity}
- Duplications: {duplicate_count}

Provide refactoring recommendations in JSON format:
{{
    "refactoring_priority": "high/medium/low",
    "summary": "overall refactoring assessment",
    "suggestions": [
        {{
            "type": "refactoring type (extract method, rename, etc.)",
            "priority": "high/medium/low",
            "file": "affected file",
            "title": "brief title",
            "description": "detailed description",
            "benefits": ["list of benefits"],
            "code_before": "current code",
            "code_after": "refactored code"
        }}
    ],
    "design_patterns": [
        {{
            "pattern": "pattern name",
            "where": "where to apply",
            "why": "why it would help"
        }}
    ],
    "tech_debt_items": ["list of technical debt to address"]
}}""",

        "documentation": """Generate documentation for the following code:

{code_samples}

Project Info:
{project_info}

Provide documentation in JSON format:
{{
    "project_overview": "comprehensive project description",
    "setup_instructions": ["step by step setup instructions"],
    "architecture_docs": "architecture documentation",
    "api_documentation": [
        {{
            "endpoint": "endpoint path",
            "method": "HTTP method",
            "description": "what it does",
            "parameters": ["list of parameters"],
            "response": "response format",
            "example": "usage example"
        }}
    ],
    "function_docs": [
        {{
            "name": "function name",
            "file": "file path",
            "docstring": "generated docstring",
            "usage_example": "example code"
        }}
    ],
    "readme_content": "suggested README.md content"
}}"""
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize with OpenAI API key"""
        self.api_key = api_key or settings.openai_api_key
        self.model = settings.openai_model
        
        if OPENAI_AVAILABLE and self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None
    
    @property
    def is_available(self) -> bool:
        """Check if LLM analysis is available"""
        return self.client is not None
    
    async def analyze_architecture(
        self,
        files: List[Any],
        structure: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get architecture recommendations"""
        if not self.is_available:
            return {"error": "LLM analysis not available", "available": False}
        
        # Prepare file summary
        files_summary = self._summarize_files(files)
        
        prompt = self.PROMPTS["architecture"].format(
            structure=json.dumps(structure, indent=2),
            files_summary=files_summary
        )
        
        return await self._query_llm(prompt, "architecture")
    
    async def analyze_code_quality(
        self,
        files: List[Any],
        static_issues: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Get code quality assessment"""
        if not self.is_available:
            return {"error": "LLM analysis not available", "available": False}
        
        code_samples = self._get_code_samples(files, max_files=5)
        
        prompt = self.PROMPTS["code_quality"].format(
            code_samples=code_samples,
            static_issues=json.dumps(static_issues[:20], indent=2)
        )
        
        return await self._query_llm(prompt, "code_quality")
    
    async def analyze_security(
        self,
        files: List[Any],
        known_vulns: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Get security vulnerability analysis"""
        if not self.is_available:
            return {"error": "LLM analysis not available", "available": False}
        
        # Filter for potentially sensitive files
        security_relevant = [
            f for f in files 
            if any(k in f.path.lower() for k in ['auth', 'login', 'user', 'api', 'route', 'controller'])
        ]
        
        code_samples = self._get_code_samples(security_relevant or files[:5], max_files=5)
        
        prompt = self.PROMPTS["security"].format(
            code_samples=code_samples,
            known_vulns=json.dumps(known_vulns[:10], indent=2)
        )
        
        return await self._query_llm(prompt, "security")
    
    async def analyze_performance(
        self,
        files: List[Any],
        complexity_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get performance optimization suggestions"""
        if not self.is_available:
            return {"error": "LLM analysis not available", "available": False}
        
        code_samples = self._get_code_samples(files, max_files=5)
        
        prompt = self.PROMPTS["performance"].format(
            code_samples=code_samples,
            complexity_data=json.dumps(complexity_data, indent=2)
        )
        
        return await self._query_llm(prompt, "performance")
    
    async def suggest_refactoring(
        self,
        files: List[Any],
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get refactoring suggestions"""
        if not self.is_available:
            return {"error": "LLM analysis not available", "available": False}
        
        code_samples = self._get_code_samples(files, max_files=5)
        
        prompt = self.PROMPTS["refactoring"].format(
            code_samples=code_samples,
            function_count=metrics.get("total_functions", 0),
            class_count=metrics.get("total_classes", 0),
            avg_complexity=metrics.get("average_complexity", 0),
            duplicate_count=metrics.get("duplicate_blocks", 0)
        )
        
        return await self._query_llm(prompt, "refactoring")
    
    async def generate_documentation(
        self,
        files: List[Any],
        project_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate documentation for the repository"""
        if not self.is_available:
            return {"error": "LLM analysis not available", "available": False}
        
        code_samples = self._get_code_samples(files, max_files=10)
        
        prompt = self.PROMPTS["documentation"].format(
            code_samples=code_samples,
            project_info=json.dumps(project_info, indent=2)
        )
        
        return await self._query_llm(prompt, "documentation")
    
    async def full_llm_analysis(
        self,
        files: List[Any],
        static_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run all LLM analyses in parallel"""
        if not self.is_available:
            return {
                "available": False,
                "error": "LLM analysis not available. Set OPENAI_API_KEY in environment.",
            }
        
        structure = static_analysis.get("structure", {})
        bugs = static_analysis.get("bugs", [])
        vulnerabilities = []
        for bug in bugs:
            if bug.get("type") == "security":
                vulnerabilities.append(bug)
        
        complexity_data = {
            "functions": static_analysis.get("summary", {}).get("total_functions", 0),
            "average_complexity": static_analysis.get("summary", {}).get("average_complexity", 0),
        }
        
        metrics = static_analysis.get("summary", {})
        
        # Run analyses in parallel
        results = await asyncio.gather(
            self.analyze_architecture(files, structure),
            self.analyze_code_quality(files, bugs),
            self.analyze_security(files, vulnerabilities),
            self.analyze_performance(files, complexity_data),
            self.suggest_refactoring(files, metrics),
            return_exceptions=True
        )
        
        return {
            "available": True,
            "architecture": results[0] if not isinstance(results[0], Exception) else {"error": str(results[0])},
            "code_quality": results[1] if not isinstance(results[1], Exception) else {"error": str(results[1])},
            "security": results[2] if not isinstance(results[2], Exception) else {"error": str(results[2])},
            "performance": results[3] if not isinstance(results[3], Exception) else {"error": str(results[3])},
            "refactoring": results[4] if not isinstance(results[4], Exception) else {"error": str(results[4])},
        }
    
    async def _query_llm(self, prompt: str, analysis_type: str) -> Dict[str, Any]:
        """Query the LLM and parse JSON response"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert code reviewer and software architect. "
                                   "Analyze code thoroughly and provide actionable insights. "
                                   "Always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON response
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return {
                    "raw_response": content,
                    "parse_error": "Failed to parse JSON response"
                }
                
        except Exception as e:
            return {
                "error": str(e),
                "analysis_type": analysis_type
            }
    
    def _summarize_files(self, files: List[Any], max_files: int = 20) -> str:
        """Create a summary of files in the repository"""
        summary_lines = []
        
        for f in files[:max_files]:
            lines = len(f.content.split('\n'))
            summary_lines.append(f"- {f.path} ({lines} lines)")
        
        if len(files) > max_files:
            summary_lines.append(f"... and {len(files) - max_files} more files")
        
        return '\n'.join(summary_lines)
    
    def _get_code_samples(self, files: List[Any], max_files: int = 5, max_lines: int = 100) -> str:
        """Get code samples from files"""
        samples = []
        
        for f in files[:max_files]:
            lines = f.content.split('\n')[:max_lines]
            truncated = '\n'.join(lines)
            
            if len(f.content.split('\n')) > max_lines:
                truncated += f"\n... ({len(f.content.split(chr(10))) - max_lines} more lines)"
            
            samples.append(f"=== {f.path} ===\n{truncated}")
        
        return '\n\n'.join(samples)


# Convenience function
async def run_llm_analysis(
    files: List[Any],
    static_analysis: Dict[str, Any],
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Run LLM-powered analysis on repository files.
    
    Args:
        files: List of GitHubFile objects
        static_analysis: Results from static analysis
        api_key: OpenAI API key (optional, uses settings if not provided)
        
    Returns:
        Dictionary with LLM analysis results
    """
    analyzer = LLMRepoAnalyzer(api_key)
    return await analyzer.full_llm_analysis(files, static_analysis)
