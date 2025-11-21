import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Player } from './Player';
import { Track } from './Track';
import { Monster } from './Monster';

export const GameScene: React.FC = () => {
  return (
    <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
      <color attach="background" args={['#e0e0e0']} /> {/* Light indoor background */}
      
      {/* Indoor Fluorescent Lighting */}
      <ambientLight intensity={0.7} color="#ffffff" />
      
      {/* Main directional light (sun coming from left windows/atrium) */}
      <directionalLight
        position={[-10, 10, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize={[1024, 1024]}
        color="#ddddff"
      >
         <orthographicCamera attach="shadow-camera" args={[-10, 10, -10, 10, 0.1, 50]} />
      </directionalLight>
      
      {/* Overhead strip lights filler */}
      <pointLight position={[0, 4, 0]} intensity={0.5} distance={10} />

      {/* Indoor Fog - lighter to match hallway distance */}
      <fog attach="fog" args={['#e0e0e0', 5, 35]} />

      <Suspense fallback={null}>
        <group>
          <Player />
          <Monster />
          <Track />
        </group>
      </Suspense>
    </Canvas>
  );
};