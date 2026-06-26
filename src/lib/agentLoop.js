import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { invoke } from '@tauri-apps/api/core';

function getProvider(providerName, apiKey) {
  if (providerName === 'google') return createGoogleGenerativeAI({ apiKey });
  if (providerName === 'anthropic') return createAnthropic({ apiKey });
  if (providerName === 'openai') return createOpenAI({ apiKey });
  throw new Error(`Unsupported provider: ${providerName}`);
}

const DESTRUCTIVE_KEYWORDS = [
  'remove-', 'uninstall-', 'stop-', 'delete', 'rd ', 'del ', 'format-', 'clear-'
];

function isDestructive(cmd) {
  const lower = cmd.toLowerCase();
  return DESTRUCTIVE_KEYWORDS.some(kw => lower.includes(kw));
}

function extractTags(text) {
  const cmdRegex = /@cmd:\s*`([^`]+)`/g;
  const searchRegex = /@search:\s*"([^"]+)"/g;
  const cdRegex = /@cd:\s*"([^"]+)"/g;
  const readRegex = /@read:\s*"([^"]+)"/g;
  const listRegex = /@list:\s*"([^"]+)"/g;
  
  const cmds = [];
  const searches = [];
  const cds = [];
  const reads = [];
  const lists = [];
  
  let match;
  while ((match = cmdRegex.exec(text)) !== null) cmds.push(match[1].trim());
  while ((match = searchRegex.exec(text)) !== null) searches.push(match[1].trim());
  while ((match = cdRegex.exec(text)) !== null) cds.push(match[1].trim());
  while ((match = readRegex.exec(text)) !== null) reads.push(match[1].trim());
  while ((match = listRegex.exec(text)) !== null) lists.push(match[1].trim());
  
  return { cmds, searches, cds, reads, lists };
}

function smartTruncate(text, limit = 1500) {
  if (!text) return "";
  if (text.length <= limit) return text;
  const half = Math.floor(limit / 2);
  return text.substring(0, half) + `\n\n... [TRUNCATED ${text.length - limit} CHARS] ...\n\n` + text.substring(text.length - half);
}

export async function runAgentLoop({
  messages,
  provider,
  apiKey,
  tavilyKey,
  braveKey,
  model,
  systemPrompt,
  onStepStart,
  onStepComplete,
  onConfirmRequired
}) {
  const llmProvider = getProvider(provider, apiKey);
  const currentMessages = [...messages];
  let iteration = 0;
  const MAX_ITERATIONS = 8;
  
  // Track CWD across loop iterations
  let currentCwd = null;
  
  while (iteration < MAX_ITERATIONS) {
    iteration++;
    
    // 1. Call LLM
    onStepStart({ type: 'thinking', message: 'Agent is thinking...' });
    
    // Inject current CWD context into the latest system prompt wrapper or just as a reminder
    const cwdReminder = currentCwd ? `\n\n[SYSTEM] Current Working Directory: ${currentCwd}` : "";
    
    const response = await generateText({
      model: llmProvider(model),
      system: systemPrompt + cwdReminder,
      messages: currentMessages,
      temperature: 0.1,
    });
    
    const text = response.text;
    currentMessages.push({ role: 'assistant', content: text });
    
    // 2. Parse for action tags
    const { cmds, searches, cds, reads, lists } = extractTags(text);
    
    if (cmds.length === 0 && searches.length === 0 && cds.length === 0 && reads.length === 0 && lists.length === 0) {
      onStepComplete({ type: 'done', text });
      return text;
    }
    
    let contextUpdate = "";
    
    // 3. Process CD
    for (const p of cds) {
      currentCwd = p;
      contextUpdate += `\nChanged directory to: ${currentCwd}\n`;
      onStepStart({ type: 'running_cmd', cmd: `cd ${p}` });
      onStepComplete({ type: 'cmd_result', cmd: `cd ${p}`, output: `Success` });
    }
    
    // 4. Process Reads
    for (const p of reads) {
      onStepStart({ type: 'running_cmd', cmd: `read_file ${p}` });
      try {
        const content = await invoke('read_file', { path: p });
        const truncated = smartTruncate(content, 3000);
        contextUpdate += `\nOutput from @read: "${p}":\n${truncated}\n`;
        onStepComplete({ type: 'cmd_result', cmd: `read_file ${p}`, output: truncated });
      } catch (err) {
        contextUpdate += `\nError from @read: "${p}":\n${err}\n`;
        onStepComplete({ type: 'error', message: `Read failed: ${err}` });
      }
    }
    
    // 5. Process Lists
    for (const p of lists) {
      onStepStart({ type: 'running_cmd', cmd: `list_dir ${p}` });
      try {
        const content = await invoke('list_dir', { path: p });
        const truncated = smartTruncate(content, 3000);
        contextUpdate += `\nOutput from @list: "${p}":\n${truncated}\n`;
        onStepComplete({ type: 'cmd_result', cmd: `list_dir ${p}`, output: truncated });
      } catch (err) {
        contextUpdate += `\nError from @list: "${p}":\n${err}\n`;
        onStepComplete({ type: 'error', message: `List failed: ${err}` });
      }
    }
    
    // 6. Process Searches
    for (const query of searches) {
      onStepStart({ type: 'searching', message: `Searching web for: "${query}"` });
      try {
        const results = await invoke('web_search', { 
          query,
          tavilyKey: tavilyKey || null,
          braveKey: braveKey || null
        });
        const resultText = results.map(r => `[${r.title}](${r.url})\n${r.snippet}`).join('\n\n');
        
        onStepComplete({ type: 'search_result', query, results });
        contextUpdate += `\nOutput from @search: "${query}":\n${resultText || 'No results found.'}\n`;
      } catch (err) {
        onStepComplete({ type: 'error', message: `Search failed: ${err}` });
        contextUpdate += `\nError from @search: "${query}":\n${err}\n`;
      }
    }
    
    // 7. Process Commands
    for (const cmd of cmds) {
      if (isDestructive(cmd)) {
        onStepStart({ type: 'waiting_confirmation', cmd });
        const confirmed = await new Promise(resolve => onConfirmRequired(cmd, resolve));
        
        if (!confirmed) {
          onStepComplete({ type: 'cmd_rejected', cmd });
          contextUpdate += `\nOutput from @cmd: \`${cmd}\`:\n[USER REJECTED COMMAND EXECUTION]\n`;
          continue;
        }
      }
      
      onStepStart({ type: 'running_cmd', cmd });
      try {
        const output = await invoke('run_shell_command', { command: cmd, cwd: currentCwd });
        const truncated = smartTruncate(output, 2000);
        onStepComplete({ type: 'cmd_result', cmd, output: truncated });
        contextUpdate += `\nOutput from @cmd: \`${cmd}\`:\n${truncated}\n`;
      } catch (err) {
        onStepComplete({ type: 'error', message: `Command failed: ${err}` });
        contextUpdate += `\nError from @cmd: \`${cmd}\`:\n${err}\n`;
      }
    }
    
    currentMessages.push({ 
      role: 'user', 
      content: `[SYSTEM OBSERVATION]${contextUpdate}\nAnalyze the results and decide your next action. Remember to include your <plan> block.` 
    });
  }
  
  const timeoutMsg = "Agent reached maximum iterations and stopped.";
  onStepComplete({ type: 'error', message: timeoutMsg });
  return timeoutMsg;
}
