/**
 * WorksAuto Workshop Web Audio Synthesizer
 * Generates a clean, pleasant, dual-frequency bell chime without external audio files.
 * Automatically unlocks browser AudioContext on user interaction.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtxClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  return audioCtx;
}

// Automatically unlock AudioContext on the first user interaction anywhere on the document
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
}

/**
 * Plays the dual-tone workshop notification chime (D5: 587Hz -> A5: 880Hz)
 */
export async function playNotificationChime(isMuted = false): Promise<void> {
  if (isMuted || typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Browser autoplay policy: resume suspended AudioContext
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // --- Tone 1: 587.33 Hz (D5) - Warm bell attack ---
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.46);

    // --- Tone 2: 880 Hz (A5) - Bright harmonic chime ring ---
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now + 0.09);

    gain2.gain.setValueAtTime(0, now + 0.09);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.09);
    osc2.stop(now + 0.72);
  } catch (err) {
    console.debug("Could not play notification sound:", err);
  }
}
