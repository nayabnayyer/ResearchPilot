# ResearchPilot

ResearchPilot is a locally run academic research ideation mentor for university students. It guides students from rough curiosity to a structured study design through a one-question-at-a-time mentoring chat, then synthesizes the dialogue into a seven-section research plan.

---

## Current Features

- **One-Question-at-a-Time Mentoring Chat**: Uses a system-prompted AI mentor (`POST /api/chat`) designed to ask a single focused follow-up question per turn, explain methodological concepts in plain language, and challenge broad or untested assumptions without fabricating academic citations.
- **Starter Prompts**: Provides three sample ideation prompts on the welcome screen to populate the chat input.
- **Plan Readiness Signaling**:
  - Plan generation is enabled in the UI after at least one complete exchange (`messages.length >= 2` where the latest message is from `assistant`).
  - The action banner switches to a highlighted **"Ready for your research plan"** state when the backend detects the `[READY_FOR_PLAN]` marker in the mentor's reply or when the conversation reaches 4 complete exchanges (8 messages on the frontend; `len(messages) >= 8` on the backend request).
- **Seven-Section Research Plan Synthesis**: Synthesizes the conversation transcript via Groq JSON object mode (`POST /api/plan/generate`) into a Pydantic-validated seven-section plan. Prompt instructions direct the model to respect explicit student decisions chronologically and label undecided items with markers such as `"Unresolved: ..."` or `"To be determined: ..."`.
- **Heuristic "Needs clarification" Badges**: Each section card evaluates a frontend regex heuristic (`hasUnresolvedContent(text, sectionKey)` in `PlanSectionCard.jsx`) to display a **Needs clarification** badge:
  - Always flags empty, whitespace-only, or non-string content.
  - Never flags non-empty **Limitations** content so normal discussion of validity threats or unresolved assumptions is not treated as a missing decision.
  - Flags **Data Requirements** and **Analysis Plan** when explicit unresolved marker phrases (`Unresolved`, `To be determined`, `to be finalized`, `TBD`, `not yet decided`, etc.) appear anywhere in the section text.
  - Flags **Research Question**, **Hypothesis**, **Variables**, and **Methodology** only when the opening statement or a core variable label (`Independent/Dependent/Primary/Core/Outcome/Predictor variable:`) uses an explicit unresolved marker, avoiding false positives when only secondary details (such as control variables or survey platform) remain open. Because this is a marker-based regex heuristic over free-form LLM text, it cannot detect indecision phrased without recognizable markers.
- **Local Session Persistence & Corrupt-Data Backup**: Persists confirmed state in browser `localStorage` once in-flight requests finish and the last message is from `assistant`:
  - Active keys: `researchpilot_messages`, `researchpilot_plan`, `researchpilot_stage`, and `researchpilot_modified_sections`.
  - Independent key recovery: `loadSessionState()` validates each key independently; if a stored value is malformed JSON or fails validation, `backupCorruptData()` saves the first encountered corrupt payload to `researchpilot_raw_corrupt_data` (if not already occupied) and falls back to safe defaults.
  - Session reset: Clicking **Start Fresh** clears the four active session keys while preserving `researchpilot_raw_corrupt_data`.
- **Non-Destructive Error Handling & Retry**: API requests use a 30-second client timeout (`AbortController`). If a chat turn fails, the unsent message text is restored to the input box and the conversation reverts to the last confirmed turn; if plan generation fails, existing messages, saved plans, and the current view stage remain intact. An inline **Retry** button re-runs the last failed action.

---

## Seven-Section Research Plan Schema

Generated plans are validated on both the backend (`ResearchPlan` in `backend/models.py`, which strips whitespace and requires `min_length=1` for every field) and the frontend (`isValidPlan` in `frontend/src/services/storage.js`):

| # | UI Title | JSON Key | Description |
| :- | :--- | :--- | :--- |
| 1 | **Research Question** | `research_question` | Primary research question derived from the conversation. |
| 2 | **Hypothesis** | `hypothesis` | Testable hypothesis, directional expectation, or central proposition. |
| 3 | **Variables** | `variables` | Independent, dependent, and potential control/confounding variables. |
| 4 | **Methodology** | `methodology` | Proposed study design and research approach. |
| 5 | **Data Requirements** | `data_requirements` | Participants, data sources, instruments, eligibility, sample size, and collection procedures. |
| 6 | **Analysis Plan** | `analysis_plan` | Analytical or statistical techniques for examining the collected data. |
| 7 | **Limitations** | `limitations` | Methodological boundaries, design trade-offs, threats to validity, and practical constraints. |

---

## Technology Stack

### Frontend
- **React** (`^18.3.1`) & **React DOM** (`^18.3.1`)
- **Vite** (`^5.4.0`) with `@vitejs/plugin-react` (`^4.3.0`)
- **Tailwind CSS** (`^3.4.10`), **PostCSS** (`^8.4.40`), & **Autoprefixer** (`^10.4.20`)
- **Lucide React** (`^0.400.0`)
- **Browser `localStorage`**

