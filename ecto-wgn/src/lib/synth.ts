export type SynthType = 'siren' | 'blaster' | 'ghost' | 'trap' | 'slime' | 'geiger';

type NodeRegistry = (node: AudioScheduledSourceNode) => void;
type TimeoutRegistry = (id: number) => void;

export function playSynth(
  ctx: AudioContext, 
  dest: AudioNode, 
  type: SynthType,
  registerNode: NodeRegistry,
  registerTimeout: TimeoutRegistry
) {
  switch (type) {
    case 'siren':   return playSiren(ctx, dest, registerNode);
    case 'blaster': return playBlaster(ctx, dest, registerNode);
    case 'ghost':   return playGhost(ctx, dest, registerNode);
    case 'trap':    return playTrap(ctx, dest, registerNode, registerTimeout);
    case 'slime':   return playSlime(ctx, dest, registerNode);
    case 'geiger':  return playGeiger(ctx, dest, registerNode, registerTimeout);
  }
}

function playSiren(ctx: AudioContext, dest: AudioNode, reg: NodeRegistry) {
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = 'sawtooth';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(900, now + 0.6);
  osc.frequency.linearRampToValueAtTime(300, now + 1.2);
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
  osc.connect(gain); gain.connect(dest);
  osc.start(now); osc.stop(now + 1.2);
  reg(osc);
}

function playBlaster(ctx: AudioContext, dest: AudioNode, reg: NodeRegistry) {
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = 'triangle';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.35);
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
  osc.connect(gain); gain.connect(dest);
  osc.start(now); osc.stop(now + 0.35);
  reg(osc);
}

function playGhost(ctx: AudioContext, dest: AudioNode, reg: NodeRegistry) {
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
  osc.type = 'sine'; lfo.type = 'sine'; lfo.frequency.value = 6;
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.linearRampToValueAtTime(750, now + 0.4);
  osc.frequency.linearRampToValueAtTime(500, now + 0.8);
  osc.frequency.linearRampToValueAtTime(650, now + 1.1);
  lfoGain.gain.setValueAtTime(30, now);
  lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);
  osc.connect(gain); gain.connect(dest);
  lfo.start(now); osc.start(now);
  lfo.stop(now + 1.1); osc.stop(now + 1.1);
  reg(osc); reg(lfo);
}

function playTrap(ctx: AudioContext, dest: AudioNode, reg: NodeRegistry, regTimeout: TimeoutRegistry) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.linearRampToValueAtTime(150, now + 0.8);
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
  osc.connect(gain); gain.connect(dest);
  osc.start(now); osc.stop(now + 0.8);
  reg(osc);

  const timeoutId = window.setTimeout(() => {
    const noise = ctx.createBufferSource();
    const bufSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const out = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) out[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 2500;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(dest);
    noise.start();
    reg(noise);
  }, 600);
  regTimeout(timeoutId);
}

function playSlime(ctx: AudioContext, dest: AudioNode, reg: NodeRegistry) {
  const now = ctx.currentTime;
  const bufSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const out = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) out[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource(); noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.linearRampToValueAtTime(200, now + 0.4);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  noise.connect(filter); filter.connect(gain); gain.connect(dest);
  noise.start(now);
  reg(noise);
}

function playGeiger(ctx: AudioContext, dest: AudioNode, reg: NodeRegistry, regTimeout: TimeoutRegistry) {
  for (let i = 0; i < 8; i++) {
    const delay = i * 80 + Math.random() * 20;
    const timeoutId = window.setTimeout(() => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200 + Math.random() * 400, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
      osc.connect(gain); gain.connect(dest);
      osc.start(); osc.stop(ctx.currentTime + 0.03);
      reg(osc);
    }, delay);
    regTimeout(timeoutId);
  }
}