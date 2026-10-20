import { useCallback, useEffect, useRef, useState } from 'react';
import { playSynth, type SynthType } from '../lib/synth';
import { deleteSound, getAllSounds, saveSound } from '../lib/soundStorage';

export interface SoundSlot {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  color: 'red' | 'blue' | 'purple' | 'yellow' | 'green' | 'emerald';
  synthType: SynthType;
  defaultUrl?: string;
}

export const DEFAULT_SLOTS: SoundSlot[] = [
  { id: 'siren',   label: 'ECTO SIREN',   subtitle: 'Rising/Falling Wail', icon: 'fa-triangle-exclamation', color: 'red',     synthType: 'siren',   defaultUrl: '/sounds/siren.mp3' },
  { id: 'blaster', label: 'PROTON BLAST', subtitle: 'Plasma Zap',          icon: 'fa-bolt',                 color: 'blue',    synthType: 'blaster', defaultUrl: '/sounds/blaster.mp3' },
  { id: 'ghost',   label: 'GHOST WAIL',   subtitle: 'Theremin Bend',       icon: 'fa-ghost',                color: 'purple',  synthType: 'ghost',   defaultUrl: '/sounds/ghost.mp3' },
  { id: 'trap',    label: 'TRAP SNAP',    subtitle: 'Rumble & Spark',      icon: 'fa-box',                  color: 'yellow',  synthType: 'trap',    defaultUrl: '/sounds/trap.wav' },
  { id: 'slime',   label: 'SLIME SPLAT',  subtitle: 'Squishy Gooey',       icon: 'fa-droplet',              color: 'green',   synthType: 'slime',   defaultUrl: '/sounds/slime.mp3' },
  { id: 'geiger',  label: 'PKE GEIGER',   subtitle: 'Rapid Clicking',      icon: 'fa-radiation',            color: 'emerald', synthType: 'geiger',  defaultUrl: '/sounds/geiger.mp3' },
];

export const PARTY_SLOT: SoundSlot = { 
  id: 'party', label: 'PARTY SONG', subtitle: 'Background Music', icon: 'fa-music', color: 'red', synthType: 'siren', defaultUrl: '/sounds/party.mp3' 
};

// Helper to fetch audio and track progress
async function fetchAudioWithProgress(url: string, onProgress: (pct: number) => void): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
  const contentLength = response.headers.get('content-length');
  const total = parseInt(contentLength || '0', 10);
  const reader = response.body?.getReader();
  
  if (!reader) {
    onProgress(50); // Fallback
    const arrayBuffer = await response.arrayBuffer();
    onProgress(100);
    return arrayBuffer;
  }

  let receivedLength = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    receivedLength += value.length;
    
    if (total > 0) {
      onProgress(Math.round((receivedLength / total) * 100));
    } else {
      onProgress(50); // If server doesn't send content-length
    }
  }

  const chunksAll = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  onProgress(100);
  return chunksAll.buffer;
}

