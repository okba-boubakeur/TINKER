/**
 * TINKER Task Queue Engine
 * Parses all @run:, @install:, @uninstall: commands from AI responses
 * and executes them sequentially with real-time progress callbacks.
 */

/**
 * Parse all commands from a text blob or a plan block.
 * Preserves the original order they appear in the text.
 * Returns an array of task objects: { type, key, label }
 */
export function parseCommands(text) {
  const tasks = [];
  // Single pass regex — captures all three command types in document order
  const cmdRegex = /@(run|install|uninstall):([\w.-]+)/g;
  let m;
  while ((m = cmdRegex.exec(text)) !== null) {
    const [, type, key] = m;
    const label =
      type === 'run'       ? `Apply tweak: ${key}` :
      type === 'install'   ? `Install: ${key}`      :
                             `Uninstall: ${key}`;
    tasks.push({ type, key, label });
  }
  return tasks;
}

/**
 * Execute a queue of tasks sequentially.
 * @param {Array}    tasks      - Array from parseCommands()
 * @param {Function} invoker    - async (type, key) => void  (calls Tauri invoke)
 * @param {Function} onProgress - (taskIndex, status, message) => void
 */
export async function executeTaskQueue(tasks, invoker, onProgress) {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    onProgress(i, 'running', `Working: ${task.label}...`);
    try {
      await invoker(task.type, task.key);
      onProgress(i, 'done', `Success: ${task.label}`);
    } catch (err) {
      onProgress(i, 'error', `Failed: ${task.label} — ${err?.message || err}`);
      // Continue to next task even on failure
    }
  }
}

/**
 * Extract a ```plan ... ``` block from AI response text.
 * Returns the raw content inside the block, or null if not found.
 */
export function extractPlanBlock(text) {
  const match = text.match(/```plan[\s\r\n]+([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

/**
 * Detect if a setup-wizard block is present.
 */
export function hasSetupWizard(text) {
  return /```setup-wizard[\s\S]*?```/.test(text);
}

/**
 * Strip all command tags and plan blocks from display text
 * so they don't show as raw text in the UI.
 */
export function stripCommandTags(text) {
  return text
    .replace(/```plan[\s\S]*?```/g, '')
    .replace(/```setup-wizard[\s\S]*?```/g, '')
    .replace(/@run:[\w.-]+/g, '')
    .replace(/@install:[\w.-]+/g, '')
    .replace(/@uninstall:[\w.-]+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
