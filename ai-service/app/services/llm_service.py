from openai import AsyncOpenAI
import httpx
from app.config import settings, ModelConfig
from typing import Optional, Dict, Any


def get_runtime_provider():
    """Get the current runtime provider from main module"""
    try:
        from app.main import get_current_provider
        return get_current_provider()
    except ImportError:
        return settings.ai_provider


# =============================================================================
# PROMPT TEMPLATES
# =============================================================================

PROMPTS = {
    "project_summary": """You are an expert code analyst. Analyze the code and provide a comprehensive project summary.

Return a JSON-structured analysis with:
{
    "title": "Brief descriptive title for the code",
    "purpose": "What this code is designed to do (2-3 sentences)",
    "components": [
        {"name": "component_name", "type": "function|class|module", "purpose": "what it does"}
    ],
    "technologies": ["List of technologies, libraries, or patterns used"],
    "architecture": "Description of the code structure and design patterns",
    "entry_points": ["Main functions or starting points"],
    "dependencies": ["External dependencies or imports"],
    "data_flow": "How data moves through the code"
}

Provide factual analysis only. Be specific and technical.""",

    "function_explanation": """You are an expert code analyst. Provide detailed explanations for each function/method in the code.

For each function, explain:
1. **Purpose** - What does this function do?
2. **Parameters** - What does each parameter represent?
3. **Return Value** - What does it return and why?
4. **Algorithm** - Step-by-step logic
5. **Side Effects** - Any modifications to external state
6. **Usage Example** - How would you call this function?

Format as markdown with clear sections for each function.""",

    "explain": """You are an expert code analyst. Your task is to explain what the given code does in clear, concise terms.
        
Provide:
1. A brief summary of the code's purpose (2-3 sentences)
2. Main functionality breakdown
3. Key components and their roles
4. Any notable patterns or techniques used

Format your response in a clear, readable manner using markdown.""",

    "line_by_line": """You are an expert code analyst. Explain each significant line or block of code.

For each section:
- Show the code snippet
- Explain what it does
- Note any important details

Skip trivial lines (empty lines, just braces) unless they're structurally significant.
Use markdown formatting for clarity.""",

    "bugs": """You are an expert code reviewer specializing in bug detection. Analyze the code for:

1. **Syntax Errors** - Incorrect syntax that would prevent compilation/execution
2. **Logic Errors** - Flaws in the algorithm or logic flow
3. **Runtime Errors** - Issues that would cause crashes (null pointers, division by zero, etc.)
4. **Security Vulnerabilities** - SQL injection, XSS, buffer overflows, etc.
5. **Memory Issues** - Leaks, dangling pointers, uninitialized variables
6. **Edge Cases** - Unhandled scenarios that could cause issues
7. **Type Errors** - Incorrect type usage or conversions
8. **Concurrency Issues** - Race conditions, deadlocks

For each bug found:
- Describe the issue
- Indicate severity (Critical, High, Medium, Low)
- Provide the line number or location
- Explain potential impact
- Suggest a fix

If no bugs are found, state that the code appears clean but mention any areas of concern.""",

    "fix": """You are an expert code reviewer. For any issues in the code:

1. Identify the problem
2. Explain why it's problematic
3. Provide corrected code
4. Explain the fix

If the code is correct but could be improved, suggest those improvements.
Always provide complete, working code examples.
Use markdown with code blocks.""",

    "complexity": """You are an expert algorithm analyst. Analyze the code's complexity:

**Time Complexity:**
- Overall Big O notation
- Best, average, and worst case if applicable
- Identify loops, recursion, and their impact

**Space Complexity:**
- Memory usage Big O notation
- Auxiliary space requirements
- Stack space for recursion

**Performance Analysis:**
- Identify bottlenecks
- Suggest optimizations
- Compare with optimal solutions if applicable

Use clear mathematical notation and explain in simple terms.""",

    "improve": """You are a senior software engineer conducting a code review. Suggest improvements for:

1. **Performance** - Optimize algorithms, reduce redundancy
2. **Readability** - Better naming, structure, comments
3. **Maintainability** - SOLID principles, modularity
4. **Security** - Input validation, secure practices
5. **Best Practices** - Language-specific conventions, patterns
6. **Error Handling** - Proper exception handling
7. **Testing** - Testability improvements

For each suggestion:
- Explain the improvement
- Show before/after code examples
- Indicate priority (High, Medium, Low)

Provide refactored code where appropriate.""",
}


