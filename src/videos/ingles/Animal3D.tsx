import React from 'react';
import type {Animal} from './tipos';

// O amigo animal do desenho (fala português). Cada episódio escolhe o bicho e as cores no roteiro
// (personagens.animal). Todos piscam, mexem a boca com a fala e balançam o rabo/as asas.

const Pelo: React.FC<{cor: string}> = ({cor}) => <meshPhysicalMaterial color={cor} roughness={0.7} sheen={0.6} sheenColor="#FFFFFF" sheenRoughness={0.6} />;
const Brilho = () => <meshBasicMaterial color="#FFFFFF" />;

const Olho: React.FC<{x: number; y: number; z: number; t: number; tam?: number}> = ({x, y, z, t, tam = 1}) => (
  <group position={[x, y, z]} rotation={[0, x * 2.2, 0]} scale={(t % 4.3) < 0.12 ? [tam, 0.1 * tam, tam] : [tam, tam, tam]}>
    <mesh scale={[1, 1.15, 0.6]}><sphereGeometry args={[0.085, 28, 20]} /><meshPhysicalMaterial color="#FFFFFF" clearcoat={1} roughness={0.2} /></mesh>
    <mesh position={[0, 0, 0.04]} scale={[1, 1.1, 0.4]}><sphereGeometry args={[0.055, 20, 14]} /><meshStandardMaterial color="#14100E" /></mesh>
    <mesh position={[0.02, 0.03, 0.065]}><sphereGeometry args={[0.016, 10, 8]} /><Brilho /></mesh>
    <mesh position={[-0.015, -0.02, 0.065]}><sphereGeometry args={[0.008, 8, 6]} /><Brilho /></mesh>
  </group>
);

const Papagaio: React.FC<{a: Animal; boca: number; t: number}> = ({a, boca, t}) => {
  const asa = 0.25 + (boca > 0 ? 0.35 * Math.abs(Math.sin(t * 9)) : 0.05 * Math.sin(t * 2));
  const cor2 = a.cor2 ?? '#FFD45C';
  return (
    <group position={[0, 1.1 + 0.05 * Math.sin(t * 1.7), 0]}>
      <mesh position={[0, -0.55, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 0.9, 12]} /><meshStandardMaterial color="#8B5A2B" /></mesh>
      <mesh position={[0, -1.1, 0]}><cylinderGeometry args={[0.05, 0.05, 1.1, 12]} /><meshStandardMaterial color="#8B5A2B" /></mesh>
      <mesh scale={[0.8, 1.1, 0.8]}><sphereGeometry args={[0.38, 40, 30]} /><Pelo cor={a.cor} /></mesh>
      <mesh position={[0, -0.05, 0.22]} scale={[0.6, 0.8, 0.4]}><sphereGeometry args={[0.3, 24, 16]} /><Pelo cor={cor2} /></mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * 0.3, 0.02, -0.02]} rotation={[0, 0, l * asa]} scale={[0.35, 0.85, 0.5]}>
          <sphereGeometry args={[0.35, 24, 18]} /><Pelo cor={a.cor} />
        </mesh>
      ))}
      <mesh position={[0, -0.45, -0.15]} rotation={[0.5, 0, 0]} scale={[0.5, 1.2, 0.3]}><sphereGeometry args={[0.2, 16, 12]} /><Pelo cor="#3D7BF7" /></mesh>
      <group position={[0, 0.5, 0.05]} rotation={[boca > 0 ? 0.05 * Math.sin(t * 9) : 0, 0, 0]}>
        <mesh><sphereGeometry args={[0.27, 40, 30]} /><Pelo cor={a.cor} /></mesh>
        <mesh position={[0, 0.25, -0.05]} rotation={[-0.4, 0, 0]}><coneGeometry args={[0.07, 0.2, 10]} /><meshStandardMaterial color="#FF4D5E" /></mesh>
        <Olho x={-0.12} y={0.06} z={0.2} t={t} />
        <Olho x={0.12} y={0.06} z={0.2} t={t} />
        <mesh position={[0, -0.03, 0.27]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.08, 0.2, 12]} /><meshStandardMaterial color="#FF9F1C" /></mesh>
        <mesh position={[0, -0.1 - boca * 0.05, 0.24]} rotation={[Math.PI / 2 + boca * 0.5, 0, 0]}><coneGeometry args={[0.06, 0.13, 12]} /><meshStandardMaterial color="#E07A00" /></mesh>
      </group>
    </group>
  );
};

