import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseCommands, extractPlanBlock, hasSetupWizard, stripCommandTags } from '../lib/taskQueue';
import { AppIcon } from './UtilitiesPanel';

// ── Setup Profiles Data ───────────────────────────────────────────────────────
const SETUP_PROFILES = [
  {
    id: 'general',
    label: 'Standard / General Use',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
    color: '#6366f1',
    description: 'Web browsing, education, everyday tasks',
    tweaks: ['WPFTweaksDeBloat','WPFTweaksTelemetry','WPFTweaksActivity','WPFTweaksLocation','WPFTweaksConsumerFeatures','WPFTweaksHiber','WPFTweaksWidget'],
    apps: ['firefox','7zip','vlc','libreoffice','powertoys','sharex','bitwarden','notepadplus'],
  },
  {
    id: 'gaming',
    label: 'Gaming PC',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M7 12h.01"/><path d="M17 12h.01"/><path d="M12 9v6"/></svg>,
    color: '#ef4444',
    description: 'Max FPS, low latency, stream-ready',
    tweaks: ['WPFTweaksDeBloat','WPFTweaksTelemetry','WPFTweaksActivity','WPFTweaksConsumerFeatures','WPFTweaksDVR','WPFTweaksXboxRemoval'],
    apps: ['steam','epicgames','discord','msiafterburner','hwinfo','cpuz','7zip','powertoys'],
  },
  {
    id: 'creator',
    label: 'Content Creator',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
    color: '#f59e0b',
    description: 'Editing, streaming, audio production',
    tweaks: ['WPFTweaksDeBloat','WPFTweaksTelemetry','WPFTweaksActivity','WPFTweaksConsumerFeatures','WPFTweaksServices'],
    apps: ['obs','handbrake','vlc','blender','audacity','libreoffice','sharex','7zip','powertoys'],
  },
  {
    id: 'dev',
    label: 'Professional Developer',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    color: '#22c55e',
    description: 'Coding, DevOps, databases',
    tweaks: ['WPFTweaksDeBloat','WPFTweaksTelemetry','WPFTweaksActivity','WPFTweaksConsumerFeatures','WPFTweaksWidget'],
    apps: ['git','vscode','terminal','python3','nodejs','docker','7zip','obsidian','bitwarden','powertoys','notepadplus','firefox'],
  },
  {
    id: 'design',
    label: 'Graphic Designer',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/></svg>,
    color: '#a855f7',
    description: 'Design tools, 3D, illustration',
    tweaks: ['WPFTweaksDeBloat','WPFTweaksTelemetry','WPFTweaksActivity','WPFTweaksConsumerFeatures','WPFTweaksServices'],
    apps: ['blender','gimp','inkscape','krita','vlc','sharex','7zip','powertoys'],
  },
  {
    id: 'privacy',
    label: 'Privacy-Focused',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    color: '#06b6d4',
    description: 'Minimal telemetry, hardened privacy',
    tweaks: ['WPFTweaksDeBloat','WPFTweaksTelemetry','WPFTweaksActivity','WPFTweaksLocation','WPFTweaksConsumerFeatures','WPFTweaksServices','WPFTweaksWidget'],
    apps: ['brave','firefox','bitwarden','protonvpn','7zip','vlc','libreoffice','obsidian'],
  },
];

