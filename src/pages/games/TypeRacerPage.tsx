import { useState } from 'react';
import { TypeRacerShell } from '../../components/games/typeracer/TypeRacerShell';
import { ModeSelector } from '../../components/games/typeracer/ModeSelector';
import { RaceTrack } from '../../components/games/typeracer/RaceTrack';
import type { TypeRacerConfig } from '../../hooks/useTypeRacer';

export default function TypeRacerPage() {
  const [config, setConfig] = useState<TypeRacerConfig | null>(null);

  return (
    <TypeRacerShell>
      {!config ? (
        <ModeSelector onStart={setConfig} />
      ) : (
        <RaceTrack 
          config={config} 
          onExit={() => setConfig(null)} 
          onRestart={() => setConfig({ ...config })} 
        />
      )}
    </TypeRacerShell>
  );
}
