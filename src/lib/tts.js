import { invoke } from '@tauri-apps/api/core';

let mediaRecorder;
let audioChunks = [];
let currentAudio = null;

export async function startRecording(onChunk) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      onChunk(audioBlob);
      audioChunks = [];
    };

    mediaRecorder.start();
  } catch (error) {
    console.error("Microphone error:", error);
  }
}

export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

export function stopTTS() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/**
 * Comprehensive text sanitization for TTS.
 * Strips all markdown, code, URLs, HTML, emojis, and special symbols,
 * then replaces remaining symbols with spoken words.
 * Modeled after Jahbaz Academy's EdgeTtsService.sanitize().
 */
export function sanitize(text, langCode = 'en-US') {
  if (!text) return '';

  let s = text;

  // ── Strip code blocks and inline code ──────────────────────
  s = s.replace(/```[\s\S]*?```/g, '');
  s = s.replace(/`[^`]*`/g, '');

  // ── Strip markdown headers ─────────────────────────────────
  s = s.replace(/^#{1,6}\s+/gm, '');

  // ── Strip markdown formatting (bold/italic/strikethrough) ────
  s = s.replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2');

  // ── Strip links, keep text only ──────────────────────────────
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // ── Strip bare URLs ────────────────────────────────────────
  s = s.replace(/https?:\/\/\S+/gi, '');
  s = s.replace(/ftp:\/\/\S+/gi, '');

  // ── Strip HTML tags ────────────────────────────────────────
  s = s.replace(/<[^>]+>/g, '');

  // ── Decode HTML entities ───────────────────────────────────
  s = s.replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&nbsp;/g, ' ')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'");

  // ── Strip emojis and extended pictographs ──────────────────
  s = s.replace(/\p{Extended_Pictographic}/gu, '');

  // ── Strip table separators ─────────────────────────────────
  s = s.replace(/\|/g, ' ');
  s = s.replace(/^[-:| ]+$/gm, '');

  // ── Strip blockquotes and horizontal rules ─────────────────
  s = s.replace(/^>\s*/gm, '');
  s = s.replace(/^[-*_]{3,}$/gm, '');

  // ── Strip system commands ──────────────────────────────────
  s = s.replace(/@run:[\w]+/gi, '');
  s = s.replace(/\[System:[^\]]*\]/gi, '');
  s = s.replace(/NAVIGATE_TO_SLIDE:\d+/g, '');
  s = s.replace(/NEXT_SLIDE/g, '');

  // ── Replace special symbols with spoken words ──────────────
  s = s.replace(/\*/g, '')
       .replace(/#/g, '')
       .replace(/~/g, '')
       .replace(/\^/g, '')
       .replace(/\\/g, '')
       .replace(/@/g, ' at ')
       .replace(/&/g, ' and ')
       .replace(/%/g, ' percent ')
       .replace(/=/g, ' equals ')
       .replace(/\+/g, ' plus ')
       .replace(/</g, '')
       .replace(/>/g, '');

  // ── Collapse whitespace ────────────────────────────────────
  s = s.replace(/\n{2,}/g, '. ');
  s = s.replace(/\n/g, ' ');
  s = s.replace(/\s{2,}/g, ' ').trim();

  // ── Trim leading/trailing punctuation orphans ──────────────
  s = s.replace(/^[,.:;!?]+/, '').replace(/[,.:;!?]+$/, '').trim();

  return s;
}

export async function playTTS(text, voice) {
  try {
    stopTTS();

    const spoken = sanitize(text);
    if (!spoken) return;

    const audioBytes = await invoke('edge_tts_synthesize', {
      text: spoken,
      voice: voice || 'en-US-AriaNeural',
      rate: null,
      pitch: null,
      volume: null,
    });

    if (!audioBytes || audioBytes.length === 0) {
      console.warn('[TTS] No audio bytes returned');
      return;
    }

    const blob = new Blob([new Uint8Array(audioBytes)], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    currentAudio = new Audio(url);

    currentAudio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
    };

    currentAudio.onerror = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
    };

    await currentAudio.play();
  } catch (error) {
    console.error('TTS Error:', error);
  }
}