// ── Setup Wizard Card ─────────────────────────────────────────────────────────
function SetupWizardCard({ appsCatalog, tweaksCatalog, onExecute }) {
  const [step, setStep] = useState(1); // 1=profile pick, 2=checklist
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedTweaks, setSelectedTweaks] = useState(new Set());
  const [selectedApps, setSelectedApps] = useState(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [tweakStates, setTweakStates] = useState({});
  const [appStates, setAppStates] = useState({});

  const getAppInfo = (key) => appsCatalog?.find(a => a.key === key);
  const getTweakInfo = (key) => tweaksCatalog?.find(t => t.key === key);

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setSelectedTweaks(new Set(profile.tweaks));
    setSelectedApps(new Set(profile.apps));
    setStep(2);
  };

  const handleExecute = () => {
    if (isRunning || isDone) return;
    const tweakTasks = [...selectedTweaks].map(k => ({ type: 'run', key: k }));
    const appTasks = [...selectedApps].map(k => ({ type: 'install', key: k }));
    const allTasks = [...tweakTasks, ...appTasks];
    if (allTasks.length === 0) return;

    setIsRunning(true);
    const initTweakStates = {};
    selectedTweaks.forEach(k => { initTweakStates[k] = 'running'; });
    const initAppStates = {};
    selectedApps.forEach(k => { initAppStates[k] = 'running'; });
    setTweakStates(initTweakStates);
    setAppStates(initAppStates);

    onExecute(allTasks, (idx, status) => {
      const task = allTasks[idx];
      if (task.type === 'run') setTweakStates(p => ({ ...p, [task.key]: status }));
      else setAppStates(p => ({ ...p, [task.key]: status }));
    }, () => {
      setIsRunning(false);
      setIsDone(true);
    });
  };

  const statusIcon = (s) => {
    if (s === 'done') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>;
    if (s === 'error') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    if (s === 'running') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-bright)" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>;
    return null;
  };

  const completedCount = Object.values({...tweakStates,...appStates}).filter(s => s === 'done').length;
  const totalSelected = selectedTweaks.size + selectedApps.size;
  const progress = totalSelected > 0 ? (completedCount / totalSelected) * 100 : 0;

  return (
    <div style={{
      marginTop: 10,
      background: 'linear-gradient(135deg, rgba(130,90,255,0.08) 0%, rgba(80,60,180,0.12) 100%)',
      border: '1px solid rgba(130,90,255,0.3)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(130,90,255,0.2)', background: 'rgba(130,90,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-bright)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--accent-bright)' }}>WINDOWS SETUP WIZARD</span>
        {step === 2 && (
          <button onClick={() => setStep(1)} disabled={isRunning} style={{ marginLeft: 'auto', fontSize: 11, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>← Change Profile</button>
        )}
      </div>

      {/* Step 1 — Profile Picker */}
      {step === 1 && (
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
            Step 1: Choose how you'll primarily use this PC. The wizard will prepare tailored tweaks and apps.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {SETUP_PROFILES.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1px solid ${profile.color}44`,
                  background: `${profile.color}11`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${profile.color}22`; e.currentTarget.style.borderColor = profile.color; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${profile.color}11`; e.currentTarget.style.borderColor = `${profile.color}44`; }}
              >
                <span style={{ color: profile.color, flexShrink: 0 }}>{profile.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{profile.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{profile.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Checklist */}
      {step === 2 && selectedProfile && (
        <div>
          {/* Progress bar */}
          {(isRunning || isDone) && (
            <div style={{ height: 3, background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#7B3FE4,#C4A8F0)', transition: 'width 0.4s ease-out' }} />
            </div>
          )}

          <div style={{ maxHeight: 400, overflowY: 'auto', padding: '12px 16px' }}>
            {/* Profile badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: `${selectedProfile.color}18`, border: `1px solid ${selectedProfile.color}44` }}>
              <span style={{ color: selectedProfile.color }}>{selectedProfile.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: selectedProfile.color }}>{selectedProfile.label}</span>
            </div>

            {/* Tweaks section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 8 }}>TWEAKS &amp; OPTIMIZATIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {selectedProfile.tweaks.map(key => {
                  const info = getTweakInfo(key);
                  const checked = selectedTweaks.has(key);
                  const status = tweakStates[key];
                  return (
                    <div key={key} onClick={() => {
                      if (isRunning || isDone) return;
                      const n = new Set(selectedTweaks);
                      checked ? n.delete(key) : n.add(key);
                      setSelectedTweaks(n);
                    }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6, cursor: (isRunning||isDone)?'default':'pointer', opacity: checked ? 1 : 0.4, background: checked ? 'rgba(130,90,255,0.06)' : 'transparent', transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={checked} readOnly style={{ accentColor: 'var(--accent)', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: status === 'done' ? 'line-through' : 'none', flex: 1 }}>
                        {info?.name || key.replace(/^WPFTweaks/, '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {status && statusIcon(status)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Apps section */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 8 }}>APPLICATIONS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                {selectedProfile.apps.map(key => {
                  const app = getAppInfo(key);
                  const checked = selectedApps.has(key);
                  const status = appStates[key];
                  return (
                    <div key={key} onClick={() => {
                      if (isRunning || isDone) return;
                      const n = new Set(selectedApps);
                      checked ? n.delete(key) : n.add(key);
                      setSelectedApps(n);
                    }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, cursor: (isRunning||isDone)?'default':'pointer', opacity: checked ? 1 : 0.4, background: checked ? 'var(--bg-primary)' : 'rgba(0,0,0,0.1)', border: checked ? '1px solid var(--accent)' : '1px solid var(--border)', transition: 'all 0.15s', position: 'relative' }}>
                      <input type="checkbox" checked={checked} readOnly style={{ accentColor: 'var(--accent)', flexShrink: 0 }} />
                      <AppIcon link={app?.link} category={app?.category} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app?.name || key}</div>
                        {app?.description && <div style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.description}</div>}
                      </div>
                      {status && <div style={{ position: 'absolute', right: 6, top: 6 }}>{statusIcon(status)}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Execute Footer */}
          {!isDone ? (
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(130,90,255,0.2)' }}>
              <button
                onClick={handleExecute}
                disabled={isRunning || (selectedTweaks.size + selectedApps.size === 0)}
                style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none', background: isRunning ? 'rgba(130,90,255,0.3)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', boxShadow: isRunning ? 'none' : '0 2px 16px rgba(124,58,237,0.5)' }}
              >
                {isRunning ? (
                  <><span style={{display:'inline-flex',animation:'spin 1s linear infinite'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg></span>SETTING UP... ({completedCount}/{totalSelected})</>
                ) : (
                  <><span style={{display:'inline-flex'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>START SETUP — {selectedTweaks.size} TWEAKS + {selectedApps.size} APPS</>
                )}
              </button>
            </div>
          ) : (
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(130,90,255,0.2)', background: 'rgba(34,197,94,0.1)', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>✅ SETUP COMPLETE! Your Windows is optimized.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Plan Card Component ────────────────────────────────────────────────────────
function PlanCard({ planText, appsCatalog, tweaksCatalog, onExecute }) {
  const tasks = parseCommands(planText);
  const [taskStates, setTaskStates] = useState(tasks.map(() => 'idle')); // idle | running | done | error
  const [selectedIndices, setSelectedIndices] = useState(() => new Set(tasks.map((_, i) => i)));
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const appTasks = tasks.map((t, idx) => ({ ...t, originalIndex: idx })).filter(t => t.type === 'install' || t.type === 'uninstall');
  const tweakTasks = tasks.map((t, idx) => ({ ...t, originalIndex: idx })).filter(t => t.type === 'run');

  const getAppInfo = (key) => appsCatalog?.find(a => a.key === key);
  const getTweakInfo = (key) => tweaksCatalog?.find(t => t.key === key);

  const toggleTask = (idx) => {
    if (isRunning || isDone) return;
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  };

  const handleExecute = () => {
    if (isRunning || isDone) return;
    // Map tasks to execution, but only the selected ones
    // We send the full tasks array to the queue, but we'll mark unselected ones as 'done' instantly or skip them.
    // Wait, the executor expects an array of tasks. Let's just filter the tasks array, but we need to track status correctly.
    // Actually, we can just send the selected tasks.
    const tasksToRun = tasks.filter((_, i) => selectedIndices.has(i));
    if (tasksToRun.length === 0) return;

    // We need a mapping from new index -> original index to update UI state
    const indexMapping = tasks.map((_, i) => selectedIndices.has(i) ? i : -1).filter(i => i !== -1);

    onExecute(tasksToRun, (idx, status) => {
      setTaskStates(prev => {
        const next = [...prev];
        const originalIndex = indexMapping[idx];
        if (originalIndex !== undefined) next[originalIndex] = status;
        return next;
      });
    }, () => {
      setIsRunning(false);
      setIsDone(true);
      // Mark unselected as idle or skipped
      setTaskStates(prev => prev.map((s, i) => selectedIndices.has(i) ? (s === 'running' ? 'done' : s) : 'idle'));
    });
    setIsRunning(true);
    // Set running state for selected, idle for unselected
    setTaskStates(tasks.map((_, i) => selectedIndices.has(i) ? 'running' : 'idle'));
  };

  const getTaskLabel = (task) => {
    if (task.type === 'install') return getAppInfo(task.key)?.name || task.key;
    if (task.type === 'uninstall') return `Uninstall ${getAppInfo(task.key)?.name || task.key}`;
    if (task.type === 'run') return getTweakInfo(task.key)?.name || task.key.replace(/^WPFTweaks/, '').replace(/([A-Z])/g, ' $1').trim();
    return task.key;
  };

  const stateColor = (s) => {
    if (s === 'done') return 'var(--success, #22c55e)';
    if (s === 'error') return '#ef4444';
    if (s === 'running') return 'var(--accent-bright)';
    return 'var(--text-muted)';
  };

  const stateIcon = (s) => {
    if (s === 'done') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>;
    if (s === 'error') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    if (s === 'running') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>;
    return null;
  };

  const completedCount = taskStates.filter(s => s === 'done').length;
  const targetCount = selectedIndices.size;
  const progressPercent = targetCount > 0 ? (completedCount / targetCount) * 100 : 0;

  return (
    <div style={{
      marginTop: 10,
      background: 'linear-gradient(135deg, rgba(130,90,255,0.08) 0%, rgba(80,60,180,0.12) 100%)',
      border: '1px solid rgba(130,90,255,0.3)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(130,90,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(130,90,255,0.1)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h.01"/></svg></span>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--accent-bright)' }}>
          ACTION PLAN — {targetCount} ITEM{targetCount !== 1 ? 'S' : ''} SELECTED
        </span>
        {isDone && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
            ✅ COMPLETED
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {(isRunning || isDone) && (
        <div style={{ width: '100%', height: 4, background: 'rgba(0,0,0,0.3)' }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #7B3FE4, #C4A8F0)',
            transition: 'width 0.4s ease-out'
          }} />
        </div>
      )}

      <div style={{ maxHeight: '350px', overflowY: 'auto', paddingBottom: 8 }}>
        {/* Apps Section */}
        {appTasks.length > 0 && (
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>APPLICATIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {appTasks.map((task) => {
                const idx = task.originalIndex;
                const app = getAppInfo(task.key) || { key: task.key, name: task.key, description: '' };
                const isSelected = selectedIndices.has(idx);
                const status = taskStates[idx];
                return (
                  <div key={idx} 
                    onClick={() => toggleTask(idx)}
                    style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px',
                    borderRadius: 8,
                    background: isSelected ? 'var(--bg-primary)' : 'rgba(0,0,0,0.2)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    cursor: (isRunning || isDone) ? 'default' : 'pointer',
                    opacity: isSelected ? 1 : 0.5,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      readOnly
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <AppIcon link={app.link} category={app.category} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {app.name || app.key}
                      </div>
                      {app.description && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {app.description}
                        </div>
                      )}
                    </div>
                    {status !== 'idle' && (
                      <div style={{ position: 'absolute', right: 8, color: stateColor(status) }}>
                        {stateIcon(status)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tweaks Section */}
        {tweakTasks.length > 0 && (
          <div style={{ padding: '0 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em', marginTop: appTasks.length > 0 ? 8 : 12 }}>TWEAKS & FUNCTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tweakTasks.map((task) => {
                const idx = task.originalIndex;
                const isSelected = selectedIndices.has(idx);
                const status = taskStates[idx];
                return (
                  <div key={idx} 
                    onClick={() => toggleTask(idx)}
                    style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: isSelected ? 'rgba(130,90,255,0.05)' : 'transparent',
                    cursor: (isRunning || isDone) ? 'default' : 'pointer',
                    opacity: isSelected ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      readOnly
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: 12, color: stateColor(status), minWidth: 16, textAlign: 'center' }}>
                      {status !== 'idle' && stateIcon(status)}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: status === 'done' ? 'line-through' : 'none',
                      flex: 1,
                    }}>
                      {getTaskLabel(task)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Execute Button / Footer */}
      {!isDone && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(130,90,255,0.2)' }}>
          <button
            onClick={handleExecute}
            disabled={isRunning || targetCount === 0}
            style={{
              width: '100%',
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: isRunning || targetCount === 0
                ? 'rgba(130,90,255,0.3)'
                : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: isRunning || targetCount === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              boxShadow: (isRunning || targetCount === 0) ? 'none' : '0 2px 12px rgba(124,58,237,0.4)',
            }}
          >
            {isRunning ? (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', animation: 'spin 1s linear infinite' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
                EXECUTING... ({completedCount}/{targetCount})
              </>
            ) : (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
                START EXECUTION
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Message Renderer ───────────────────────────────────────────────────────────
function MessageContent({ content, appsCatalog, tweaksCatalog, onExecutePlan }) {
  const isWizard = hasSetupWizard(content);
  const planBlock = !isWizard ? extractPlanBlock(content) : null;
  const displayText = stripCommandTags(content);

  return (
    <div>
      {displayText && (
        <div className="chat-message-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown>
        </div>
      )}
      {isWizard && (
        <SetupWizardCard
          appsCatalog={appsCatalog}
          tweaksCatalog={tweaksCatalog}
          onExecute={onExecutePlan}
        />
      )}
      {planBlock && (
        <PlanCard
          planText={planBlock}
          appsCatalog={appsCatalog}
          tweaksCatalog={tweaksCatalog}
          onExecute={onExecutePlan}
        />
      )}
    </div>
  );
}

// ── Thinking Indicator ────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '6px 2px' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--accent-bright)',
            opacity: 0.7,
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Agent Step Renderer ───────────────────────────────────────────────────────
function AgentStepCard({ step }) {
  if (step.type === 'thinking') {
    return <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.message}</div>;
  }
  if (step.type === 'searching') {
    return <div style={{ fontSize: 12, color: 'var(--accent)' }}>🔍 {step.message}</div>;
  }
  if (step.type === 'search_result') {
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Found {step.results.length} results for "{step.query}"</div>
      </div>
    );
  }
  if (step.type === 'running_cmd') {
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>⚡ Executing PowerShell...</div>
        <div style={{ background: '#0f172a', padding: 8, borderRadius: 6, fontSize: 11, fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre' }}>
          {step.cmd}
        </div>
      </div>
    );
  }
  if (step.type === 'cmd_result') {
    return (
      <div style={{ marginTop: 4 }}>
        <div style={{ background: '#000', padding: 8, borderRadius: 6, fontSize: 11, fontFamily: 'monospace', color: '#a3a3a3', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
          {step.output}
        </div>
      </div>
    );
  }
  if (step.type === 'cmd_rejected') {
    return <div style={{ fontSize: 12, color: '#ef4444' }}>❌ User rejected command: `{step.cmd}`</div>;
  }
  if (step.type === 'error') {
    return <div style={{ fontSize: 12, color: '#ef4444' }}>❌ {step.message}</div>;
  }
  return null;
}

// ── Main Chat Interface ───────────────────────────────────────────────────────
export default function ChatInterface({
  history,
  isLoading,
  onSendMessage,
  onOpenSettings,
  onClearHistory,
  onExecutePlan,
  appsCatalog,
  tweaksCatalog,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !isLoading) {
      onSendMessage(trimmed);
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Quick suggestion chips
  const suggestions = [
    { text: 'Fresh Windows setup', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { text: 'Disable telemetry', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
    { text: 'Performance tweaks', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg> },
    { text: 'Gaming setup', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 12h4m-2-2v4m10-4h.01M16 12h.01M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0z"/></svg> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
          <h2 className="font-display" style={{ fontSize: '13px', letterSpacing: '0.05em' }}>TINKER Terminal</h2>
          {isLoading && (
            <span style={{ fontSize: 10, color: 'var(--accent-bright)', animation: 'pulse 1s ease-in-out infinite' }}>
              ● THINKING
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-ghost btn-icon"
            title="New conversation"
            onClick={onClearHistory}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.01"/>
            </svg>
          </button>
          <button className="btn btn-ghost btn-icon" title="Settings" onClick={onOpenSettings}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {history.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 300 }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', color: 'var(--accent-bright)' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
            <div className="font-display" style={{ fontSize: '13px', letterSpacing: '0.08em', marginBottom: 6 }}>TINKER READY</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Ask me anything — I can optimize your Windows, run terminal commands, search the web, install apps, or guide you through a fresh setup.
            </div>
            {/* Quick suggestion chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(s.text)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: 20,
                    border: '1px solid var(--accent-border)',
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent-bright)',
                    fontSize: 11,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.background = 'var(--accent-border)'}
                  onMouseLeave={e => e.target.style.background = 'var(--accent-subtle)'}
                >
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {history.map((msg, i) => (
              <div
                key={i}
                className="animate-slide-up"
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(130,90,255,0.2), rgba(80,60,180,0.25))'
                    : 'var(--bg-elevated)',
                  border: `1px solid ${msg.role === 'user' ? 'var(--accent-border)' : 'var(--border)'}`,
                  padding: '10px 14px',
                  borderRadius: 12,
                  borderBottomRightRadius: msg.role === 'user' ? 3 : 12,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 3 : 12,
                  fontSize: '13px',
                  lineHeight: '1.6',
                }}
              >
                {msg.role === 'assistant' ? (
                  <MessageContent
                    content={msg.content}
                    appsCatalog={appsCatalog}
                    tweaksCatalog={tweaksCatalog}
                    onExecutePlan={onExecutePlan}
                  />
                ) : msg.role === 'agent_step' && (msg.step.type === 'thinking' || msg.step.type === 'waiting_confirmation') ? (
                  <AgentStepCard step={msg.step} />
                ) : msg.role === 'user' ? (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                ) : null}
              </div>
            ))}
            {/* Thinking indicator */}
            {isLoading && (
              <div className="animate-slide-up" style={{
                alignSelf: 'flex-start',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                padding: '10px 14px',
                borderRadius: 12,
                borderBottomLeftRadius: 3,
              }}>
                <ThinkingDots />
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {/* Agent always active indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(130,90,255,0.15)',
            border: '1px solid rgba(130,90,255,0.35)',
            color: 'var(--accent-bright)',
            padding: '3px 9px', borderRadius: 12, fontSize: 10, fontWeight: 700,
            boxShadow: '0 0 8px rgba(130,90,255,0.2)'
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            AGENT ACTIVE
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Terminal access enabled · Commands logged below</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask TINKER anything, or give it a task..."
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              overflow: 'hidden',
              minHeight: 38,
              maxHeight: 120,
              lineHeight: '1.5',
              padding: '8px 12px',
              border: '1px solid rgba(130,90,255,0.5)',
              background: 'rgba(130,90,255,0.05)',
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!input.trim() || isLoading}
            style={{ flexShrink: 0, height: 38, width: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            {isLoading ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