// Bicho de quatro patas, sentado: gato, cachorro, coelho, urso (só mudam orelhas, rabo, focinho e nariz).
const Sentado: React.FC<{a: Animal; boca: number; t: number}> = ({a, boca, t}) => {
  const cor2 = a.cor2 ?? '#FFF1E0';
  const falando = boca > 0.05;
  const rabo = Math.sin(t * (a.tipo === 'cachorro' ? 9 : 2.5));
  const nariz = a.tipo === 'gato' || a.tipo === 'coelho' ? '#FF8FA3' : '#2A1A14';
  return (
    <group>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.45, 40]} /><meshBasicMaterial color="#000000" transparent opacity={0.16} /></mesh>
      <mesh position={[0, 0.42, 0]} scale={[0.95, 1.05, 0.9]}><sphereGeometry args={[0.4, 40, 30]} /><Pelo cor={a.cor} /></mesh>
      <mesh position={[0, 0.38, 0.2]} scale={[0.65, 0.85, 0.5]}><sphereGeometry args={[0.36, 30, 22]} /><Pelo cor={cor2} /></mesh>
      {[-1, 1].map((l) => (
        <React.Fragment key={l}>
          <mesh position={[l * 0.16, 0.08, 0.3]} scale={[1, 0.7, 1.3]}><sphereGeometry args={[0.11, 20, 14]} /><Pelo cor={a.cor} /></mesh>
          <mesh position={[l * 0.3, 0.12, 0.05]} scale={[1, 0.8, 1.4]}><sphereGeometry args={[0.13, 20, 14]} /><Pelo cor={a.cor} /></mesh>
        </React.Fragment>
      ))}
      {/* rabo */}
      {a.tipo === 'coelho' || a.tipo === 'urso' ? (
        <mesh position={[0, 0.2, -0.38]}><sphereGeometry args={[a.tipo === 'coelho' ? 0.12 : 0.08, 20, 14]} /><Pelo cor={a.tipo === 'coelho' ? '#FFFFFF' : a.cor} /></mesh>
      ) : (
        <group position={[0.15, 0.2, -0.32]} rotation={[0.9, 0, 0.5 + 0.35 * rabo]}>
          <mesh position={[0, 0.25, 0]}><capsuleGeometry args={[0.055, a.tipo === 'gato' ? 0.55 : 0.28, 8, 16]} /><Pelo cor={a.cor} /></mesh>
        </group>
      )}
      <group position={[0, 1.02, 0.05]} rotation={[falando ? 0.05 * Math.sin(t * 9) : 0.03 * Math.sin(t * 1.2), 0, 0.06 * Math.sin(t * 0.8)]}>
        <mesh scale={[1.05, 0.95, 0.95]}><sphereGeometry args={[0.36, 44, 32]} /><Pelo cor={a.cor} /></mesh>
        {/* orelhas */}
        {[-1, 1].map((l) => (
          a.tipo === 'gato' ? (
            <mesh key={l} position={[l * 0.2, 0.3, 0]} rotation={[0, 0, l * -0.35 + 0.05 * Math.sin(t * 3 + l)]}><coneGeometry args={[0.11, 0.22, 4]} /><Pelo cor={a.cor} /></mesh>
          ) : a.tipo === 'coelho' ? (
            <mesh key={l} position={[l * 0.13, 0.5, -0.02]} rotation={[0, 0, l * -0.15 + 0.05 * Math.sin(t * 2 + l)]} scale={[1, 1, 0.6]}>
              <capsuleGeometry args={[0.08, 0.42, 8, 16]} /><Pelo cor={a.cor} /></mesh>
          ) : a.tipo === 'urso' ? (
            <mesh key={l} position={[l * 0.25, 0.28, -0.02]}><sphereGeometry args={[0.1, 20, 14]} /><Pelo cor={a.cor} /></mesh>
          ) : (
            <mesh key={l} position={[l * 0.33, 0.02, -0.02]} rotation={[0, 0, l * 0.3 + 0.08 * rabo]} scale={[0.55, 1.3, 0.35]}>
              <sphereGeometry args={[0.16, 20, 14]} /><Pelo cor={a.cor2 ?? '#8B5A2B'} /></mesh>
          )
        ))}
        <mesh position={[0, -0.1, 0.27]} scale={[1.15, 0.8, 0.75]}><sphereGeometry args={[0.15, 28, 20]} /><Pelo cor={cor2} /></mesh>
        <mesh position={[0, -0.04, 0.39]} scale={[1.3, 1, 0.9]}><sphereGeometry args={[0.04, 16, 12]} /><meshPhysicalMaterial color={nariz} clearcoat={1} roughness={0.3} /></mesh>
        <mesh position={[0, -0.17, 0.33]} scale={[1, 0.15 + boca * 0.9, 0.5]}><sphereGeometry args={[0.065, 20, 14]} /><meshStandardMaterial color="#5E1724" /></mesh>
        <Olho x={-0.13} y={0.08} z={0.26} t={t} tam={0.95} />
        <Olho x={0.13} y={0.08} z={0.26} t={t} tam={0.95} />
      </group>
    </group>
  );
};

