import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { GameState, LANE_WIDTH, ObstacleType, SEGMENT_LENGTH } from '../types';

export const Player: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Animation Refs (Limbs)
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const { gameState, endGame, collectCoin, speed, segments, recycleSegment } = useGameStore();
  
  // Movement State
  const [lane, setLane] = useState(0); // -1 (Left), 0 (Center), 1 (Right)
  const [isJumping, setIsJumping] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  
  // Physics State
  const velocityY = useRef(0);
  const positionZ = useRef(0);
  const targetX = useRef(0);

  const playJumpVoice = () => {
    const utterance = new SpeechSynthesisUtterance("desucchiami le palle, crazy");
    utterance.rate = 1.3;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    
    // Try to find an Italian voice for better pronunciation, otherwise fallback
    const voices = window.speechSynthesis.getVoices();
    const itVoice = voices.find(v => v.lang.startsWith('it'));
    if (itVoice) {
        utterance.voice = itVoice;
    }

    window.speechSynthesis.cancel(); // Cancel previous speech if jumping quickly
    window.speechSynthesis.speak(utterance);
  };
  
  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          setLane((prev) => Math.max(prev - 1, -1));
          break;
        case 'ArrowRight':
        case 'd':
          setLane((prev) => Math.min(prev + 1, 1));
          break;
        case 'ArrowUp':
        case 'w':
          if (!isJumping && !isSliding) {
            setIsJumping(true);
            velocityY.current = 12; // Jump force
            playJumpVoice();
          }
          break;
        case 'ArrowDown':
        case 's':
          if (!isSliding && !isJumping) {
            setIsSliding(true);
            setTimeout(() => setIsSliding(false), 800); // Slide duration
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isJumping, isSliding]);

  // Swipe Support (Touch)
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameState !== GameState.PLAYING) return;
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal
        if (dx > 50) setLane((prev) => Math.min(prev + 1, 1));
        else if (dx < -50) setLane((prev) => Math.max(prev - 1, -1));
      } else {
        // Vertical
        if (dy < -50 && !isJumping && !isSliding) {
          setIsJumping(true);
          velocityY.current = 12;
          playJumpVoice();
        } else if (dy > 50 && !isSliding && !isJumping) {
          setIsSliding(true);
          setTimeout(() => setIsSliding(false), 800);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, isJumping, isSliding]);

  useFrame((state, delta) => {
    if (!meshRef.current || gameState !== GameState.PLAYING) return;

    // Forward Movement simulation
    const moveDist = speed * delta;
    positionZ.current -= moveDist;
    meshRef.current.position.z = positionZ.current;

    // Lane Smoothing (Lerp)
    targetX.current = lane * LANE_WIDTH;
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX.current, delta * 10);

    // Jump Physics
    if (isJumping) {
      meshRef.current.position.y += velocityY.current * delta;
      velocityY.current -= 35 * delta; // Gravity
      
      if (meshRef.current.position.y <= 0) {
        meshRef.current.position.y = 0;
        setIsJumping(false);
        velocityY.current = 0;
      }
    } else if (isSliding) {
       // Visual scale handled in render
    } else {
      meshRef.current.position.y = 0;
    }

    // --- ANIMATION LOGIC ---
    const time = state.clock.getElapsedTime();
    const runFreq = speed * 1.5;

    if (isJumping) {
        // JUMP POSE: Arms Up, Legs Tucked Back
        const jumpLerpSpeed = delta * 15;
        if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 2.8, jumpLerpSpeed); // Arms high
        if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 2.8, jumpLerpSpeed);
        
        if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -0.5, jumpLerpSpeed);
        if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -0.8, jumpLerpSpeed);
    } 
    else if (isSliding) {
         // Slide pose - Superman style or just tucked
         if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1.5, delta * 10);
         if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.5, delta * 10);
         if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, delta * 10);
         if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, delta * 10);
    }
    else {
        // RUNNING CYCLE: Limbs oscillate
        const armAngle = Math.sin(time * runFreq) * 0.8;
        const legAngle = Math.sin(time * runFreq) * 0.8;
        
        if (leftArmRef.current) leftArmRef.current.rotation.x = armAngle;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -armAngle; // Opposite phase
        
        if (leftLegRef.current) leftLegRef.current.rotation.x = -legAngle; // Left leg opposite left arm
        if (rightLegRef.current) rightLegRef.current.rotation.x = legAngle;
    }


    // Camera Follow
    state.camera.position.z = positionZ.current + 6;
    state.camera.position.y = 4;
    state.camera.position.x = meshRef.current.position.x * 0.3; // Slight lean
    state.camera.lookAt(meshRef.current.position.x * 0.1, 1, positionZ.current - 10);

    // Map Recycling Logic
    const firstSeg = segments[0];
    if (positionZ.current < firstSeg.z - SEGMENT_LENGTH) {
        recycleSegment();
        useGameStore.getState().updateScore(10);
    }

    // Collision Detection
    const playerBox = new THREE.Box3().setFromObject(meshRef.current);
    playerBox.expandByScalar(-0.2); 

    for (const seg of segments) {
        if (Math.abs(seg.z - positionZ.current) > 10) continue;

        seg.lanes.forEach((obs, laneIndex) => {
            if (obs === ObstacleType.NONE) return;

            const obsX = (laneIndex - 1) * LANE_WIDTH;
            const obsZ = seg.z;
            
            const xOverlap = Math.abs(meshRef.current.position.x - obsX) < 0.8;
            const zOverlap = Math.abs(positionZ.current - obsZ) < 0.8;

            if (xOverlap && zOverlap) {
                let hit = false;
                if (obs === ObstacleType.PILLAR) hit = true; 
                if (obs === ObstacleType.WALL_LOW && !isJumping) hit = true; 
                if (obs === ObstacleType.WALL_HIGH && !isSliding) hit = true; 

                if (hit) {
                    endGame();
                }
            }
        });

        seg.coins.forEach((hasCoin, laneIndex) => {
            if (!hasCoin) return;
            const coinX = (laneIndex - 1) * LANE_WIDTH;
            const coinZ = seg.z;

            const xOverlap = Math.abs(meshRef.current.position.x - coinX) < 0.8;
            const zOverlap = Math.abs(positionZ.current - coinZ) < 1.0;
            
            if (xOverlap && zOverlap) {
                if (seg.coins[laneIndex]) {
                    seg.coins[laneIndex] = false;
                    collectCoin();
                }
            }
        });
    }

  });

  // ANDREA TORELLI MODEL (Low Poly / Voxel style)
  // Skin: #eebb99
  // Jacket: Black/Charcoal #1a1a1a
  // Beanie: Black #111111 with Gold logo
  return (
    <group ref={meshRef}>
      {/* Scale group for sliding */}
      <group scale={[1, isSliding ? 0.5 : 1, 1]} position={[0, isSliding ? -0.25 : 0, 0]}>
        
        {/* --- HEAD GROUP --- */}
        <group position={[0, 1.6, 0]}>
            {/* Face/Head */}
            <mesh castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#eebb99" /> {/* Skin */}
            </mesh>
            
            {/* Beanie (Black) */}
            <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.52, 0.35, 0.52]} />
                <meshStandardMaterial color="#111111" />
            </mesh>
            {/* Beanie Logo (Carhartt style - white/gold rect) */}
            <mesh position={[0, 0.35, 0.27]}>
                <planeGeometry args={[0.12, 0.12]} />
                <meshStandardMaterial color="#ddaa00" /> 
            </mesh>

            {/* Mustache/Beard */}
            <mesh position={[0, -0.1, 0.26]}>
                <boxGeometry args={[0.2, 0.05, 0.02]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0, -0.22, 0.26]}>
                 <boxGeometry args={[0.15, 0.08, 0.02]} />
                 <meshStandardMaterial color="#1a1a1a" />
            </mesh>
        </group>

        {/* --- TORSO (Black Jacket) --- */}
        <group position={[0, 0.9, 0]}>
             {/* Jacket Main */}
            <mesh castShadow>
                <boxGeometry args={[0.6, 0.9, 0.4]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Zipper Line */}
            <mesh position={[0, 0, 0.21]}>
                <boxGeometry args={[0.02, 0.9, 0.01]} />
                <meshStandardMaterial color="#555" />
            </mesh>
             {/* Collar area */}
             <mesh position={[0, 0.4, 0.1]}>
                 <boxGeometry args={[0.62, 0.2, 0.3]} />
                 <meshStandardMaterial color="#111" />
             </mesh>
        </group>

        {/* --- RIGGED LIMBS --- */}
        
        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.4, 1.35, 0]}>
            {/* Pivot point is shoulder */}
            <mesh position={[0, -0.3, 0]} castShadow>
                <boxGeometry args={[0.22, 0.6, 0.22]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0, -0.65, 0]} castShadow>
                 <boxGeometry args={[0.18, 0.15, 0.18]} />
                 <meshStandardMaterial color="#eebb99" />
            </mesh>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.4, 1.35, 0]}>
            <mesh position={[0, -0.3, 0]} castShadow>
                <boxGeometry args={[0.22, 0.6, 0.22]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
             <mesh position={[0, -0.65, 0]} castShadow>
                 <boxGeometry args={[0.18, 0.15, 0.18]} />
                 <meshStandardMaterial color="#eebb99" />
            </mesh>
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.15, 0.45, 0]}>
            {/* Pivot point is hip */}
            <mesh position={[0, -0.25, 0]} castShadow>
                <boxGeometry args={[0.24, 0.5, 0.3]} />
                <meshStandardMaterial color="#0a0a0a" />
            </mesh>
        </group>
        
        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.15, 0.45, 0]}>
             <mesh position={[0, -0.25, 0]} castShadow>
                <boxGeometry args={[0.24, 0.5, 0.3]} />
                <meshStandardMaterial color="#0a0a0a" />
            </mesh>
        </group>

      </group>
    </group>
  );
};