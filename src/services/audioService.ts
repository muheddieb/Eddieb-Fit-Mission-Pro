// Audio Synthesizer Service for Rest Timers and Milestone Alerts
// Uses Web Audio API for zero-latency, cross-browser sound generation without external audio file dependencies.

export type RestSoundType = 'beep' | 'whistle' | 'chime' | 'buzzer' | 'bell';

export const AudioService = {
  playSound(type: RestSoundType = 'beep', volume = 0.3): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'beep') {
        // Standard high-clarity dual beep (880Hz -> 1174Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc1.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.18); // D6

        osc1.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.5);
      } else if (type === 'whistle') {
        // Referee / Trainer Whistle with frequency modulation
        const osc = ctx.createOscillator();
        const modOsc = ctx.createOscillator();
        const modGain = ctx.createGain();
        const mainGain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2600, ctx.currentTime);

        modOsc.type = 'sine';
        modOsc.frequency.setValueAtTime(25, ctx.currentTime); // 25Hz trill modulation

        modGain.gain.setValueAtTime(300, ctx.currentTime);
        modOsc.connect(modGain);
        modGain.connect(osc.frequency);

        mainGain.gain.setValueAtTime(volume * 0.8, ctx.currentTime);
        mainGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

        osc.connect(mainGain);
        mainGain.connect(ctx.destination);

        modOsc.start(ctx.currentTime);
        osc.start(ctx.currentTime);
        modOsc.stop(ctx.currentTime + 0.65);
        osc.stop(ctx.currentTime + 0.65);
      } else if (type === 'chime') {
        // Pleasant energetic triad chime (C6 - E6 - G6)
        const notes = [1046.5, 1318.5, 1567.98];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + idx * 0.08;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(volume * 0.5, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.6);
        });
      } else if (type === 'buzzer') {
        // Heavy gym buzzer / horn
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);

        gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.55);
      } else if (type === 'bell') {
        // Boxing ring bell tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.8);

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.85);
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  },

  preview(type: RestSoundType): void {
    this.playSound(type, 0.4);
  },

  playBeep(freq = 880, duration = 0.15, volume = 0.25): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // safe fallback
    }
  },
};
