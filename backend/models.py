from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

# Supported chat message roles
ChatRole = Literal["user", "assistant"]

# Permitted section keys for the seven-section research plan
PlanSectionKey = Literal[
    "research_question",
    "hypothesis",
    "variables",
    "methodology",
    "data_requirements",
    "analysis_plan",
    "limitations",
]

class ChatMessage(BaseModel):
    role: ChatRole
    content: str = Field(min_length=1, description="Message text content")

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    message: str
    ready_for_plan: bool = False

class ResearchPlan(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    research_question: str = Field(
        min_length=1, description="Primary research question"
    )
    hypothesis: str = Field(
        min_length=1, description="Testable hypothesis or central proposition"
    )
    variables: str = Field(
        min_length=1,
        description="Key independent, dependent, and controlled variables",
    )
    methodology: str = Field(
        min_length=1,
        description="Study design (e.g. experimental, survey, observational)",
    )
    data_requirements: str = Field(
        min_length=1,
        description="Data sources, collection method, and sample specifications",
    )
    analysis_plan: str = Field(
        min_length=1,
        description="Techniques or statistical tools to analyze findings",
    )
    limitations: str = Field(
        min_length=1,
        description="Known boundaries, unresolved assumptions, and potential risks",
    )

class PlanGenerateRequest(BaseModel):
    messages: List[ChatMessage]

class APIErrorResponse(BaseModel):
    detail: str
    code: Literal["RATE_LIMIT_EXCEEDED", "UPSTREAM_TIMEOUT", "VALIDATION_ERROR", "SERVER_ERROR"]
    retry_after_seconds: Optional[int] = None
