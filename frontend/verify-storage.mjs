import assert from 'node:assert/strict';
import {
  STORAGE_KEYS,
  PLAN_SECTION_KEYS,
  loadMessages,
  saveMessages,
  loadPlan,
  savePlan,
  loadStage,
  saveStage,
  loadModifiedSections,
  saveModifiedSections,
  loadSessionState,
  clearSessionState,
} from './src/services/storage.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

// 1. Valid round-trips
saveMessages([
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
]);
assert.equal(loadMessages().length, 2);

const validPlan = Object.fromEntries(
  PLAN_SECTION_KEYS.map((k) => [k, 'Valid ' + k])
);
savePlan(validPlan);
assert.deepEqual(loadPlan(), validPlan);

saveStage('review');
assert.equal(loadStage(), 'review');

saveModifiedSections(['research_question', 'methodology']);
assert.deepEqual(loadModifiedSections(), ['research_question', 'methodology']);

// 2. Partial message recovery + corrupt backup
store.clear();
store.set(
  STORAGE_KEYS.MESSAGES,
  JSON.stringify([
    { role: 'user', content: 'Valid user msg' },
    { role: 'invalid_role', content: 'Bad role' },
    { role: 'assistant', content: '' },
    { role: 'assistant', content: 'Valid assistant msg' },
  ])
);
const recoveredMsgs = loadMessages();
assert.equal(recoveredMsgs.length, 2);
assert.deepEqual(recoveredMsgs, [
  { role: 'user', content: 'Valid user msg' },
  { role: 'assistant', content: 'Valid assistant msg' },
]);
assert.ok(store.get(STORAGE_KEYS.RAW_CORRUPT_DATA) !== null);
const firstBackup = store.get(STORAGE_KEYS.RAW_CORRUPT_DATA);

// 3. Corrupt plan does not break valid messages, and does not overwrite existing corrupt backup
store.set(STORAGE_KEYS.PLAN, '{bad json');
const state1 = loadSessionState();
assert.equal(state1.messages.length, 2);
assert.equal(state1.plan, null);
assert.equal(state1.stage, 'chat');
assert.equal(store.get(STORAGE_KEYS.RAW_CORRUPT_DATA), firstBackup);

// 4. Corrupt messages do not break valid plan + modified-section validation
store.clear();
savePlan(validPlan);
store.set(
  STORAGE_KEYS.MODIFIED_SECTIONS,
  JSON.stringify(['methodology', 'invalid_key', 123])
);
store.set(STORAGE_KEYS.MESSAGES, 'not-json');
const state2 = loadSessionState();
assert.deepEqual(state2.messages, []);
assert.deepEqual(state2.plan, validPlan);
assert.deepEqual(state2.modifiedSections, ['methodology']);
assert.ok(store.get(STORAGE_KEYS.RAW_CORRUPT_DATA) !== null);

// 5. Start Fresh clears active keys while preserving researchpilot_raw_corrupt_data
clearSessionState();
assert.equal(store.has(STORAGE_KEYS.MESSAGES), false);
assert.equal(store.has(STORAGE_KEYS.PLAN), false);
assert.equal(store.has(STORAGE_KEYS.STAGE), false);
assert.equal(store.has(STORAGE_KEYS.MODIFIED_SECTIONS), false);
assert.ok(store.get(STORAGE_KEYS.RAW_CORRUPT_DATA) !== null);

console.log('ALL_STORAGE_TESTS_PASSED');
