import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-stone-700/80 hover:bg-stone-600 text-stone-100 border border-stone-600/60 transition-colors"
        title="Installa applicazione PWA sul dispositivo"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span>Installa PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-stone-700/80 hover:bg-stone-600 text-stone-100 border border-stone-600/60 transition-colors"
          title="Istruzioni installazione su iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Installa su iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-lg bg-[#21262d] border border-stone-700 p-5 text-stone-200 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-700">
                <h3 className="text-sm font-semibold text-white">Installa Glossa su iOS</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 text-xs leading-relaxed space-y-2 text-stone-300">
                <p>1. Tocca il pulsante <strong>Condividi</strong> (icona quadrato con freccia in alto) nella barra inferiore di Safari.</p>
                <p>2. Scorri verso il basso e seleziona <strong>Aggiungi alla schermata Home</strong>.</p>
                <p>3. Tocca <strong>Aggiungi</strong> in alto a destra.</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-1.5 rounded bg-stone-700 hover:bg-stone-600 text-xs font-medium text-white transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
