import {useThree} from '@react-three/fiber';
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {capsula, elipsoide, esfera, intersecao, malha, semiespaco, subtrai, uniao} from './sdf';

// Lili esculpida por campos de distância (ver sdf.ts): rosto, bochechas, queixo e nariz numa superfície só,
// cabelo com franja fundida, mãos com polegar. Olhos são esferas brilhantes encaixadas em órbitas.

const OLHO_X = 0.175, OLHO_Y = 0.02, OLHO_Z = 0.355;

const geometrias = () => {
  const cabeca = uniao(0.06,
    uniao(0.2,
      elipsoide([0, 0.05, -0.03], [0.5, 0.48, 0.47]),
      esfera([-0.2, -0.14, 0.2], 0.21), esfera([0.2, -0.14, 0.2], 0.21),
      elipsoide([0, -0.21, 0.08], [0.28, 0.2, 0.27]),
      elipsoide([-0.47, -0.02, -0.03], [0.06, 0.11, 0.08]), elipsoide([0.47, -0.02, -0.03], [0.06, 0.11, 0.08])),
    elipsoide([0, -0.07, 0.445], [0.045, 0.04, 0.05]));
  const rosto = subtrai(0.05, subtrai(0.05, cabeca, esfera([-OLHO_X, OLHO_Y, OLHO_Z], 0.115)), esfera([OLHO_X, OLHO_Y, OLHO_Z], 0.115));
  // Franja penteada de lado (estilo personagem de animação infantil): duas mechas largas que descem da risca.
  const franja = [
    capsula([-0.4, 0.36, 0.2], [0.12, 0.24, 0.44], 0.13, 0.075),
    capsula([0.1, 0.42, 0.3], [0.34, 0.2, 0.33], 0.1, 0.055),
    capsula([-0.46, 0.3, 0.12], [-0.42, 0.06, 0.25], 0.08, 0.05),
  ];
  const cabelo = uniao(0.06,
    intersecao(elipsoide([0, 0.09, -0.05], [0.555, 0.55, 0.53]), semiespaco([0, 1, -0.75], 0.0)),
    elipsoide([0, 0.3, -0.05], [0.42, 0.28, 0.4]),
    ...franja);
  const tranca = uniao(0.06, elipsoide([0, -0.12, 0], [0.15, 0.22, 0.14]), esfera([0, 0.06, 0], 0.08));
  const vestido = intersecao(
    uniao(0.12, elipsoide([0, 0.9, 0], [0.245, 0.23, 0.19]), capsula([0, 0.86, 0], [0, 0.44, 0], 0.2, 0.43)),
    semiespaco([0, 1, 0], 0.43));
  const pernas = uniao(0.02,
    capsula([-0.12, 0.56, 0], [-0.12, 0.13, 0], 0.075, 0.066), capsula([0.12, 0.56, 0], [0.12, 0.13, 0], 0.075, 0.066),
    capsula([0, 1.04, 0], [0, 1.26, 0], 0.075, 0.08));
  const sapatos = uniao(0.02, elipsoide([-0.12, 0.065, 0.05], [0.1, 0.07, 0.15]), elipsoide([0.12, 0.065, 0.05], [0.1, 0.07, 0.15]));
  const braco = uniao(0.05,
    capsula([0, -0.08, 0], [0, -0.36, 0], 0.056, 0.05),
    esfera([0, -0.42, 0.01], 0.068), esfera([0.045, -0.39, 0.04], 0.03));
  const manga = elipsoide([0, -0.05, 0], [0.1, 0.13, 0.1]);
  const p = 0.011;
  return {
    rosto: malha(rosto, [-0.62, -0.5, -0.6], [0.62, 0.6, 0.62], p),
    cabelo: malha(cabelo, [-0.62, -0.5, -0.62], [0.62, 0.65, 0.62], p),
    tranca: malha(tranca, [-0.2, -0.4, -0.2], [0.2, 0.18, 0.2], p),
    vestido: malha(vestido, [-0.5, 0.4, -0.5], [0.5, 1.2, 0.5], 0.014),
    pernas: malha(pernas, [-0.25, 0.05, -0.15], [0.25, 1.32, 0.15], p),
    sapatos: malha(sapatos, [-0.25, -0.02, -0.15], [0.25, 0.16, 0.25], p),
    braco: malha(braco, [-0.1, -0.52, -0.1], [0.12, 0.02, 0.12], 0.008),
    manga: malha(manga, [-0.12, -0.2, -0.12], [0.12, 0.1, 0.12], 0.01),
  };
};

