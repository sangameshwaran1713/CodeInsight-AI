from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from typing import List, Literal, Optional, Dict, Any
import os
import yaml


class ModelConfig(BaseModel):
    name: str
    provider: str
    model: str
    apiBase: Optional[str] = None
    apiKey: Optional[str] = None


class AntiGravitySettings(BaseModel):
    enabled: bool = False
    gravity_field_strength: float = 0.0
    counter_force: str = "auto"
    stabilization: bool = True
    override_other_modules: bool = False
    isolated_execution: bool = True


class Settings(BaseSettings):
    # App settings
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"  # Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL
    environment: str = "development"  # Environment: development, staging, production
    
    # AI Provider settings - switch between "openai" and "ollama"
    ai_provider: str = "ollama"  # Options: "openai", "ollama"
    
    # OpenAI settings
    openai_api_key: str = ""
    openai_model: str = "gpt-3.5-turbo"
    
    # Ollama settings
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"  # Default model, can be codellama, mistral, etc.
    
    # Multi-model settings
    models: List[ModelConfig] = []
    default_model: str = ""
    tab_autocomplete_model: Optional[ModelConfig] = None
    
    # Anti-gravity settings
    anti_gravity: AntiGravitySettings = Field(default_factory=AntiGravitySettings)
    
    # GitHub API settings
    github_token: str = ""
    
    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60
    
    # CORS
    cors_origins_str: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:5000,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002"
    
    # Timeouts
    request_timeout: int = 30
    openai_timeout: int = 30
    
    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins_str.split(",")]
    
    @property
    def is_ollama(self) -> bool:
        return self.ai_provider.lower() == "ollama"
    
    @property
    def is_openai(self) -> bool:
        return self.ai_provider.lower() == "openai"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


def load_settings() -> Settings:
    # Load base settings from environment
    s = Settings()
    
    # Check for config.yaml
    yaml_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.yaml")
    if os.path.exists(yaml_path):
        try:
            with open(yaml_path, 'r') as f:
                config_data = yaml.safe_load(f)
                
                # Parse models
                if "models" in config_data:
                    s.models = [ModelConfig(**m) for m in config_data["models"]]
                
                if "defaultModel" in config_data:
                    s.default_model = config_data["defaultModel"]
                
                # Parse tab autocomplete model
                if "tabAutocompleteModel" in config_data:
                    auto_config = config_data["tabAutocompleteModel"]
                    if "name" not in auto_config:
                        auto_config["name"] = "tab-autocomplete"
                    s.tab_autocomplete_model = ModelConfig(**auto_config)
                
                # Parse anti-gravity
                if "ai_integration" in config_data:
                    ai = config_data["ai_integration"]
                    if ai.get("module") == "anti_gravity":
                        params = ai.get("parameters", {})
                        safety = ai.get("safety", {})
                        s.anti_gravity = AntiGravitySettings(
                            enabled=ai.get("enabled", False),
                            gravity_field_strength=params.get("gravity_field_strength", 0.0),
                            counter_force=params.get("counter_force", "auto"),
                            stabilization=params.get("stabilization", True),
                            override_other_modules=safety.get("override_other_modules", False),
                            isolated_execution=safety.get("isolated_execution", True)
                        )
        except Exception as e:
            # Let's print more detail and perhaps use logging
            import traceback
            print(f"[ERROR] Failed to load config.yaml: {e}")
            traceback.print_exc()
            
    return s


settings = load_settings()
