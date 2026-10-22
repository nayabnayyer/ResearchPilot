/**
 * Proportionate localStorage helper with safe JSON parsing, validation,
 * independent key recovery, and corrupt-data backup.
 */

export const STORAGE_KEYS = {
  MESSAGES: 'researchpilot_messages',
  PLAN: 'researchpilot_plan',
  STAGE: 'researchpilot_stage',
  MODIFIED_SECTIONS: 'researchpilot_modified_sections',
  RAW_CORRUPT_DATA: 'researchpilot_raw_corrupt_data',
};

export const VALID_ROLES = ['user', 'assistant'];

export const VALID_STAGES = ['welcome', 'chat', 'review'];

export const PLAN_SECTION_KEYS = [
  'research_question',
  'hypothesis',
  'variables',
  'methodology',
  'data_requirements',
  'analysis_plan',
  'limitations',
];

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore storage access errors (e.g. privacy mode restrictions)
  }
  return null;
}

/**
 * Saves a single copy of malformed/corrupt raw data to researchpilot_raw_corrupt_data
 * ONLY if that key is not already occupied, preventing overwrites of earlier recoverable data.
 */
export function backupCorruptData(sourceKey, rawValue) {
  const storage = getStorage();
  if (!storage) return false;

  try {
    const existingBackup = storage.getItem(STORAGE_KEYS.RAW_CORRUPT_DATA);
    if (existingBackup !== null) {
      return false;
    }
    const backupPayload = JSON.stringify({
      sourceKey,
      rawValue,
      backedUpAt: new Date().toISOString(),
    });
    storage.setItem(STORAGE_KEYS.RAW_CORRUPT_DATA, backupPayload);
    return true;
  } catch {
    console.warn('ResearchPilot storage warning: unable to back up corrupt storage entry.');
    return false;
  }
}

export function isValidMessage(msg) {
  return (
    Boolean(msg) &&
    typeof msg === 'object' &&
    !Array.isArray(msg) &&
    VALID_ROLES.includes(msg.role) &&
    typeof msg.content === 'string' &&
    msg.content.trim().length > 0
  );
}

export function isValidPlan(plan) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    return false;
  }
  return PLAN_SECTION_KEYS.every(
    (key) => typeof plan[key] === 'string' && plan[key].trim().length > 0
  );
}

export function loadMessages() {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEYS.MESSAGES);
    if (raw === null || raw === undefined) {
      return [];
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      backupCorruptData(STORAGE_KEYS.MESSAGES, raw);
      return [];
    }

    if (!Array.isArray(parsed)) {
      backupCorruptData(STORAGE_KEYS.MESSAGES, raw);
      return [];
    }

    const validMessages = parsed
      .filter(isValidMessage)
      .map((m) => ({ role: m.role, content: m.content }));

    if (validMessages.length !== parsed.length) {
      backupCorruptData(STORAGE_KEYS.MESSAGES, raw);
    }

    return validMessages;
  } catch {
    return [];
  }
}

export function saveMessages(messages) {
  const storage = getStorage();
  if (!storage || !Array.isArray(messages)) return false;

  try {
    const validMessages = messages
      .filter(isValidMessage)
      .map((m) => ({ role: m.role, content: m.content }));
    storage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(validMessages));
    return true;
  } catch {
    console.warn('ResearchPilot storage warning: failed to persist conversation messages.');
    return false;
  }
}

export function loadPlan() {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEYS.PLAN);
    if (raw === null || raw === undefined || raw === 'null') {
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      backupCorruptData(STORAGE_KEYS.PLAN, raw);
      return null;
    }

    if (parsed === null) {
      return null;
    }

    if (!isValidPlan(parsed)) {
      backupCorruptData(STORAGE_KEYS.PLAN, raw);
      return null;
    }

    const normalizedPlan = {};
    for (const key of PLAN_SECTION_KEYS) {
      normalizedPlan[key] = parsed[key];
    }
    return normalizedPlan;
  } catch {
    return null;
  }
}

