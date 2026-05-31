// Custom client Web Audio API notification sounds
// No external dependencies needed. Highly reliable and lightweight.

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Create oscillator nodes
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    
    // Cozy warm chord (E5 and G#5)
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc2.frequency.setValueAtTime(830.61, now); // G#5
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (error) {
    console.warn("Failed to play audio chime", error);
  }
}

export function playAlertChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play a dual-tone gentle pulse warning
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'triangle';
    osc2.type = 'sine';
    
    // Gentle warning tone (A4 + C#5)
    osc1.frequency.setValueAtTime(440, now); // A4
    osc1.frequency.setValueAtTime(554.37, now + 0.15); // C#5
    
    osc2.frequency.setValueAtTime(554.37, now);
    osc2.frequency.setValueAtTime(440, now + 0.15);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.03);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (error) {
    console.warn("Failed to play alert chime", error);
  }
}
