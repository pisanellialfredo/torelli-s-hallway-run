
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { LANE_WIDTH, ObstacleType, SegmentData, SEGMENT_LENGTH } from '../types';

const Coin: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if(ref.current) {
            ref.current.rotation.y += delta * 3;
        }
    });
    return (
        <group ref={ref} position={position}>
            {/* Rotate mesh 90deg on X to make the cylinder stand up like a coin */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
                <meshStandardMaterial color="gold" emissive="#aa8800" emissiveIntensity={0.5} />
            </mesh>
        </group>
    );
};

// Procedural Checkered Floor Tile
const CheckeredFloor: React.FC = () => {
    // Create a grid of tiles for one segment length (10 units)
    // Width is approx 3 lanes * 2.5 = 7.5. Let's do 4 tiles wide, 5 tiles long per segment
    const tiles = useMemo(() => {
        const t = [];
        const rows = 5;
        const cols = 4;
        const tileWidth = 2.5; 
        const tileLength = 2.0;
        
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                const isWhite = (r + c) % 2 === 0;
                // Offset so center is 0
                const x = (c * tileWidth) - (cols * tileWidth / 2) + (tileWidth/2);
                const z = (r * tileLength) - (rows * tileLength / 2) + (tileLength/2);
                t.push({ x, z, color: isWhite ? '#dddddd' : '#8899a6' });
            }
        }
        return t;
    }, []);

    return (
        <group position={[0, -0.05, 0]}>
            {tiles.map((tile, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[tile.x, 0, tile.z]} receiveShadow>
                    <planeGeometry args={[2.5, 2]} />
                    <meshStandardMaterial color={tile.color} roughness={0.5} />
                </mesh>
            ))}
        </group>
    );
};

// Drop Ceiling
const Ceiling: React.FC = () => {
    return (
        <group position={[0, 3.5, 0]}>
             {/* Main white ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[12, SEGMENT_LENGTH]} />
                <meshStandardMaterial color="#f0f0f0" />
            </mesh>
            {/* Grid lines helper visual */}
            <gridHelper args={[12, 6, 0xcccccc, 0xcccccc]} rotation={[0, 0, 0]} position={[0, -0.01, 0]} />
            
            {/* Fluorescent Lights */}
            <mesh position={[0, -0.05, 0]} rotation={[Math.PI/2, 0, 0]}>
                <planeGeometry args={[1, 4]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
        </group>
    );
};

// Wall Decorations
const WallDecoration: React.FC<{ variant: number, position: [number, number, number] }> = ({ variant, position }) => {
    if (variant === 0) return null;

    // 1: Door
    if (variant === 1) {
        return (
            <group position={position}>
                {/* Frame */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.1, 2.5, 1.4]} />
                    <meshStandardMaterial color="#4a3c31" />
                </mesh>
                {/* Door */}
                <mesh position={[-0.02, 0, 0]}>
                    <boxGeometry args={[0.1, 2.4, 1.2]} />
                    <meshStandardMaterial color="#7c6a56" />
                </mesh>
                {/* Handle */}
                <mesh position={[-0.08, -0.1, 0.45]}>
                    <sphereGeometry args={[0.05]} />
                    <meshStandardMaterial color="silver" />
                </mesh>
            </group>
        );
    }

    // 2: Notice Board
    if (variant === 2) {
        return (
            <group position={position}>
                 {/* Frame */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.05, 1.2, 1.8]} />
                    <meshStandardMaterial color="#8b4513" />
                </mesh>
                {/* Cork */}
                <mesh position={[-0.03, 0, 0]}>
                    <boxGeometry args={[0.01, 1.1, 1.7]} />
                    <meshStandardMaterial color="#d2b48c" />
                </mesh>
                {/* Paper 1 */}
                <mesh position={[-0.04, 0.2, -0.4]} rotation={[0, 0, 0.1]}>
                    <planeGeometry args={[0.3, 0.4]} />
                    <meshBasicMaterial color="white" side={THREE.DoubleSide} />
                </mesh>
                 {/* Paper 2 */}
                 <mesh position={[-0.04, -0.1, 0.3]} rotation={[0, 0, -0.1]}>
                    <planeGeometry args={[0.4, 0.3]} />
                    <meshBasicMaterial color="#ffffcc" side={THREE.DoubleSide} />
                </mesh>
            </group>
        );
    }

    // 3: Fire Extinguisher
    if (variant === 3) {
        return (
            <group position={position}>
                {/* Tank */}
                <mesh position={[-0.1, -0.2, 0]}>
                    <cylinderGeometry args={[0.15, 0.15, 0.6]} />
                    <meshStandardMaterial color="#cc0000" />
                </mesh>
                {/* Nozzle */}
                <mesh position={[-0.1, 0.15, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.1]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            </group>
        );
    }

    // 4: Poster
    if (variant === 4) {
        return (
            <group position={position}>
                <mesh rotation={[0, -Math.PI/2, 0]}>
                    <planeGeometry args={[1.0, 1.4]} />
                    <meshBasicMaterial color="#336699" />
                </mesh>
                <mesh rotation={[0, -Math.PI/2, 0]} position={[-0.01, 0, 0]}>
                     <planeGeometry args={[0.8, 1.2]} />
                     <meshBasicMaterial color="#ffffff" />
                </mesh>
                 <Text
                    position={[-0.02, 0.2, 0]}
                    rotation={[0, -Math.PI/2, 0]}
                    fontSize={0.15}
                    color="black"
                    anchorX="center"
                    anchorY="middle"
                >
                    EVENT
                </Text>
            </group>
        );
    }

    return null;
};

