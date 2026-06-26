use serde::Serialize;
use msedge_tts::{
    tts::client::connect_async,
    tts::SpeechConfig,
    voice::get_voices_list_async,
};

#[derive(Serialize, Clone)]
pub struct TtsVoice {
    pub name: String,
    pub short_name: String,
    pub locale: String,
    pub gender: String,
}

fn parse_tts_param(val: &str) -> i32 {
    val.trim_end_matches('%')
        .trim_end_matches("Hz")
        .trim()
        .parse::<i32>()
        .unwrap_or(0)
}

#[tauri::command]
pub async fn edge_tts_list_voices(locale: Option<String>) -> Result<Vec<TtsVoice>, String> {
    let voices = get_voices_list_async()
        .await
        .map_err(|e| format!("Failed to fetch voices: {}", e))?;

    let result: Vec<TtsVoice> = voices
        .into_iter()
        .map(|v| TtsVoice {
            name: v.name.clone(),
            short_name: v.short_name.clone().unwrap_or_default(),
            locale: v.locale.clone().unwrap_or_default(),
            gender: v.gender.clone().unwrap_or_default(),
        })
        .filter(|v| {
            if let Some(ref loc) = locale {
                let prefix = loc.split('-').next().unwrap_or(loc).to_lowercase();
                v.locale.to_lowercase().starts_with(&prefix)
            } else {
                true
            }
        })
        .collect();

    Ok(result)
}

#[tauri::command]
pub async fn edge_tts_synthesize(
    text: String,
    voice: String,
    rate: Option<String>,
    pitch: Option<String>,
    volume: Option<String>,
) -> Result<Vec<u8>, String> {
    if text.trim().is_empty() {
        return Ok(Vec::new());
    }

    let voices = get_voices_list_async()
        .await
        .map_err(|e| format!("Failed to fetch voices: {}", e))?;

    let target_voice = voices.iter().find(|v| v.name == voice || v.short_name.as_deref() == Some(&voice));

    let config = match target_voice {
        Some(v) => {
            let mut c = SpeechConfig::from(v);
            if let Some(r) = rate { c.rate = parse_tts_param(&r); }
            if let Some(p) = pitch { c.pitch = parse_tts_param(&p); }
            if let Some(vol) = volume { c.volume = parse_tts_param(&vol); }
            c
        }
        None => {
            let mut c = SpeechConfig::from(&voices[0]);
            c.voice_name = voice;
            if let Some(r) = rate { c.rate = parse_tts_param(&r); }
            if let Some(p) = pitch { c.pitch = parse_tts_param(&p); }
            if let Some(vol) = volume { c.volume = parse_tts_param(&vol); }
            c
        }
    };

    let mut tts = connect_async()
        .await
        .map_err(|e| format!("TTS connection failed: {}", e))?;

    let audio = tts
        .synthesize(&text, &config)
        .await
        .map_err(|e| format!("TTS synthesis failed: {}", e))?;

    Ok(audio.audio_bytes)
}