### Backend
- **FastAPI** (`>=0.115.0,<1.0.0`)
- **Uvicorn** (`uvicorn[standard]>=0.32.0,<1.0.0`)
- **Pydantic** (`>=2.9.0,<3.0.0`)
- **Groq Python SDK** (`>=1.7.0,<2.0.0`)
- **python-dotenv** (`>=1.0.1,<2.0.0`)

---

## Project Structure

```text
ResearchPilot/
├── backend/
│   ├── gemini_service.py   # Legacy filename; implements Groq SDK client, prompts, and LLM calls
│   ├── main.py             # FastAPI application, CORS middleware, and API endpoints
│   ├── models.py           # Pydantic request/response and ResearchPlan schemas
│   └── requirements.txt    # Python backend package dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatView.jsx         # Mentoring chat view and plan generation banner
│   │   │   ├── ErrorBanner.jsx      # Error alert with Retry action
│   │   │   ├── Header.jsx           # Sticky top bar and "Start Fresh" session reset
│   │   │   ├── PlanReviewView.jsx   # Seven-section plan review and regeneration view
│   │   │   ├── PlanSectionCard.jsx  # Section card and "Needs clarification" badge heuristic
│   │   │   └── WelcomeHero.jsx      # Welcome screen and starter prompts
│   │   ├── services/
│   │   │   ├── api.js               # Fetch helpers for /api/health, /api/chat, /api/plan/generate
│   │   │   └── storage.js           # localStorage persistence, validation, and corrupt-data backup
│   │   ├── App.jsx                  # Root state management and view routing
│   │   ├── index.css                # Tailwind CSS directives
│   │   └── main.jsx                 # React DOM entry point
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js               # Dev server on port 5173 proxying /api to http://localhost:8000
└── README.md
```

---

## Prerequisites

- **Python**: Python 3.10+ (developed and verified with Python 3.11)
- **Node.js & npm**: Node.js 18+ and npm (required by Vite 5)
- **Groq API Key**: A valid API key from Groq

---

## Setup & Installation (Windows PowerShell)

### 1. Clone the Repository

```powershell
git clone <repository-url>
cd ResearchPilot
```

### 2. Backend Virtual Environment & Dependencies

From the `ResearchPilot` repository root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..
```

### 3. Backend Environment Configuration

Create a `.env` file at `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

- `GROQ_API_KEY` *(required)*: Your Groq API key. Missing values or placeholder strings (`your_groq_api_key_here`, `your_gemini_api_key_here`) raise a configuration error (`503 Service Unavailable`).
- `GROQ_MODEL` *(optional)*: Model identifier passed to Groq Chat Completions. Defaults to `openai/gpt-oss-120b` if omitted or empty.

### 4. Frontend Dependencies

From the `ResearchPilot` repository root:

```powershell
cd frontend
npm install
cd ..
```

---

## Running Locally (Two PowerShell Terminals)

Run the backend and frontend simultaneously in separate PowerShell terminals starting from the `ResearchPilot` repository root.

### Terminal 1 — Start the FastAPI Backend (Port `8000`)

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2 — Start the Vite Frontend (Port `5173`)

```powershell
cd frontend
npm run dev
```

Open **`http://localhost:5173`** (or `http://127.0.0.1:5173`) in your browser. Vite's dev server proxies `/api` requests to `http://localhost:8000`, and the backend CORS configuration permits `http://localhost:5173` and `http://127.0.0.1:5173`.

---

## Backend API Reference

| Method | Path | Request Body | Success Response (`200 OK`) | Error Statuses |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | *None* | `{ "status": "ok", "service": "ResearchPilot API", "model": "<GROQ_MODEL>" }` | — |
| `POST` | `/api/chat` | `{ "messages": [{ "role": "user" \| "assistant", "content": "<non-empty str>" }] }` | `{ "message": "<str>", "ready_for_plan": <bool> }` | `400`, `429`, `500`, `502`, `503` |
| `POST` | `/api/plan/generate` | `{ "messages": [{ "role": "user" \| "assistant", "content": "<non-empty str>" }] }` | Seven-section `ResearchPlan` JSON object | `400`, `429`, `500`, `502`, `503` |

All error responses return `{ "detail": "<message>" }`.

---

## Troubleshooting

- **`503 Service Unavailable` ("AI service configuration is unavailable.")**:
  Check that `backend/.env` exists and `GROQ_API_KEY` is set to a real key rather than a placeholder. `get_client()` and `get_model_name()` call `load_dotenv(dotenv_path=ENV_PATH, override=True)` on each request, so updating a value in `backend/.env` takes effect on the next request (if you delete a variable from `backend/.env` entirely, restart the Uvicorn process to clear it from the process environment).
- **`429 Too Many Requests` ("Groq API rate limit reached. Please pause for a moment before retrying.")**:
  Wait briefly and click **Retry** in the UI error banner.
- **`502 Bad Gateway` on Plan Generation**:
  Returned if the upstream Groq response fails Pydantic validation against the seven-section `ResearchPlan` schema or if Groq returns an upstream API error. Click **Retry** or **Regenerate Plan** to try again without losing your conversation history.
- **Clearing Saved Browser State**:
  Click **Start Fresh** in the header to remove active session keys from `localStorage`.