const Sapo: React.FC<{a: Animal; boca: number; t: number}> = ({a, boca, t}) => (
  <group position={[0, 0.02 * Math.abs(Math.sin(t * 2)), 0]}>
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.5, 40]} /><meshBasicMaterial color="#000000" transparent opacity={0.16} /></mesh>
    <mesh position={[0, 0.38, 0]} scale={[1.2, 0.85, 1]}><sphereGeometry args={[0.42, 40, 30]} /><Pelo cor={a.cor} /></mesh>
    <mesh position={[0, 0.3, 0.22]} scale={[0.9, 0.6, 0.5]}><sphereGeometry args={[0.38, 30, 22]} /><Pelo cor={a.cor2 ?? '#D9F5A0'} /></mesh>
    {[-1, 1].map((l) => (
      <React.Fragment key={l}>
        <mesh position={[l * 0.2, 0.78, 0.08]}><sphereGeometry args={[0.15, 28, 20]} /><Pelo cor={a.cor} /></mesh>
        <Olho x={l * 0.2} y={0.8} z={0.17} t={t} tam={1.1} />
        <mesh position={[l * 0.35, 0.08, 0.25]} scale={[1.3, 0.5, 1.4]}><sphereGeometry args={[0.1, 20, 14]} /><Pelo cor={a.cor} /></mesh>
      </React.Fragment>
    ))}
    <mesh position={[0, 0.48, 0.38]} scale={[2.6, 0.12 + boca * 0.6, 0.6]}><sphereGeometry args={[0.07, 24, 14]} /><meshStandardMaterial color="#5E1724" /></mesh>
  </group>
);

export const Animal3D: React.FC<{a: Animal; boca: number; t: number}> = ({a, boca, t}) => (
  <group position={[0.92, 0, 0]} rotation={[0, -0.45, 0]}>
    {a.tipo === 'papagaio' ? <Papagaio a={a} boca={boca} t={t} />
      : a.tipo === 'sapo' ? <Sapo a={a} boca={boca} t={t} />
      : <Sentado a={a} boca={boca} t={t} />}
  </group>
);

export const LOURO: Animal = {tipo: 'papagaio', nome: 'Louro', cor: '#2FBF71', cor2: '#FFD45C'};
