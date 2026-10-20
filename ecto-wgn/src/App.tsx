import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { BluetoothBanner } from './components/BluetoothBanner';
import { HazardBar } from './components/HazardBar';
import { VuMeter } from './components/VuMeter';
import { SoundButton } from './components/SoundButton';
import { AlarmButton } from './components/AlarmButton';
import { DEFAULT_SLOTS, useSoundboard } from './hooks/useSoundboard';

export default function App() {
  const { 
    analyser, 
    playSlot, 
    stopCurrentSound, 
    replaceSlot, 
    resetSlot, 
    customSlots, 
    hydrated, 
    playingId,
    startPartyMode,
    stopPartyMode
  } = useSoundboard();
  
  const [alarmActive, setAlarmActive] = useState(false);

  const toggleAlarm = () => {
    if (!alarmActive) {
      setAlarmActive(true);
      startPartyMode();
    } else {
      setAlarmActive(false);
      stopPartyMode();
    }
  };

  useEffect(() => () => { 
    stopCurrentSound();
    stopPartyMode();
  }, [stopCurrentSound, stopPartyMode]);

  return (
    <div className="bg-gray-950 text-ecto font-mono select-none overflow-x-hidden min-h-screen flex flex-col items-center justify-between">
      <HazardBar position="top" />

      <div className="w-full max-w-md flex-1 flex flex-col p-4 relative crt">
        <Header />
        <BluetoothBanner />

        <div className="bg-black/90 border-2 border-ecto/60 rounded-xl p-3 mb-4 neon-glow z-30 relative overflow-hidden">
          <div className="flex justify-between items-center mb-1 text-xs text-ecto/70">
            <span>{alarmActive ? '>>> FULL ALARM PARTY MODE <<<' : 'SYSTEM READY // STANDBY'}</span>
            <span className="text-ecto font-bold">AUDIO: {hydrated ? 'LIVE' : 'LOADING'}</span>
          </div>
          <VuMeter analyser={analyser} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 z-30 flex-1">
          {DEFAULT_SLOTS.map(slot => (
            <SoundButton
              key={slot.id}
              slot={slot}
              isCustom={customSlots.has(slot.id)}
              isPlaying={playingId === slot.id}
              onPlay={() => playSlot(slot)}
              onReplace={(file) => replaceSlot(slot, file).catch(err => alert('Could not load audio: ' + err.message))}
              onReset={() => resetSlot(slot)}
            />
          ))}
        </div>

        <div className="z-30 mb-2">
          <AlarmButton active={alarmActive} onToggle={toggleAlarm} />
        </div>

        <p className="text-center text-[10px] text-gray-500 pb-2">
          Tap the folder icon on any tile to swap in your own MP3 / WAV / OGG.
          Saved locally in your browser &mdash; plays over whatever speaker your phone is paired to.
        </p>
      </div>

      <HazardBar position="bottom" />
    </div>
  );
}