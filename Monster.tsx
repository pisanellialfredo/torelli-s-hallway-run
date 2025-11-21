
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { GameState } from '../types';

export const Monster: React.FC = () => {
  const ref = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const { gameState } = useGameStore();

  useFrame((state) => {
    if (!ref.current) return;

    const currentSpeed = useGameStore.getState().speed;

    // Position Logic
    const playerZ = state.camera.position.z - 6; // Player is roughly at camera.z - 6
    
    // Target Z: Behind player.
    // Default distance: 3.5 units behind player.
    // As speed increases (10 -> 25), reduce distance to make it feel like it's catching up.
    // Speed 10: offset = 0. Speed 25: offset = 1.5.
    const approachOffset = Math.max(0, (currentSpeed - 10) * 0.1);
    
    let targetZ = playerZ + 3.5 - approachOffset; 
    
    if (gameState === GameState.GAME_OVER) {
        targetZ = playerZ - 1.5; // Overtake player
    }

    // Smooth follow on Z
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, targetZ, 0.1);
    // Follow X with delay
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, state.camera.position.x * 0.6, 0.05);
    
    // Base Height + Bobbing
    // Bob frequency increases with speed
    const t = state.clock.elapsedTime;
    const bobFreq = 10 + (currentSpeed * 0.5);
    ref.current.position.y = 1.0 + Math.sin(t * bobFreq) * 0.1; // Lowered base height slightly for smaller scale

    // Look at player
    ref.current.lookAt(state.camera.position.x, 0.5, playerZ - 5);

    // Animation: Running Legs
    if (leftLegRef.current && rightLegRef.current) {
        // Leg speed increases with game speed
        const runSpeed = currentSpeed * 1.5;
        leftLegRef.current.rotation.x = Math.sin(t * runSpeed) * 0.5;
        rightLegRef.current.rotation.x = Math.cos(t * runSpeed) * 0.5;
    }
  });

  const skinColor = "#dcbfa6"; // Tan/Beige
  const innerColor = "#e88898"; // Pink
  const lipColor = "#d00000"; // Red

  return (
    // Reduced scale from 0.45 to 0.25 to be fully visible and match style
    <group ref={ref} position={[0, 1.0, 10]} scale={[0.25, 0.25, 0.25]}>
        
        {/* --- BODY --- */}
        {/* Outer Shell (Almond shape) */}
        <mesh scale={[1.2, 1.8, 0.8]} castShadow>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* Inner Pink Area */}
        <mesh position={[0, -0.1, 0.55]} scale={[0.7, 1.3, 0.4]}>
             <sphereGeometry args={[1, 32, 32]} />
             <meshStandardMaterial color={innerColor} roughness={0.5} />
        </mesh>

        {/* --- FACE --- */}
        <group position={[0, 0.5, 0.9]}>
            {/* Eyes */}
            <group position={[-0.35, 0, 0]} rotation={[0, 0.1, 0]}>
                 <mesh scale={[1, 0.7, 0.5]}>
                     <sphereGeometry args={[0.18, 16, 16]} />
                     <meshStandardMaterial color="white" />
                 </mesh>
                 <mesh position={[0, 0, 0.08]} scale={[1, 1, 0.5]}>
                     <sphereGeometry args={[0.08, 16, 16]} />
                     <meshStandardMaterial color="#33aaff" />
                 </mesh>
                 {/* Eyelids (Half closed - bored look) */}
                 <mesh position={[0, 0.08, 0]} rotation={[0.4, 0, 0]}>
                      <sphereGeometry args={[0.19, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} />
                      <meshStandardMaterial color={skinColor} side={THREE.DoubleSide} />
                 </mesh>
            </group>

             <group position={[0.35, 0, 0]} rotation={[0, -0.1, 0]}>
                 <mesh scale={[1, 0.7, 0.5]}>
                     <sphereGeometry args={[0.18, 16, 16]} />
                     <meshStandardMaterial color="white" />
                 </mesh>
                 <mesh position={[0, 0, 0.08]} scale={[1, 1, 0.5]}>
                     <sphereGeometry args={[0.08, 16, 16]} />
                     <meshStandardMaterial color="#33aaff" />
                 </mesh>
                 {/* Eyelids */}
                 <mesh position={[0, 0.08, 0]} rotation={[0.4, 0, 0]}>
                      <sphereGeometry args={[0.19, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} />
                      <meshStandardMaterial color={skinColor} side={THREE.DoubleSide} />
                 </mesh>
            </group>
        </group>

        {/* Mouth (Red Lips) */}
        <group position={[0, -0.4, 0.95]} scale={[1, 0.8, 1]}>
            <mesh rotation={[0.1, 0, 0]}>
                 <torusGeometry args={[0.25, 0.08, 8, 24, Math.PI]} />
                 <meshStandardMaterial color={lipColor} />
            </mesh>
            <mesh rotation={[0.1 + Math.PI, 0, 0]}>
                 <torusGeometry args={[0.25, 0.08, 8, 24, Math.PI]} />
                 <meshStandardMaterial color={lipColor} />
            </mesh>
        </group>

        {/* Hair (Strands on top) */}
        <group position={[0, 1.7, 0]}>
            <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.05, 0.8]} />
                <meshStandardMaterial color="#8b7355" />
            </mesh>
            <mesh position={[0.2, -0.1, 0]} rotation={[0, 0, -0.5]}>
                <cylinderGeometry args={[0.02, 0.05, 0.7]} />
                <meshStandardMaterial color="#8b7355" />
            </mesh>
             <mesh position={[-0.2, -0.1, 0]} rotation={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.02, 0.05, 0.7]} />
                <meshStandardMaterial color="#8b7355" />
            </mesh>
        </group>


        {/* --- LIMBS --- */}
        
        {/* Arms (Hands on Hips) */}
        <group position={[-1.0, -0.2, 0]}>
            {/* Upper Arm */}
            <mesh rotation={[0, 0, 0.8]} position={[0.4, -0.3, 0]}>
                 <cylinderGeometry args={[0.08, 0.08, 1.0]} />
                 <meshStandardMaterial color={skinColor} />
            </mesh>
            {/* Forearm */}
            <mesh rotation={[0, 0, -0.8]} position={[-0.1, -0.7, 0]}>
                 <cylinderGeometry args={[0.07, 0.07, 0.9]} />
                 <meshStandardMaterial color={skinColor} />
            </mesh>
        </group>
        
        <group position={[1.0, -0.2, 0]}>
             {/* Upper Arm */}
            <mesh rotation={[0, 0, -0.8]} position={[-0.4, -0.3, 0]}>
                 <cylinderGeometry args={[0.08, 0.08, 1.0]} />
                 <meshStandardMaterial color={skinColor} />
            </mesh>
            {/* Forearm */}
            <mesh rotation={[0, 0, 0.8]} position={[0.1, -0.7, 0]}>
                 <cylinderGeometry args={[0.07, 0.07, 0.9]} />
                 <meshStandardMaterial color={skinColor} />
            </mesh>
        </group>


        {/* Legs */}
        <group position={[-0.4, -1.5, 0]} ref={leftLegRef}>
             <mesh position={[0, -0.6, 0]}>
                 <cylinderGeometry args={[0.09, 0.07, 1.4]} />
                 <meshStandardMaterial color={skinColor} />
             </mesh>
             {/* Shoe */}
             <mesh position={[0, -1.3, 0.15]}>
                 <boxGeometry args={[0.2, 0.15, 0.35]} />
                 <meshStandardMaterial color="red" />
             </mesh>
             {/* Heel */}
             <mesh position={[0, -1.3, -0.1]}>
                 <cylinderGeometry args={[0.05, 0.04, 0.2]} />
                 <meshStandardMaterial color="red" />
             </mesh>
        </group>

        <group position={[0.4, -1.5, 0]} ref={rightLegRef}>
             <mesh position={[0, -0.6, 0]}>
                 <cylinderGeometry args={[0.09, 0.07, 1.4]} />
                 <meshStandardMaterial color={skinColor} />
             </mesh>
             {/* Shoe */}
             <mesh position={[0, -1.3, 0.15]}>
                 <boxGeometry args={[0.2, 0.15, 0.35]} />
                 <meshStandardMaterial color="red" />
             </mesh>
             <mesh position={[0, -1.3, -0.1]}>
                 <cylinderGeometry args={[0.05, 0.04, 0.2]} />
                 <meshStandardMaterial color="red" />
             </mesh>
        </group>

    </group>
  );
};