export function savePlan(plan) {
  const storage = getStorage();
  if (!storage) return false;

  try {
    if (plan === null || plan === undefined) {
      storage.removeItem(STORAGE_KEYS.PLAN);
      return true;
    }
    if (!isValidPlan(plan)) {
      return false;
    }
    const normalizedPlan = {};
    for (const key of PLAN_SECTION_KEYS) {
      normalizedPlan[key] = plan[key];
    }
    storage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(normalizedPlan));
    return true;
  } catch {
    console.warn('ResearchPilot storage warning: failed to persist research plan.');
    return false;
  }
}

export function loadStage(fallbackStage = 'welcome') {
  const storage = getStorage();
  if (!storage) return fallbackStage;

  try {
    const raw = storage.getItem(STORAGE_KEYS.STAGE);
    if (raw === null || raw === undefined) {
      return fallbackStage;
    }

    let candidate = raw;
    if (raw.startsWith('"') && raw.endsWith('"')) {
      try {
        candidate = JSON.parse(raw);
      } catch {
        backupCorruptData(STORAGE_KEYS.STAGE, raw);
        return fallbackStage;
      }
    }

    if (typeof candidate === 'string' && VALID_STAGES.includes(candidate)) {
      return candidate;
    }

    backupCorruptData(STORAGE_KEYS.STAGE, raw);
    return fallbackStage;
  } catch {
    return fallbackStage;
  }
}

export function saveStage(stage) {
  const storage = getStorage();
  if (!storage || !VALID_STAGES.includes(stage)) return false;

  try {
    storage.setItem(STORAGE_KEYS.STAGE, stage);
    return true;
  } catch {
    console.warn('ResearchPilot storage warning: failed to persist session stage.');
    return false;
  }
}

export function loadModifiedSections() {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEYS.MODIFIED_SECTIONS);
    if (raw === null || raw === undefined) {
      return [];
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      backupCorruptData(STORAGE_KEYS.MODIFIED_SECTIONS, raw);
      return [];
    }

    if (!Array.isArray(parsed)) {
      backupCorruptData(STORAGE_KEYS.MODIFIED_SECTIONS, raw);
      return [];
    }

    const validKeys = parsed.filter(
      (key) => typeof key === 'string' && PLAN_SECTION_KEYS.includes(key)
    );

    if (validKeys.length !== parsed.length) {
      backupCorruptData(STORAGE_KEYS.MODIFIED_SECTIONS, raw);
    }

    return validKeys;
  } catch {
    return [];
  }
}

export function saveModifiedSections(sections) {
  const storage = getStorage();
  if (!storage || !Array.isArray(sections)) return false;

  try {
    const validKeys = sections.filter(
      (key) => typeof key === 'string' && PLAN_SECTION_KEYS.includes(key)
    );
    storage.setItem(STORAGE_KEYS.MODIFIED_SECTIONS, JSON.stringify(validKeys));
    return true;
  } catch {
    console.warn('ResearchPilot storage warning: failed to persist modified sections.');
    return false;
  }
}

/**
 * Loads all persisted session keys independently so corruption in one key
 * never prevents recovery of valid data in other keys.
 */
export function loadSessionState() {
  const messages = loadMessages();
  const plan = loadPlan();
  const modifiedSections = loadModifiedSections();
  const defaultStage = messages.length > 0 ? 'chat' : 'welcome';
  let stage = loadStage(defaultStage);

  if (stage === 'review' && !plan) {
    stage = messages.length > 0 ? 'chat' : 'welcome';
  } else if (stage === 'chat' && messages.length === 0) {
    stage = 'welcome';
  } else if (stage === 'welcome' && messages.length > 0) {
    stage = 'chat';
  }

  return {
    messages,
    plan,
    stage,
    modifiedSections,
  };
}

/**
 * Clears active session keys while preserving researchpilot_raw_corrupt_data.
 */
export function clearSessionState() {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.removeItem(STORAGE_KEYS.MESSAGES);
    storage.removeItem(STORAGE_KEYS.PLAN);
    storage.removeItem(STORAGE_KEYS.STAGE);
    storage.removeItem(STORAGE_KEYS.MODIFIED_SECTIONS);
    return true;
  } catch {
    console.warn('ResearchPilot storage warning: failed to clear session state.');
    return false;
  }
}
