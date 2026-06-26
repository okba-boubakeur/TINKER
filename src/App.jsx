import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import SystemStatusCards from './components/SystemStatusCards';
import TasksProgress from './components/TasksProgress';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';
import UtilitiesPanel from './components/UtilitiesPanel';
import { BrandBackground } from './components/BrandBackground';
import { VoiceOrb } from './components/VoiceOrb';
import { sendMessageToAI, clearChatHistory } from './lib/ai';
import { playTTS, stopTTS } from './lib/tts';
import { executeTaskQueue, parseCommands } from './lib/taskQueue';
import './index.css';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false);
  const [showExecutionLog, setShowExecutionLog] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [systemStats, setSystemStats] = useState({ cpu: 0, ram: 0, disk: 0 });
  const [topApps, setTopApps] = useState([]);
  const [taskLogs, setTaskLogs] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [avatarState, setAvatarState] = useState('idle');
  const [voiceState, setVoiceState] = useState('idle');
  const [voiceLang, setVoiceLang] = useState('en-US');
  const srRef = useRef(null);
  const manualStopRef = useRef(false);
  const voiceStateRef = useRef('idle');

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tinkerSettings');
    return saved ? JSON.parse(saved) : {
      openRouterKey: '',
      geminiKey: '',
      defaultModel: 'gemini-2.5-flash',
      provider: 'google',
      ttsEngine: 'Edge TTS',
      edgeVoice: 'en-US-AriaNeural',
      winutilPath: 'd:\\tinker-ai\\winutil'
    };
  });
  const [tweaksCatalog, setTweaksCatalog] = useState([]);
  const [appsCatalog, setAppsCatalog] = useState([]);
  const [logHeight, setLogHeight] = useState(280);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(280);

  useEffect(() => {
    localStorage.setItem('tinkerSettings', JSON.stringify(settings));
  }, [settings]);

  // Backend integration
  useEffect(() => {
    // Initial fetch
    invoke('get_system_stats').then(setSystemStats).catch(console.error);
    invoke('get_top_processes').then(setTopApps).catch(console.error);

    // Load tweaks catalog
    invoke('get_tweaks_catalog', { winutilPath: settings.winutilPath })
      .then(setTweaksCatalog)
      .catch(err => {
        console.error('Failed to load tweaks catalog:', err);
        setTaskLogs(prev => [...prev, { text: 'Warning: Could not load tweaks catalog. Some features may be limited.', type: 'error' }]);
      });

    // Load apps catalog
    invoke('get_apps_catalog', { winutilPath: settings.winutilPath })
      .then(setAppsCatalog)
      .catch(err => {
        console.error('Failed to load apps catalog:', err);
        setTaskLogs(prev => [...prev, { text: 'Warning: Could not load apps catalog. Some features may be limited.', type: 'error' }]);
      });

    const unlistenTick = listen('sys-tick', () => {
      invoke('get_system_stats').then(setSystemStats).catch(console.error);
      invoke('get_top_processes').then(setTopApps).catch(console.error);
    });

    const unlistenTask = listen('task-log', (event) => {
      setTaskLogs(prev => [...prev, event.payload]);
    });

    return () => {
      unlistenTick.then(f => f());
      unlistenTask.then(f => f());
    };
  }, [settings.winutilPath]);

  // Theme toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Resizable panel drag handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const delta = startYRef.current - e.clientY;
      const newHeight = Math.max(120, Math.min(window.innerHeight * 0.7, startHeightRef.current + delta));
      setLogHeight(newHeight);
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Keep voiceStateRef in sync for use inside callbacks
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (srRef.current) {
        try { srRef.current.stop(); } catch { /* ignore */ }
      }
      stopTTS();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const makeInvoker = () => async (type, key) => {
    if (type === 'run') {
      setTaskLogs(prev => [...prev, { text: `Executing tweak: ${key}...`, type: 'info' }]);
      await invoke('execute_winutil_tweak', { functionName: key, winutilPath: settings.winutilPath });
      setTaskLogs(prev => [...prev, { text: `✅ Tweak applied: ${key}`, type: 'success' }]);
    } else if (type === 'install') {
      setTaskLogs(prev => [...prev, { text: `Installing: ${key}...`, type: 'info' }]);
      await invoke('install_application', { appKey: key, winutilPath: settings.winutilPath });
      setTaskLogs(prev => [...prev, { text: `✅ Installed: ${key}`, type: 'success' }]);
    } else if (type === 'uninstall') {
      setTaskLogs(prev => [...prev, { text: `Uninstalling: ${key}...`, type: 'info' }]);
      await invoke('uninstall_application', { appKey: key, winutilPath: settings.winutilPath });
      setTaskLogs(prev => [...prev, { text: `✅ Uninstalled: ${key}`, type: 'success' }]);
    }
  };

  // Called by the PlanCard Execute button
  const handleExecutePlan = (tasks, onProgress, onComplete) => {
    const invoker = makeInvoker();
    setTaskLogs(prev => [...prev, { text: `🚀 Executing plan: ${tasks.length} tasks...`, type: 'info' }]);
    executeTaskQueue(tasks, invoker, (idx, status, msg) => {
      onProgress(idx, status);
      setTaskLogs(prev => [...prev, { text: msg, type: status === 'error' ? 'error' : 'info' }]);
    }).then(() => {
      onComplete();
      setTaskLogs(prev => [...prev, { text: '🎉 All tasks complete!', type: 'success' }]);
    });
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    clearChatHistory();
  };

  const handleSendMessage = async (msg) => {
    setVoiceState('idle');
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    setAvatarState('listening');
    setIsChatLoading(true);

    const apiKey = settings.provider === 'google' ? settings.geminiKey : settings.openRouterKey;
    if (!apiKey) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: '> ⚠️ **No API key configured.**\n> Please open **Settings** and add your Google or OpenRouter API key.' }]);
      setAvatarState('idle');
      setIsChatLoading(false);
      return;
    }

    try {
      const { runAgentLoop } = await import('./lib/agentLoop');
      const { buildAgentSystemPrompt } = await import('./lib/ai');
      
      // Build history for LLM: include user/assistant messages + agent tool call summaries
      const formattedHistory = chatHistory
        .map(m => {
          if (m.role === 'user' || m.role === 'assistant') {
            return { role: m.role, content: m.content };
          }
          if (m.role === 'agent_step') {
            if (m.step.type === 'cmd_result') {
              const out = m.step.output ? m.step.output.substring(0, 1500) : '';
              return { role: 'assistant', content: `[TOOL CALL] @cmd: \`${m.step.cmd}\`\n[RESULT] ${out}` };
            }
            if (m.step.type === 'search_result') {
              return { role: 'assistant', content: `[TOOL CALL] @search: "${m.step.query}"\n[RESULT] Found ${m.step.results.length} results.` };
            }
            if (m.step.type === 'cmd_rejected') {
              return { role: 'assistant', content: `[TOOL CALL] @cmd: \`${m.step.cmd}\`\n[RESULT] USER REJECTED` };
            }
          }
          return null;
        })
        .filter(Boolean);
      
      formattedHistory.push({ role: 'user', content: msg });
      
      await runAgentLoop({
        messages: formattedHistory,
        provider: settings.provider,
        apiKey,
        model: settings.defaultModel,
        tavilyKey: settings.tavilyKey,
        braveKey: settings.braveKey,
        systemPrompt: buildAgentSystemPrompt(tweaksCatalog, appsCatalog),
        onStepStart: (step) => {
          // Only surface "thinking" and structural plan/progress steps in the chat
          if (step.type === 'thinking' || step.type === 'waiting_confirmation') {
            setChatHistory(prev => [...prev, { role: 'agent_step', step }]);
          }
          // Raw execution steps go to the Execution Log
          if (step.type === 'running_cmd' || step.type === 'searching') {
            const logMsg = step.type === 'searching'
              ? `🔍 Searching: "${step.message?.replace('Searching web for: ', '') || ''}"`
              : `⚡ Running: ${step.cmd}`;
            setTaskLogs(prev => [...prev, { text: logMsg, type: 'info' }]);
            setShowExecutionLog(true);
          }
        },
        onStepComplete: (step) => {
          setChatHistory(prev => {
            const newHist = [...prev];
            const lastIdx = newHist.length - 1;
            if (step.type === 'done') {
              // Remove the last 'thinking' bubble and replace with final answer
              if (newHist[lastIdx]?.role === 'agent_step' && newHist[lastIdx]?.step?.type === 'thinking') {
                newHist[lastIdx] = { role: 'assistant', content: step.text };
              } else {
                newHist.push({ role: 'assistant', content: step.text });
              }
            } else if (newHist[lastIdx]?.role === 'agent_step' && newHist[lastIdx]?.step?.type === 'thinking') {
              // Keep thinking bubble while the agent is running tool calls
              // (don't push anything to chat — tool results go to Execution Log)
            }
            return newHist;
          });
          // Route raw results to Execution Log
          if (step.type === 'cmd_result') {
            setTaskLogs(prev => [...prev, { text: `✅ Done: ${step.cmd}`, type: 'success' }]);
            if (step.output && step.output !== '(Command completed successfully with no output)') {
              // Show first 200 chars of output as a preview log line
              const preview = step.output.split('\n').slice(0, 5).join('\n').substring(0, 300);
              setTaskLogs(prev => [...prev, { text: preview, type: 'info' }]);
            }
          }
          if (step.type === 'search_result') {
            setTaskLogs(prev => [...prev, { text: `🌐 Search complete: "${step.query}" — ${step.results.length} results`, type: 'success' }]);
          }
          if (step.type === 'error') {
            setTaskLogs(prev => [...prev, { text: `❌ ${step.message}`, type: 'error' }]);
          }
          if (step.type === 'cmd_rejected') {
            setTaskLogs(prev => [...prev, { text: `🚫 Command rejected by user: ${step.cmd}`, type: 'error' }]);
          }
        },
        onConfirmRequired: (cmd, resolve) => {
          const isConfirmed = window.confirm(`⚠️ TINKER wants to run a sensitive command:\n\n${cmd}\n\nAllow?`);
          resolve(isConfirmed);
        }
      });
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `**Error:** ${err.message}` }]);
    } finally {
      setAvatarState('idle');
      setIsChatLoading(false);
    }
  };

  // ── Voice Assistant State Machine ────────────────────────────

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTaskLogs(prev => [...prev, { text: 'Speech recognition not supported in this browser.', type: 'error' }]);
      return;
    }

    manualStopRef.current = false;
    let transcript = '';

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = voiceLang;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('[Voice] SR error:', event.error);
      if (voiceStateRef.current === 'listening') {
        setVoiceState('idle');
        setAvatarState('idle');
      }
      srRef.current = null;
    };

    recognition.onend = () => {
      srRef.current = null;
      if (voiceStateRef.current !== 'listening') return;

      if (manualStopRef.current && !transcript.trim()) {
        // Manual stop with nothing captured → just idle
        setVoiceState('idle');
        setAvatarState('idle');
      } else if (transcript.trim()) {
        // Got transcript → process it
        processVoiceTranscript(transcript);
      } else {
        // Auto-stop with no transcript → idle
        setVoiceState('idle');
        setAvatarState('idle');
      }
    };

    srRef.current = recognition;
    try {
      recognition.start();
      setVoiceState('listening');
      setAvatarState('listening');
    } catch (err) {
      console.error('[Voice] Failed to start SR:', err);
      setVoiceState('idle');
    }
  };

  const processVoiceTranscript = async (text) => {
    setVoiceState('processing');
    setAvatarState('listening'); // orb "thinking"
    setChatHistory(prev => [...prev, { role: 'user', content: text }]);

    const apiKey = settings.provider === 'google' ? settings.geminiKey : settings.openRouterKey;
    if (!apiKey) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Please configure your API key in Settings first.' }]);
      setVoiceState('idle');
      setAvatarState('idle');
      return;
    }

    try {
      const { runAgentLoop } = await import('./lib/agentLoop');
      const { buildSystemPrompt } = await import('./lib/ai');
      
      const formattedHistory = chatHistory
        .map(m => {
          if (m.role === 'user' || m.role === 'assistant') {
            return { role: m.role, content: m.content };
          }
          if (m.role === 'agent_step') {
            if (m.step.type === 'cmd_result') {
              const out = m.step.output ? m.step.output.substring(0, 1500) : '';
              return { role: 'assistant', content: `[TOOL CALL] @cmd: \`${m.step.cmd}\`\n[RESULT] ${out}` };
            }
            if (m.step.type === 'search_result') {
              return { role: 'assistant', content: `[TOOL CALL] @search: "${m.step.query}"\n[RESULT] Found ${m.step.results.length} results.` };
            }
          }
          return null;
        })
        .filter(Boolean);
      
      formattedHistory.push({ role: 'user', content: text });

      await runAgentLoop({
        messages: formattedHistory,
        provider: settings.provider,
        apiKey,
        model: settings.defaultModel,
        tavilyKey: settings.tavilyKey,
        braveKey: settings.braveKey,
        systemPrompt: buildSystemPrompt(tweaksCatalog, appsCatalog, 'voice'),
        onStepStart: (step) => {
          if (step.type === 'thinking' || step.type === 'waiting_confirmation') {
            setChatHistory(prev => [...prev, { role: 'agent_step', step }]);
          }
          if (step.type === 'running_cmd' || step.type === 'searching') {
            const logMsg = step.type === 'searching'
              ? `🔍 Searching: "${step.message?.replace('Searching web for: ', '') || ''}"`
              : `⚡ Running: ${step.cmd}`;
            setTaskLogs(prev => [...prev, { text: logMsg, type: 'info' }]);
            setShowExecutionLog(true);
          }
        },
        onStepComplete: (step) => {
          setChatHistory(prev => {
            const newHist = [...prev];
            const lastIdx = newHist.length - 1;
            
            if (step.type === 'done') {
              let aiResponse = { language: 'en', speak: 'Sorry, I failed to format my response.', details: step.text };
              try {
                const jsonMatch = step.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) aiResponse = JSON.parse(jsonMatch[0]);
                else aiResponse = { language: 'en', speak: step.text, details: step.text };
              } catch (e) {
                console.error('Failed to parse voice JSON', e);
              }

              const finalContent = aiResponse.details || aiResponse.speak;
              
              if (newHist[lastIdx]?.role === 'agent_step' && newHist[lastIdx]?.step?.type === 'thinking') {
                newHist[lastIdx] = { role: 'assistant', content: finalContent };
              } else {
                newHist.push({ role: 'assistant', content: finalContent });
              }

              setVoiceState('speaking');
              setAvatarState('speaking');

              const LOCALE_VOICE_MAP = {
                ar: 'ar-AE-HamdanNeural',
                en: 'en-US-AndrewNeural',
                fr: 'fr-CH-FabriceNeural',
                es: 'es-GT-AndresNeural',
                ru: 'ru-RU-DmitryNeural',
                zh: 'zh-TW-YunJheNeural'
              };
              const ttsVoice = LOCALE_VOICE_MAP[aiResponse.language] || 'en-US-AndrewNeural';
              playTTS(aiResponse.speak, ttsVoice);

              const ttsDuration = Math.min(Math.max((aiResponse.speak?.length || 0) * 60, 1500), 8000);
              setTimeout(() => {
                if (voiceStateRef.current === 'speaking') {
                  setVoiceState('idle');
                  setAvatarState('idle');
                }
              }, ttsDuration);

            } else if (newHist[lastIdx]?.role === 'agent_step' && newHist[lastIdx]?.step?.type === 'thinking') {
              // Keep thinking bubble
            }
            return newHist;
          });

          if (step.type === 'cmd_result') {
            setTaskLogs(prev => [...prev, { text: `✅ Done: ${step.cmd}`, type: 'success' }]);
            if (step.output && step.output !== '(Command completed successfully with no output)') {
              const preview = step.output.split('\n').slice(0, 5).join('\n').substring(0, 300);
              setTaskLogs(prev => [...prev, { text: preview, type: 'info' }]);
            }
          }
          if (step.type === 'search_result') {
            setTaskLogs(prev => [...prev, { text: `🌐 Search complete: "${step.query}" — ${step.results.length} results`, type: 'success' }]);
          }
          if (step.type === 'error') {
            setTaskLogs(prev => [...prev, { text: `❌ ${step.message}`, type: 'error' }]);
          }
          if (step.type === 'cmd_rejected') {
            setTaskLogs(prev => [...prev, { text: `🚫 Command rejected by user: ${step.cmd}`, type: 'error' }]);
          }
        },
        onConfirmRequired: (cmd, resolve) => {
          const isConfirmed = window.confirm(`⚠️ TINKER (Voice) wants to run a sensitive command:\n\n${cmd}\n\nAllow?`);
          resolve(isConfirmed);
        }
      });
    } catch (err) {
      console.error('[Voice] AI error:', err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${err.message || err}` }]);
      setVoiceState('idle');
      setAvatarState('idle');
    }
  };

  const handleMicTap = () => {
    if (voiceState === 'speaking') {
      // Interrupt TTS
      stopTTS();
      setVoiceState('idle');
      setAvatarState('idle');
    } else if (voiceState === 'listening') {
      // Manual stop recording
      manualStopRef.current = true;
      if (srRef.current) {
        try { srRef.current.stop(); } catch { /* ignore */ }
      }
    } else if (voiceState === 'idle') {
      // Start recording
      startSpeechRecognition();
    }
  };

  const handleManualLaunch = async (functionName) => {
    setTaskLogs(prev => [...prev, { text: `Launching tweak: ${functionName}...`, type: 'info' }]);
    try {
      await invoke('execute_winutil_tweak', {
        functionName,
        winutilPath: settings.winutilPath
      });
    } catch (e) {
      console.error(e);
      setTaskLogs(prev => [...prev, { text: `Error launching ${functionName}: ${e.message || e}`, type: 'error' }]);
      throw e;
    }
  };

  const handleManualInstall = async (appKey) => {
    setTaskLogs(prev => [...prev, { text: `Installing app: ${appKey}...`, type: 'info' }]);
    try {
      await invoke('install_application', {
        appKey,
        winutilPath: settings.winutilPath
      });
    } catch (e) {
      console.error(e);
      setTaskLogs(prev => [...prev, { text: `Error installing ${appKey}: ${e.message || e}`, type: 'error' }]);
      throw e;
    }
  };

  const handleManualUninstall = async (appKey) => {
    setTaskLogs(prev => [...prev, { text: `Uninstalling app: ${appKey}...`, type: 'info' }]);
    try {
      await invoke('uninstall_application', {
        appKey,
        winutilPath: settings.winutilPath
      });
    } catch (e) {
      console.error(e);
      setTaskLogs(prev => [...prev, { text: `Error uninstalling ${appKey}: ${e.message || e}`, type: 'error' }]);
      throw e;
    }
  };

  const orbIntensity = voiceState === 'idle' ? 0 : voiceState === 'listening' ? 0.7 : voiceState === 'speaking' ? 0.85 : 0.35;

  return (
    <>
      <BrandBackground />
      <div className="app-layout">
        {/* Left Column: System Status */}
        <div className="col-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 4px 12px' }}>
            <img src="/favicon.svg" alt="TINKER" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
            <span className="font-display" style={{ fontSize: '14px', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>TINKER</span>
          </div>
          <SystemStatusCards stats={systemStats} topApps={topApps} />
        </div>

        {/* Center Column: VoiceOrb or Utilities + always-visible logs */}
        <div className="col-center">
          {isUtilitiesOpen ? (
            <div className="col-center-top" style={{ overflow: 'hidden' }}>
              <UtilitiesPanel
                tweaksCatalog={tweaksCatalog}
                appsCatalog={appsCatalog}
                onLaunch={handleManualLaunch}
                onInstall={handleManualInstall}
                onUninstall={handleManualUninstall}
                onBack={() => setIsUtilitiesOpen(false)}
              />
            </div>
          ) : (
            <div className="col-center-top" style={{ gap: '24px' }}>
              <VoiceOrb intensity={orbIntensity} style={{ width: '320px', height: '320px' }} />
              <div style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: voiceState === 'listening' ? 'var(--accent-bright)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                transition: 'color 0.3s',
                textAlign: 'center',
              }}>
                {voiceState === 'idle' && 'System Ready'}
                {voiceState === 'listening' && 'Listening...'}
                {voiceState === 'processing' && 'Processing...'}
                {voiceState === 'speaking' && 'Synthesizing...'}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
                <select 
                  className="input" 
                  value={voiceLang} 
                  onChange={(e) => setVoiceLang(e.target.value)}
                  style={{ width: 'auto', padding: '6px 36px 6px 12px', fontSize: '12px', background: 'var(--bg-elevated)' }}
                  disabled={voiceState !== 'idle'}
                >
                  <option value="en-US">English</option>
                  <option value="ar-SA">العربية</option>
                  <option value="fr-FR">Français</option>
                  <option value="es-ES">Español</option>
                  <option value="ru-RU">Русский</option>
                  <option value="zh-CN">中文</option>
                </select>
                <button 
                  onClick={handleMicTap} 
                  disabled={voiceState === 'processing'}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: voiceState === 'listening' ? 'var(--accent-bright)' : 'var(--bg-elevated)',
                    color: voiceState === 'listening' ? '#000' : 'var(--text-primary)',
                    border: voiceState === 'listening' ? 'none' : '1px solid var(--border)',
                    cursor: voiceState === 'processing' ? 'wait' : 'pointer',
                    boxShadow: voiceState === 'listening' ? '0 0 15px var(--accent-bright)' : 'none',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                  }}
                  title={voiceState === 'idle' ? 'Activate Voice' : voiceState === 'listening' ? 'Stop Listening' : voiceState === 'processing' ? 'Processing' : 'Interrupt'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {voiceState === 'listening' ? (
                      <rect x="6" y="6" width="12" height="12" rx="2" ry="2" fill="currentColor" stroke="none"/>
                    ) : voiceState === 'speaking' ? (
                      <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                    ) : (
                      <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>
                    )}
                  </svg>
                </button>
                <button className="btn" style={{ gap: '8px', fontSize: '12px' }} onClick={() => setIsUtilitiesOpen(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="7" rx="2"/><rect x="2" y="14" width="20" height="7" rx="2"/>
                  </svg>
                  Launch Utility
                </button>
                <button className={`btn ${showExecutionLog ? 'btn-primary' : ''}`} style={{ gap: '8px', fontSize: '12px' }} onClick={() => setShowExecutionLog(!showExecutionLog)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                  </svg>
                  Execution Log
                </button>
              </div>
            </div>
          )}
        
        {showExecutionLog && (
          <>
            {/* Resize handle */}
            <div
              style={{
                height: '6px',
                cursor: 'row-resize',
                background: 'rgba(255,255,255,0.06)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseDown={(e) => {
                isDraggingRef.current = true;
                startYRef.current = e.clientY;
                startHeightRef.current = logHeight;
                document.body.style.cursor = 'row-resize';
                document.body.style.userSelect = 'none';
              }}
              title="Drag to resize"
            >
              <div style={{ width: '32px', height: '2px', borderRadius: '1px', background: 'rgba(255,255,255,0.2)' }} />
            </div>
            <div className="col-center-bottom" style={{ height: `${logHeight}px`, minHeight: '120px', maxHeight: '70vh' }}>
              <TasksProgress logs={taskLogs} />
            </div>
          </>
        )}
      </div>

      {/* Right Column: Chat & Context */}
      <div className="col-right">
        <ChatInterface
          history={chatHistory}
          isLoading={isChatLoading}
          onSendMessage={handleSendMessage}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onClearHistory={handleClearHistory}
          onExecutePlan={handleExecutePlan}
          appsCatalog={appsCatalog}
          tweaksCatalog={tweaksCatalog}
        />
      </div>

      {/* Overlays */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          onThemeChange={setTheme}
          settings={settings}
          onSettingsChange={setSettings}
        />
      )}
    </div>
    </>
  );
}

export default App;
