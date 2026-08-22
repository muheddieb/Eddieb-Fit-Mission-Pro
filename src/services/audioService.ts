// Audio Synthesizer Service for Rest Timers, Set Transitions, Workout Start/End, and Milestones
// Uses Web Audio API for zero-latency, cross-browser sound generation without external audio file dependencies.

export type RestSoundType = 'beep' | 'whistle' | 'chime' | 'buzzer' | 'bell';

export const AudioService = {
  // Play customized tone for rest timer completion
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

  // Short clean beep for incremental actions
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

  // 1. Workout Session Start Cue (Ascending energizing chord C5 -> E5 -> G5 -> C6)
  playWorkoutStartCue(volume = 0.3): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (e) {}
  },

  // 2. Workout Session Finish & Victory Cue (Fanfare celebration sequence)
  playWorkoutEndCue(volume = 0.35): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const fanfare = [
        { freq: 587.33, start: 0.0, dur: 0.15 }, // D5
        { freq: 587.33, start: 0.15, dur: 0.15 }, // D5
        { freq: 587.33, start: 0.3, dur: 0.15 }, // D5
        { freq: 880.00, start: 0.48, dur: 0.6 },  // A5 victory sustained
      ];

      fanfare.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const sTime = ctx.currentTime + start;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, sTime);

        gain.gain.setValueAtTime(volume * 0.5, sTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, sTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(sTime);
        osc.stop(sTime + dur);
      });
    } catch (e) {}
  },

  // 3. Rest Timer Countdown Warning (Tick tone on 3, 2, 1 seconds before rest ends)
  playCountdownWarning(secondsLeft: number, volume = 0.2): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Higher pitch on final 1 second warning
      const freq = secondsLeft === 1 ? 950 : 660;
      const duration = 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  },

  // 3b. Rest Timer 5-Second Warning Prepare Chime (Subtle, pleasant melodic chime signaling user to prepare for next set)
  playPrepareChime(volume = 0.22): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Soft, crystal triad chime chord (A5: 880Hz -> C#6: 1108.73Hz -> E6: 1318.51Hz)
      const chimeTones = [
        { freq: 880.00, startOffset: 0.0, dur: 0.45 },
        { freq: 1108.73, startOffset: 0.09, dur: 0.55 },
        { freq: 1318.51, startOffset: 0.18, dur: 0.65 },
      ];

      chimeTones.forEach(({ freq, startOffset, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + startOffset;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        // Soft attack to keep it gentle & subtle, then exponential decay
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch (e) {}
  },

  // 4. Rest Timer Start Cue (Smooth descending tone signaling recovery start)
  playRestStartCue(volume = 0.25): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } catch (e) {}
  },

  // 5. Rest Timer Skip / End Early Cue
  playRestSkipCue(volume = 0.25): void {
    this.playBeep(750, 0.1, volume);
  },

  // 6. Personal Record (PR) Achievement Fanfare Cue
  // Vibrant, triumphant ascending arpeggio with rich harmonics (C5 -> E5 -> G5 -> C6 -> E6 victory climax)
  playPRAchievementCue(volume = 0.35): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Arpeggio notes: C5, E5, G5, C6, high E6 with brilliance
      const notes = [
        { freq: 523.25, start: 0.0, dur: 0.22, vol: 0.3 },   // C5
        { freq: 659.25, start: 0.09, dur: 0.22, vol: 0.35 }, // E5
        { freq: 783.99, start: 0.18, dur: 0.26, vol: 0.4 },  // G5
        { freq: 1046.50, start: 0.28, dur: 0.45, vol: 0.5 }, // C6
        { freq: 1318.51, start: 0.38, dur: 0.65, vol: 0.6 }, // E6 sustained climax
      ];

      notes.forEach(({ freq, start, dur, vol }) => {
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator(); // harmonic depth
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + start;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq * 0.5, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(volume * vol, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        osc.connect(gain);
        subOsc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        subOsc.start(startTime);
        osc.stop(startTime + dur);
        subOsc.stop(startTime + dur);
      });
    } catch (e) {
      console.warn('PR audio fanfare failed:', e);
    }
  }
};
