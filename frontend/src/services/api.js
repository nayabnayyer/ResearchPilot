/**
 * API service communicating with the FastAPI backend.
 */

const API_TIMEOUT_MS = 30000;

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ''
).replace(/\/$/, '');

export async function checkBackendHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendChatMessage(messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorDetail = 'Failed to communicate with ResearchPilot.';

      try {
        const errorJson = await response.json();

        if (errorJson.detail) {
          errorDetail = errorJson.detail;
        }
      } catch {
        errorDetail = `Server responded with status ${response.status}: ${response.statusText}`;
      }

      const error = new Error(errorDetail);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutError = new Error(
        'Request timed out. Please check your connection and try again.'
      );
      timeoutError.status = 504;
      throw timeoutError;
    }

    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateResearchPlan(messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/plan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorDetail = 'Failed to generate research plan.';

      try {
        const errorJson = await response.json();

        if (errorJson.detail) {
          errorDetail = errorJson.detail;
        }
      } catch (parseErr) {
        if (parseErr?.name === 'AbortError') {
          throw parseErr;
        }

        errorDetail = `Server responded with status ${response.status}: ${response.statusText}`;
      }

      const error = new Error(errorDetail);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutError = new Error(
        'Plan generation timed out. Please check your connection and try again.'
      );
      timeoutError.status = 504;
      throw timeoutError;
    }

    throw err;
  } finally {
    clearTimeout(timer);
  }
}