export function useSoundboard() {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const decodedCache = useRef<Map<string, AudioBuffer>>(new Map());
  
  const activeNodes = useRef<AudioScheduledSourceNode[]>([]);
  const activeTimeouts = useRef<number[]>([]);
  const bgNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const [customSlots, setCustomSlots] = useState<Set<string>>(new Set());
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<Record<string, number>>({});

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const node = ctx.createAnalyser();
      node.fftSize = 128;
      node.smoothingTimeConstant = 0.7;
      node.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = node;
      setAnalyser(node);
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const stopCurrentSound = useCallback(() => {
    activeNodes.current.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    activeNodes.current = [];
    activeTimeouts.current.forEach(id => clearTimeout(id));
    activeTimeouts.current = [];
    setPlayingId(null);
  }, []);

  const startPartyMode = useCallback(async () => {
    const ctx = ensureCtx();
    if (!ctx || !analyserRef.current) return;
    
    let buf = decodedCache.current.get(PARTY_SLOT.id);

    if (!buf && PARTY_SLOT.defaultUrl) {
      try {
        // If clicked before background download finishes, fetch now
        const arrayBuffer = await fetchAudioWithProgress(PARTY_SLOT.defaultUrl, (pct) => {
          setLoadingProgress(prev => ({ ...prev, [PARTY_SLOT.id]: pct }));
        });
        buf = await ctx.decodeAudioData(arrayBuffer);
        decodedCache.current.set(PARTY_SLOT.id, buf);
      } catch (e) {
        console.warn(`Failed to load party song`, e);
        return;
      }
    }

    if (buf) {
      if (bgNodeRef.current) {
        try { bgNodeRef.current.stop(); } catch (e) {}
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(analyserRef.current);
      src.start();
      bgNodeRef.current = src;
    }
  }, [ensureCtx]);

  const stopPartyMode = useCallback(() => {
    if (bgNodeRef.current) {
      try { bgNodeRef.current.stop(); } catch (e) {}
      bgNodeRef.current = null;
    }
  }, []);

  // --- HYBRID PRELOAD WITH PROGRESS ---
  useEffect(() => {
    (async () => {
      const ctx = ensureCtx();
      try {
        // 1. Load user uploads from IndexedDB
        const records = await getAllSounds();
        const next = new Set<string>();
        for (const record of records) {
          try {
            const buf = await ctx.decodeAudioData(record.buffer.slice(0));
            decodedCache.current.set(record.id, buf);
            next.add(record.id);
          } catch {}
        }
        setCustomSlots(next);

        // 2. Preload ONLY the short sound effects first (Fast load)
        const sfxPromises = DEFAULT_SLOTS.map(async (slot) => {
          if (decodedCache.current.has(slot.id) || !slot.defaultUrl) return;
          try {
            const arrayBuffer = await fetchAudioWithProgress(slot.defaultUrl, (pct) => {
              setLoadingProgress(prev => ({ ...prev, [slot.id]: pct }));
            });
            const buf = await ctx.decodeAudioData(arrayBuffer);
            decodedCache.current.set(slot.id, buf);
          } catch (e) {}
        });
        
        await Promise.all(sfxPromises);

      } catch (e) {
        console.warn('Failed to load sounds:', e);
      } finally {
        // 3. UI is ready! Unlock the app so you can start pressing buttons.
        setHydrated(true); 

        // 4. Silently download the Party Song in the background AFTER the UI is ready
        if (!decodedCache.current.has(PARTY_SLOT.id) && PARTY_SLOT.defaultUrl) {
          try {
            const arrayBuffer = await fetchAudioWithProgress(PARTY_SLOT.defaultUrl, (pct) => {
              setLoadingProgress(prev => ({ ...prev, [PARTY_SLOT.id]: pct }));
            });
            const buf = await ctx.decodeAudioData(arrayBuffer);
            decodedCache.current.set(PARTY_SLOT.id, buf);
          } catch (e) {}
        }
      }
    })();
  }, [ensureCtx]);

  const playSlot = useCallback(async (slot: SoundSlot) => {
    if (playingId === slot.id) {
      stopCurrentSound();
      return;
    }
    stopCurrentSound();
    setPlayingId(slot.id);

    const ctx = ensureCtx();
    if (!ctx || !analyserRef.current) return;
    
    let buf = decodedCache.current.get(slot.id);
    if (!buf && slot.defaultUrl) {
      try {
        const arrayBuffer = await fetchAudioWithProgress(slot.defaultUrl, () => {});
        buf = await ctx.decodeAudioData(arrayBuffer);
        decodedCache.current.set(slot.id, buf);
      } catch (e) {}
    }

    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(analyserRef.current);
      src.onended = () => {
        setPlayingId(current => current === slot.id ? null : current);
        activeNodes.current = activeNodes.current.filter(n => n !== src);
      };
      activeNodes.current.push(src);
      src.start();
    } else {
      playSynth(ctx, analyserRef.current, slot.synthType, (node) => activeNodes.current.push(node), (id) => activeTimeouts.current.push(id));
      setTimeout(() => setPlayingId(current => current === slot.id ? null : current), 1500); 
    }
  }, [ensureCtx, playingId, stopCurrentSound]);

  const replaceSlot = useCallback(async (slot: SoundSlot, file: File) => {
    const ctx = ensureCtx();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    await saveSound({ id: slot.id, name: file.name, mimeType: file.type || 'audio/mpeg', buffer: arrayBuffer });
    decodedCache.current.set(slot.id, decoded);
    setCustomSlots(prev => new Set(prev).add(slot.id));
  }, [ensureCtx]);

  const resetSlot = useCallback(async (slot: SoundSlot) => {
    await deleteSound(slot.id);
    decodedCache.current.delete(slot.id);
    setCustomSlots(prev => {
      const next = new Set(prev);
      next.delete(slot.id);
      return next;
    });
  }, []);

  return { ensureCtx, analyser, playSlot, stopCurrentSound, replaceSlot, resetSlot, customSlots, hydrated, playingId, startPartyMode, stopPartyMode, loadingProgress };
}