class LLMService:
    def __init__(self):
        self.models = {m.name: m for m in settings.models}
        self.default_model_name = settings.default_model or (settings.models[0].name if settings.models else "")
        
        # Initialize clients for OpenAI if any model uses it
        self.openai_clients = {}
        for m in settings.models:
            if m.provider == "openai":
                api_key = m.apiKey or settings.openai_api_key
                if api_key and api_key != "${OPENAI_API_KEY}":
                    self.openai_clients[m.name] = AsyncOpenAI(api_key=api_key)
    
    def _get_model_config(self, model_name: Optional[str] = None) -> Optional[ModelConfig]:
        """Get model configuration by name or default"""
        name = model_name or self.default_model_name
        return self.models.get(name)

    async def _ollama_completion(
        self,
        model_config: ModelConfig,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
    ) -> str:
        """Make a chat completion request to Ollama"""
        ollama_url = model_config.apiBase or settings.ollama_base_url
        timeout = httpx.Timeout(
            timeout=float(settings.request_timeout) if hasattr(settings, 'request_timeout') else 30.0,
            connect=10.0
        )
        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                response = await client.post(
                    f"{ollama_url}/api/chat",
                    json={
                        "model": model_config.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data.get("message", {}).get("content", "")
            except httpx.ConnectError as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Connection error to Ollama at {ollama_url}: {str(e)}")
                raise ValueError(f"Could not connect to Ollama. Ensure Ollama is running and accessible at {ollama_url}.")
            except httpx.HTTPStatusError as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Ollama returned an error status: {e.response.status_code} - {e.response.text}")
                raise ValueError(f"Ollama returned an error: {e.response.text}")
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error calling Ollama API Make sure Ollama is running. {str(e)}")
                raise ValueError(f"Error calling Ollama API: {str(e)}")
    
    async def _openai_completion(
        self,
        model_config: ModelConfig,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 4096
    ) -> str:
        """Make a chat completion request to OpenAI with timeout"""
        client = self.openai_clients.get(model_config.name)
        if not client:
            # Fallback to default client if possible
            if settings.openai_api_key:
                client = AsyncOpenAI(api_key=settings.openai_api_key)
            else:
                raise ValueError(f"No API key for OpenAI model {model_config.name}")

        timeout_value = float(settings.openai_timeout) if hasattr(settings, 'openai_timeout') else 30.0
        
        response = await client.chat.completions.create(
            model=model_config.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=timeout_value,
        )
        return response.choices[0].message.content
    
    async def _chat_completion(
        self, 
        system_prompt: str, 
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        model_name: Optional[str] = None
    ) -> str:
        """Make a chat completion request to the configured provider"""
        model_config = self._get_model_config(model_name)
        
        if not model_config:
            # Fallback to old behavior if no models configured
            current_provider = get_runtime_provider().lower()
            if current_provider == "openai":
                # Create a temporary model config for default behavior
                temp_config = ModelConfig(
                    name="default-openai",
                    provider="openai",
                    model=settings.openai_model
                )
                return await self._openai_completion(temp_config, system_prompt, user_prompt, temperature, max_tokens)
            else:
                temp_config = ModelConfig(
                    name="default-ollama",
                    provider="ollama",
                    model=settings.ollama_model
                )
                return await self._ollama_completion(temp_config, system_prompt, user_prompt, temperature)
        
        if model_config.provider == "openai":
            return await self._openai_completion(model_config, system_prompt, user_prompt, temperature, max_tokens)
        else:
            return await self._ollama_completion(model_config, system_prompt, user_prompt, temperature)

    async def get_project_summary(self, code: str, language: str) -> Dict[str, Any]:
        """Get a comprehensive project summary of the code"""
        user_prompt = f"""Analyze this {language} code and provide a project summary:

```{language}
{code}
```"""
        
        result = await self._chat_completion(PROMPTS["project_summary"], user_prompt)
        import json
        try:
            # Extract JSON block if it's wrapped in markdown
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0]
            elif "```" in result:
                result = result.split("```")[1].split("```")[0]
            return json.loads(result)
        except json.JSONDecodeError:
            return {"title": "Project Summary", "content": result}

    async def explain_functions(self, code: str, language: str) -> str:
        """Get detailed explanations for each function in the code"""
        user_prompt = f"""Explain each function/method in this {language} code:

```{language}
{code}
```"""
        
        return await self._chat_completion(PROMPTS["function_explanation"], user_prompt)
    
    async def explain_code(self, code: str, language: str) -> str:
        """Get a high-level explanation of what the code does"""
        user_prompt = f"""Please explain the following {language} code:

```{language}
{code}
```"""
        
        return await self._chat_completion(PROMPTS["explain"], user_prompt)
    
    async def line_by_line_analysis(self, code: str, language: str) -> str:
        """Get line-by-line explanation of the code"""
        user_prompt = f"""Please provide a line-by-line analysis of this {language} code:

```{language}
{code}
```"""
        
        return await self._chat_completion(PROMPTS["line_by_line"], user_prompt)
    
    async def detect_bugs(self, code: str, language: str) -> str:
        """Detect potential bugs in the code"""
        user_prompt = f"""Please analyze this {language} code for bugs:

```{language}
{code}
```"""
        
        return await self._chat_completion(PROMPTS["bugs"], user_prompt)
    
    async def suggest_fixes(self, code: str, language: str) -> str:
        """Get fix suggestions for the code"""
        user_prompt = f"""Please analyze this {language} code and provide fix suggestions:

```{language}
{code}
```"""
        
        return await self._chat_completion(PROMPTS["fix"], user_prompt)
    
    async def analyze_complexity(self, code: str, language: str) -> str:
        """Analyze time and space complexity"""
        user_prompt = f"""Please analyze the time and space complexity of this {language} code:

```{language}
{code}
```"""
        
        return await self._chat_completion(PROMPTS["complexity"], user_prompt)
    
    async def improve_code(self, code: str, language: str) -> str:
        """Get code improvement suggestions"""
        user_prompt = f"""Please review this {language} code and suggest improvements:

```{language}
{code}
```"""
        
        return await self._chat_completion(PROMPTS["improve"], user_prompt)

    async def full_analysis(self, code: str, language: str) -> Dict[str, Any]:
        """Perform comprehensive analysis combining all analysis types"""
        import asyncio
        
        # Run all analyses in parallel
        results = await asyncio.gather(
            self.get_project_summary(code, language),
            self.explain_functions(code, language),
            self.detect_bugs(code, language),
            self.suggest_fixes(code, language),
            self.analyze_complexity(code, language),
            self.improve_code(code, language),
            return_exceptions=True
        )
        
        return {
            "project_summary": results[0] if not isinstance(results[0], Exception) else str(results[0]),
            "function_explanations": results[1] if not isinstance(results[1], Exception) else str(results[1]),
            "bugs": results[2] if not isinstance(results[2], Exception) else str(results[2]),
            "fixes": results[3] if not isinstance(results[3], Exception) else str(results[3]),
            "complexity": results[4] if not isinstance(results[4], Exception) else str(results[4]),
            "improvements": results[5] if not isinstance(results[5], Exception) else str(results[5]),
        }
