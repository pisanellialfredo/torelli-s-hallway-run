import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { GameState } from '../types';

export const AudioManager: React.FC = () => {
  const { gameState } = useGameStore();
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  
  // Scheduling refs
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const stepRef = useRef(0); // 16 steps
  const isPlayingRef = useRef(false);

  // Initialize AudioContext
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        
        // Master Gain
        masterGainRef.current = audioCtxRef.current.createGain();
        masterGainRef.current.gain.value = 0.3; // Main volume
        
        // Lowpass Filter for intensity control
        filterRef.current = audioCtxRef.current.createBiquadFilter();
        filterRef.current.type = "lowpass";
        filterRef.current.frequency.value = 800; // Start muffled
        filterRef.current.Q.value = 1;

        masterGainRef.current.connect(filterRef.current);
        filterRef.current.connect(audioCtxRef.current.destination);
      }
    };
    
    // Init on mount/click (handled by main UI mostly, but safe here)
    initAudio();
    
    return () => {
       if (timerIDRef.current !== null) clearInterval(timerIDRef.current);
       if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Watch GameState to Start/Stop/Resume
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      isPlayingRef.current = true;
      nextNoteTimeRef.current = audioCtxRef.current?.currentTime || 0;
      stepRef.current = 0;
      
      // Start scheduler
      if (timerIDRef.current === null) {
          timerIDRef.current = window.setInterval(scheduler, 25);
      }
    } else if (gameState === GameState.GAME_OVER || gameState === GameState.MENU) {
      // Stop sequence but keep context alive
      isPlayingRef.current = false;
      // Optional: Play game over sound here?
    }
  }, [gameState]);

  // --- SYNTHESIZERS ---

  const playKick = (time: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc.connect(gain);
    gain.connect(masterGainRef.current);

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.start(time);
    osc.stop(time + 0.5);
  };

  const playSnare = (time: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const bufferSize = audioCtxRef.current.sampleRate * 0.1; // 100ms noise
    const buffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtxRef.current.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtxRef.current.createGain();
    const filter = audioCtxRef.current.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.start(time);
  };

  const playBass = (time: number, note: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = note;

    // Filter per note
    const filter = audioCtxRef.current.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.linearRampToValueAtTime(200, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.25);

    osc.start(time);
    osc.stop(time + 0.3);
  };

  const playLead = (time: number, note: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.type = "square";
    osc.frequency.value = note;

    osc.connect(gain);
    gain.connect(masterGainRef.current);

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);
  };

  // --- SCHEDULER ---

  const scheduler = () => {
    if (!isPlayingRef.current || !audioCtxRef.current) return;
    
    const lookahead = 0.1; // 100ms
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + lookahead) {
        scheduleNote(stepRef.current, nextNoteTimeRef.current);
        advanceNote();
    }
  };

  const advanceNote = () => {
    // Calculate dynamic tempo based on current game speed
    const currentSpeed = useGameStore.getState().speed;
    const baseTempo = 100;
    // Tempo increases with speed: 10 -> 100bpm, 25 -> 160bpm
    const tempo = baseTempo + (currentSpeed - 10) * 4; 
    const secondsPerBeat = 60.0 / tempo;
    const secondsPer16th = secondsPerBeat / 4;
    
    nextNoteTimeRef.current += secondsPer16th;
    stepRef.current = (stepRef.current + 1) % 16;
    
    // Update Filter Intensity based on speed
    // Opens up the filter as speed increases
    if (filterRef.current && audioCtxRef.current) {
        const minFreq = 800;
        const maxFreq = 3000;
        const intensity = Math.min(1, (currentSpeed - 10) / 15); // 0 to 1
        const targetFreq = minFreq + (maxFreq - minFreq) * intensity;
        
        filterRef.current.frequency.setTargetAtTime(targetFreq, audioCtxRef.current.currentTime, 0.1);
    }
  };

  const scheduleNote = (step: number, time: number) => {
    // Rhythm: 16th notes
    // Steps: 0-15
    
    // Kick: 0, 4, 8, 12
    if (step % 4 === 0) {
        playKick(time);
    }

    // Snare: 4, 12
    if (step === 4 || step === 12) {
        playSnare(time);
    }

    // Hihat: Offbeats 2, 6, 10, 14
    if (step % 4 === 2) {
         // Short noise tick
         playLead(time, 8000); // abusing lead function for hihat tick approximation with high freq square
    }

    // Bass Line (C Minorish: C2=65.41, Eb2=77.78, F2=87.31, G2=98.00)
    // Pattern: 0, 2, 3, 6, 8, 10, 11, 14
    const bassNote = 65.41; // C2
    if ([0, 2, 3, 6, 8, 10, 11, 14].includes(step)) {
        let note = bassNote;
        if (step > 8) note = 77.78; // Eb2
        playBass(time, note);
    }

    // Arpeggio Lead (Intensity increases density)
    // C4=261, Eb4=311, G4=392, Bb4=466
    const arpNotes = [261.63, 311.13, 392.00, 466.16];
    // Play lead on every odd step
    if (step % 2 !== 0) {
         const noteIdx = Math.floor(step / 2) % 4;
         // Randomize octave based on intensity?
         playLead(time, arpNotes[noteIdx]);
    }
  };

  return null; // Audio manager has no visual UI
};
