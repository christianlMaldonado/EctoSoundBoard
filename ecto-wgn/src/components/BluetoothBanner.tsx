import { useState } from 'react';

export function BluetoothBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="bg-yellow-950/80 border border-hazard-yellow text-hazard-yellow p-3 rounded-xl mb-3 flex items-center justify-between text-xs z-30 shadow-lg">
      <div className="flex items-center space-x-2">
        <i className="fa-brands fa-bluetooth text-lg animate-pulse text-hazard-yellow" />
        <div>
          <strong className="block font-bold">WAGON SPEAKER PAIRING</strong>
          <span>Pair your phone to the wagon Bluetooth speaker, then tap any sound.</span>
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-hazard-yellow hover:text-white px-2 py-1 font-bold text-sm"
      >✕</button>
    </div>
  );
}