// Luz ambiente de "estúdio" (RoomEnvironment): reflexos e sombreado suaves, sem baixar nada da internet.
export const Ambiente: React.FC = () => {
  const {gl, scene} = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.22;
  }, [gl, scene]);
  return null;
};

const pele = {color: '#FFB689', roughness: 0.5, sheen: 0.2, sheenColor: '#FFB08A', sheenRoughness: 0.5, emissive: '#7A2E18', emissiveIntensity: 0.3};
const DS = THREE.DoubleSide;

const Olho: React.FC<{x: number; fechado: number; olhar: [number, number]}> = ({x, fechado, olhar}) => (
  <group position={[x, OLHO_Y, OLHO_Z]}>
    <group rotation={[-olhar[1] * 0.3, olhar[0] * 0.35 + x * 0.6, 0]}>
      <mesh><sphereGeometry args={[0.112, 40, 30]} /><meshPhysicalMaterial color="#FFFFFF" roughness={0.15} clearcoat={1} /></mesh>
      <mesh position={[0, 0, 0.083]} scale={[1, 1.06, 0.45]}><sphereGeometry args={[0.07, 32, 24]} /><meshPhysicalMaterial color="#7A4520" roughness={0.25} clearcoat={1} /></mesh>
      <mesh position={[0, 0, 0.103]} scale={[1, 1.06, 0.4]}><sphereGeometry args={[0.038, 24, 16]} /><meshStandardMaterial color="#0E0A08" /></mesh>
      <mesh position={[0.028, 0.035, 0.112]}><sphereGeometry args={[0.018, 12, 10]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
      <mesh position={[-0.022, -0.026, 0.112]}><sphereGeometry args={[0.009, 10, 8]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
    </group>
    {/* pálpebra superior: casca de pele que desce para piscar (só aparece na piscada) */}
    {fechado > 0 && <mesh rotation={[-Math.PI / 2 + (1 - fechado) * -1.05, 0, 0]}>
      <sphereGeometry args={[0.118, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshPhysicalMaterial {...pele} side={DS} />
    </mesh>}
    {/* cílios */}
    <mesh position={[x > 0 ? 0.06 : -0.06, 0.085 - fechado * 0.09, 0.07]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]}>
      <capsuleGeometry args={[0.012, 0.035, 4, 8]} /><meshStandardMaterial color="#2A140C" />
    </mesh>
  </group>
);

export const LiliModelo: React.FC<{boca: number; t: number; aceno: number; pulo: number; olharPara: number}> = ({boca, t, aceno, pulo, olharPara}) => {
  const g = useMemo(geometrias, []);
  const fechado = (t % 3.7) < 0.13 ? 1 : (t % 3.7) < 0.2 ? 0.5 : 0;
  const y = 0.14 * Math.abs(Math.sin(pulo * Math.PI));
  const falando = boca > 0.05;
  const respira = Math.sin(t * 2.2);
  const balanco = 0.05 * Math.sin(t * 1.6);
  // Olhar: procura a câmera e, às vezes, olha para o Louro (olharPara: -1 câmera … 1 Louro).
  const olhar: [number, number] = [0.15 + 0.55 * olharPara + 0.04 * Math.sin(t * 0.7), 0.05 * Math.sin(t * 0.5)];
  return (
    <group position={[-0.78, y, 0.2]} rotation={[0, 0.28 + 0.25 * olharPara * 0.4, 0]}>
      <mesh position={[0, 0.012 - y, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.45, 40]} /><meshBasicMaterial color="#000000" transparent opacity={0.16} /></mesh>
      <mesh geometry={g.pernas}><meshPhysicalMaterial {...pele} side={DS} /></mesh>
      <mesh geometry={g.sapatos}><meshPhysicalMaterial color="#FF4F73" roughness={0.45} clearcoat={0.4} side={DS} /></mesh>
      <group scale={[1 + 0.01 * respira, 1 + 0.012 * respira, 1]}>
        <mesh geometry={g.vestido}><meshPhysicalMaterial color="#7B5CF0" roughness={0.85} sheen={0.4} sheenColor="#C9BBFF" sheenRoughness={0.7} side={DS} /></mesh>
        <mesh position={[0, 0.95, 0.19]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 0.35]}><boxGeometry args={[0.075, 0.075, 0.075]} />
          <meshPhysicalMaterial color="#FFD45C" clearcoat={1} roughness={0.3} /></mesh>
      </group>
      {[-1, 1].map((l) => (
        <group key={l} position={[l * 0.3, 1.02, 0.01]}
          rotation={[l > 0 ? -0.25 * aceno : 0, 0, l * (0.28 + balanco + (l > 0 ? aceno * (2.3 + 0.35 * Math.sin(t * 13)) : 0))]}>
          <mesh geometry={g.manga}><meshPhysicalMaterial color="#7B5CF0" roughness={0.85} sheen={0.4} sheenColor="#C9BBFF" side={DS} /></mesh>
          <mesh geometry={g.braco} scale={[l, 1, 1]}><meshPhysicalMaterial {...pele} side={DS} /></mesh>
        </group>
      ))}
      <group position={[0, 1.62, 0]} rotation={[0.05 * Math.sin(t * 1.3) + (falando ? 0.035 * Math.sin(t * 8) : 0), 0.15 * olharPara, 0.05 * Math.sin(t * 0.9)]}>
        <mesh geometry={g.rosto}><meshPhysicalMaterial {...pele} side={DS} /></mesh>
        <mesh geometry={g.cabelo}><meshPhysicalMaterial color="#4E2614" roughness={0.55} clearcoat={0.2} clearcoatRoughness={0.6} sheen={0.3} sheenColor="#A0602F" side={DS} /></mesh>
        {[-1, 1].map((l) => (
          <group key={l} position={[l * 0.56, 0.12, -0.12]} rotation={[0, 0, l * (0.35 + 0.08 * Math.sin(t * 2.4 + l))]}>
            <mesh geometry={g.tranca}><meshPhysicalMaterial color="#4E2614" roughness={0.55} clearcoat={0.2} sheen={0.3} sheenColor="#A0602F" side={DS} /></mesh>
            <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.075, 0.028, 12, 28]} />
              <meshPhysicalMaterial color="#FF5A7A" clearcoat={1} roughness={0.3} /></mesh>
          </group>
        ))}
        <Olho x={-OLHO_X} fechado={fechado} olhar={olhar} />
        <Olho x={OLHO_X} fechado={fechado} olhar={olhar} />
        {[-1, 1].map((l) => (
          <mesh key={`s${l}`} position={[l * 0.18, 0.2 + (falando ? 0.01 : 0), 0.42]} rotation={[0.2, 0, Math.PI / 2 - l * 0.12]}>
            <capsuleGeometry args={[0.014, 0.085, 4, 8]} /><meshStandardMaterial color="#3A1C0E" /></mesh>
        ))}
        {[-1, 1].map((l) => (
          <mesh key={`b${l}`} position={[l * 0.26, -0.12, 0.395]} scale={[1, 0.6, 0.25]}><sphereGeometry args={[0.08, 20, 14]} />
            <meshStandardMaterial color="#FF8FA3" transparent opacity={0.45} /></mesh>
        ))}
        {falando ? (
          <group position={[0, -0.23, 0.425]}>
            <mesh scale={[1, 0.3 + boca * 0.8, 0.5]}><sphereGeometry args={[0.075, 28, 18]} /><meshStandardMaterial color="#5E1724" /></mesh>
            <mesh position={[0, 0.045 * (0.3 + boca * 0.8), 0.018]} scale={[0.85, 0.18, 0.4]}><sphereGeometry args={[0.07, 20, 12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
            <mesh position={[0, -0.03 * boca, 0.022]} scale={[0.7, 0.32 * boca + 0.05, 0.4]}><sphereGeometry args={[0.065, 20, 12]} /><meshStandardMaterial color="#FF7A8A" /></mesh>
          </group>
        ) : (
          <mesh position={[0, -0.2, 0.44]} rotation={[0.15, 0, Math.PI]}><torusGeometry args={[0.062, 0.014, 12, 28, Math.PI]} /><meshStandardMaterial color="#9B3040" /></mesh>
        )}
      </group>
    </group>
  );
};