const Segment: React.FC<{ data: SegmentData }> = ({ data }) => {
  return (
    <group position={[0, 0, data.z]}>
      {/* --- HALLWAY STRUCTURE --- */}
      
      <CheckeredFloor />
      <Ceiling />

      {/* RIGHT WALL: Solid Yellow/Beige Wall */}
      <mesh position={[(LANE_WIDTH * 1.5 + 1), 1.75, 0]} receiveShadow>
          <boxGeometry args={[1, 3.5, SEGMENT_LENGTH]} />
          <meshStandardMaterial color="#e3c886" /> {/* Beige/Yellow from photo */}
      </mesh>
      {/* Baseboard on right wall */}
      <mesh position={[(LANE_WIDTH * 1.5 + 0.6), 0.1, 0]}>
          <boxGeometry args={[0.2, 0.2, SEGMENT_LENGTH]} />
          <meshStandardMaterial color="#333" />
      </mesh>
      
      {/* Wall Decoration */}
      <WallDecoration 
        variant={data.decorationVariant} 
        position={[(LANE_WIDTH * 1.5 + 0.45), 1.8, 0]} 
      />

      {/* Framed Pictures (Legacy - kept for extra variety if decorationVariant is 0, else replaced by new system) */}
      {data.decorationVariant === 0 && data.id.charCodeAt(0) % 3 === 0 && (
           <group position={[(LANE_WIDTH * 1.5 + 0.45), 1.8, 0]}>
                <mesh>
                    <boxGeometry args={[0.1, 1.2, 0.9]} />
                    <meshStandardMaterial color="#5c4033" /> {/* Wood Frame */}
                </mesh>
                <mesh position={[-0.06, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
                    <planeGeometry args={[1, 0.7]} />
                    <meshStandardMaterial color="#fff" /> {/* Canvas */}
                </mesh>
           </group>
      )}

      {/* LEFT SIDE: Blue Railing (Atrium view) */}
      <group position={[-(LANE_WIDTH * 1.5 + 0.2), 0, 0]}>
          {/* Top Rail */}
          <mesh position={[0, 1.1, 0]}>
              <boxGeometry args={[0.2, 0.1, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="#0044aa" roughness={0.2} /> {/* Blue */}
          </mesh>
          {/* Perforated Panel / Grid */}
          <mesh position={[0, 0.55, 0]}>
              <boxGeometry args={[0.05, 1, SEGMENT_LENGTH]} />
              <meshStandardMaterial color="#0044aa" transparent opacity={0.8} /> 
          </mesh>
          {/* Posts */}
          <mesh position={[0, 0.5, -3]}>
               <boxGeometry args={[0.3, 1.2, 0.3]} />
               <meshStandardMaterial color="#003388" />
          </mesh>
          <mesh position={[0, 0.5, 3]}>
               <boxGeometry args={[0.3, 1.2, 0.3]} />
               <meshStandardMaterial color="#003388" />
          </mesh>
      </group>


      {/* --- OBSTACLES & COINS --- */}
      {data.lanes.map((type, index) => {
        const x = (index - 1) * LANE_WIDTH;
        
        return (
            <group key={index}>
                {/* OBSTACLES */}
                
                {/* JUMP OVER: Blue Bench/Low Cabinet */}
                {type === ObstacleType.WALL_LOW && (
                    <group position={[x, 0, 0]}>
                        <mesh position={[0, 0.4, 0]} castShadow>
                            <boxGeometry args={[2, 0.8, 0.4]} />
                            <meshStandardMaterial color="#0044aa" />
                        </mesh>
                        {/* Detail: Perforated holes look */}
                         <mesh position={[0, 0.4, 0.21]}>
                            <planeGeometry args={[1.8, 0.6]} />
                            <meshStandardMaterial color="#002266" />
                        </mesh>
                    </group>
                )}
                
                {/* SLIDE UNDER: Hanging Sign/Board */}
                {type === ObstacleType.WALL_HIGH && (
                    <group position={[x, 0, 0]}>
                        <mesh position={[0, 2.2, 0]} castShadow>
                            <boxGeometry args={[2.4, 1.2, 0.1]} />
                            <meshStandardMaterial color="#dddddd" />
                        </mesh>
                         <mesh position={[0, 2.2, 0.06]}>
                            <planeGeometry args={[2.2, 1]} />
                            <meshStandardMaterial color="#eee" /> {/* White board face */}
                        </mesh>
                        
                        {/* Text on the Board */}
                        {data.highWallTexts[index] && (
                             <Text
                                position={[0, 2.2, 0.07]}
                                fontSize={0.25}
                                color="#000000"
                                anchorX="center"
                                anchorY="middle"
                                maxWidth={2.0}
                                textAlign="center"
                            >
                                {data.highWallTexts[index]}
                            </Text>
                        )}

                        {/* Supports */}
                        <mesh position={[-1.1, 1.5, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, 3]} />
                            <meshStandardMaterial color="#888" />
                        </mesh>
                        <mesh position={[1.1, 1.5, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, 3]} />
                            <meshStandardMaterial color="#888" />
                        </mesh>
                    </group>
                )}

                {/* DODGE: Trash Can (Black/Grey) */}
                {type === ObstacleType.PILLAR && (
                    <group position={[x, 0, 0]}>
                        <mesh position={[0, 0.5, 0]} castShadow>
                            <cylinderGeometry args={[0.4, 0.35, 1, 16]} />
                            <meshStandardMaterial color="#333" roughness={0.2} />
                        </mesh>
                        {/* Trash bag liner */}
                        <mesh position={[0, 1.0, 0]}>
                             <sphereGeometry args={[0.38, 8, 8]} />
                             <meshStandardMaterial color="#111" />
                        </mesh>
                    </group>
                )}

                {/* COINS */}
                {data.coins[index] && type !== ObstacleType.PILLAR && type !== ObstacleType.WALL_LOW && (
                   <Coin position={[x, 1, 0]} />
                )}
                 {/* High coins for jumps */}
                 {data.coins[index] && type === ObstacleType.WALL_LOW && (
                   <Coin position={[x, 2.5, 0]} />
                )}
            </group>
        );
      })}
    </group>
  );
};

export const Track: React.FC = () => {
  const segments = useGameStore((state) => state.segments);
  return (
    <group>
      {segments.map((seg) => (
        <Segment key={seg.id} data={seg} />
      ))}
    </group>
  );
};
