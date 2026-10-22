from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from groq import APIError, RateLimitError
from pydantic import ValidationError
from models import (
    ChatRequest,
    ChatResponse,
    PlanGenerateRequest,
    ResearchPlan,
    APIErrorResponse,
)
from gemini_service import (
    generate_chat_response,
    generate_research_plan,
    get_model_name,
)

app = FastAPI(
    title="ResearchPilot API",
    description="Backend service powering ResearchPilot guided research mentorship",
    version="0.1.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """Simple healthcheck confirming API readiness and model target."""
    return {
        "status": "ok",
        "service": "ResearchPilot API",
        "model": get_model_name()
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_turn(request: ChatRequest):
    """
    Handles a conversational turn between the student and ResearchPilot mentor.
    Calls Groq and returns the next single question/challenge.
    """
    if not request.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat history cannot be empty."
        )

    try:
        reply_text, is_ready = generate_chat_response(request.messages)
        if not reply_text or not reply_text.strip():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Groq API returned an empty response. Please try again."
            )
        return ChatResponse(
            message=reply_text.strip(),
            ready_for_plan=is_ready
        )
    except HTTPException:
        raise
    except ValueError:
        # Missing or unconfigured API key
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service configuration is unavailable."
        )
    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Groq API rate limit reached. Please pause for a moment before retrying."
        )
    except APIError as api_err:
        # Check for rate limiting (429) or other Groq API errors
        status_code = getattr(api_err, "status_code", None)
        err_msg = str(api_err)
        if status_code == 429 or "429" in err_msg or "rate_limit" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Groq API rate limit reached. Please pause for a moment before retrying."
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq API error ({type(api_err).__name__})."
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the chat request."
        )

@app.post("/api/plan/generate", response_model=ResearchPlan)
async def plan_generate(request: PlanGenerateRequest):
    """
    Synthesizes the conversation history into a validated seven-section ResearchPlan.
    """
    if not request.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation history cannot be empty."
        )

    try:
        return generate_research_plan(request.messages)
    except HTTPException:
        raise
    except ValueError:
        # Missing or unconfigured API key
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service configuration is unavailable."
        )
    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Groq API rate limit reached. Please pause for a moment before retrying."
        )
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Generated research plan did not match the required seven-section structure. Please try again."
        )
    except APIError as api_err:
        # Check for rate limiting (429) or other Groq API errors
        status_code = getattr(api_err, "status_code", None)
        err_msg = str(api_err)
        if status_code == 429 or "429" in err_msg or "rate_limit" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Groq API rate limit reached. Please pause for a moment before retrying."
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq API error ({type(api_err).__name__})."
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating the research plan."
        )
