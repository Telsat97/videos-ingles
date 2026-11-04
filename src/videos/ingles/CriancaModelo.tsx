import {useThree} from '@react-three/fiber';
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {capsula, elipsoide, esfera, intersecao, malha, semiespaco, subtrai, uniao} from './sdf';
import type {Crianca} from './tipos';

// Criança esculpida por campos de distância (ver sdf.ts): rosto, bochechas, queixo e nariz numa superfície só,
// cabelo com franja fundida, mãos com polegar. Olhos são esferas brilhantes encaixadas em órbitas.

const OLHO_X = 0.175, OLHO_Y = 0.02, OLHO_Z = 0.355;

type Estilo = Crianca['cabelo']['estilo'];

const geometrias = (estilo: Estilo, tipo: Crianca['tipo']) => {
  const cabeca = uniao(0.06,
    uniao(0.2,
      elipsoide([0, 0.05, -0.03], [0.5, 0.48, 0.47]),
      esfera([-0.2, -0.14, 0.2], 0.21), esfera([0.2, -0.14, 0.2], 0.21),
      elipsoide([0, -0.21, 0.08], [0.28, 0.2, 0.27]),
      elipsoide([-0.47, -0.02, -0.03], [0.06, 0.11, 0.08]), elipsoide([0.47, -0.02, -0.03], [0.06, 0.11, 0.08])),
    elipsoide([0, -0.07, 0.445], [0.045, 0.04, 0.05]));
  const rosto = subtrai(0.05, subtrai(0.05, cabeca, esfera([-OLHO_X, OLHO_Y, OLHO_Z], 0.115)), esfera([OLHO_X, OLHO_Y, OLHO_Z], 0.115));
  // Cabelo por estilo. Todos partem de uma calota que deixa a testa livre (semiespaço inclinado).
  const calota = (folga: number, linha: number) =>
    intersecao(elipsoide([0, 0.09, -0.05], [0.53 + folga, 0.53 + folga, 0.51 + folga]), semiespaco([0, 1, -0.75], linha));
  const franjaLado = [
    capsula([-0.4, 0.36, 0.2], [0.12, 0.24, 0.44], 0.13, 0.075),
    capsula([0.1, 0.42, 0.3], [0.34, 0.2, 0.33], 0.1, 0.055),
    capsula([-0.46, 0.3, 0.12], [-0.42, 0.06, 0.25], 0.08, 0.05),
  ];
  const cachos = (raio: number, n: number, folga: number) => Array.from({length: n}, (_, i) => {
    const th = (i / n) * Math.PI * 2 * 3.7, ph = 0.25 + (i / n) * 1.25; // espiral de bolinhas sobre a calota
    const r = 0.5 + folga;
    return esfera([r * Math.sin(ph) * Math.cos(th), 0.09 + r * Math.cos(ph), -0.05 + r * Math.sin(ph) * Math.sin(th) * 0.95], raio);
  }).filter((_, i) => {
    const ph = 0.25 + (i / n) * 1.25, th = (i / n) * Math.PI * 2 * 3.7;
    return !(ph > 0.85 && Math.sin(th) > 0.35); // não cobre o rosto
  });
  const cabelo =
    estilo === 'curto' ? uniao(0.06, calota(0.015, 0.05), capsula([-0.3, 0.42, 0.25], [0.25, 0.36, 0.37], 0.09, 0.06))
    : estilo === 'cacheado' ? uniao(0.05, calota(0.02, 0.0), ...cachos(0.1, 42, 0.04))
    : estilo === 'black' ? uniao(0.1, calota(0.02, 0.0), elipsoide([0, 0.22, -0.1], [0.68, 0.6, 0.62]))
    : uniao(0.06, calota(0.025, 0.0), elipsoide([0, 0.3, -0.05], [0.42, 0.28, 0.4]), ...franjaLado);
  const tranca = uniao(0.06, elipsoide([0, -0.12, 0], [0.15, 0.22, 0.14]), esfera([0, 0.06, 0], 0.08));
  const roupa = tipo === 'menina'
    ? intersecao(uniao(0.12, elipsoide([0, 0.9, 0], [0.245, 0.23, 0.19]), capsula([0, 0.86, 0], [0, 0.44, 0], 0.2, 0.43)), semiespaco([0, 1, 0], 0.43))
    : intersecao(uniao(0.1, elipsoide([0, 0.88, 0], [0.25, 0.25, 0.2]), capsula([0, 0.85, 0], [0, 0.66, 0], 0.22, 0.25)), semiespaco([0, 1, 0], 0.6));
  const shorts = intersecao(uniao(0.06, capsula([-0.12, 0.66, 0], [-0.13, 0.45, 0], 0.12, 0.11), capsula([0.12, 0.66, 0], [0.13, 0.45, 0], 0.12, 0.11)),
    semiespaco([0, 1, 0], 0.44));
  const pernas = uniao(0.02,
    capsula([-0.12, 0.56, 0], [-0.12, 0.13, 0], 0.075, 0.066), capsula([0.12, 0.56, 0], [0.12, 0.13, 0], 0.075, 0.066),
    capsula([0, 1.04, 0], [0, 1.26, 0], 0.075, 0.08));
  const sapatos = uniao(0.02, elipsoide([-0.12, 0.065, 0.05], [0.1, 0.07, 0.15]), elipsoide([0.12, 0.065, 0.05], [0.1, 0.07, 0.15]));
  const braco = uniao(0.05,
    capsula([0, -0.08, 0], [0, -0.36, 0], 0.056, 0.05),
    esfera([0, -0.42, 0.01], 0.068), esfera([0.045, -0.39, 0.04], 0.03));
  const manga = elipsoide([0, -0.05, 0], [0.1, 0.13, 0.1]);
  const p = 0.015; // resolução da malha: mais fino = mais lento para renderizar
  return {
    rosto: malha(rosto, [-0.62, -0.5, -0.6], [0.62, 0.6, 0.62], p),
    cabelo: malha(cabelo, [-0.75, -0.5, -0.75], [0.75, 0.85, 0.7], p),
    tranca: malha(tranca, [-0.2, -0.4, -0.2], [0.2, 0.18, 0.2], p),
    roupa: malha(roupa, [-0.5, 0.4, -0.5], [0.5, 1.2, 0.5], 0.014),
    shorts: tipo === 'menino' ? malha(shorts, [-0.3, 0.4, -0.2], [0.3, 0.75, 0.2], 0.012) : null,
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

// Pele: a própria cor, um pouco de brilho aveludado e um leve "brilho próprio" que imita a luz atravessando a pele.
const materialPele = (cor: string) => ({color: cor, roughness: 0.5, sheen: 0.2, sheenColor: '#FFC0A0', sheenRoughness: 0.5, emissive: cor, emissiveIntensity: 0.14});
const DS = THREE.DoubleSide;

const Olho: React.FC<{x: number; fechado: number; olhar: [number, number]; iris: string; pele: string; cilios: boolean}> = ({x, fechado, olhar, iris, pele, cilios}) => (
  <group position={[x, OLHO_Y, OLHO_Z]}>
    <group rotation={[-olhar[1] * 0.3, olhar[0] * 0.35 + x * 0.6, 0]}>
      <mesh><sphereGeometry args={[0.112, 40, 30]} /><meshPhysicalMaterial color="#FFFFFF" roughness={0.15} clearcoat={1} /></mesh>
      <mesh position={[0, 0, 0.083]} scale={[1, 1.06, 0.45]}><sphereGeometry args={[0.07, 32, 24]} /><meshPhysicalMaterial color={iris} roughness={0.25} clearcoat={1} /></mesh>
      <mesh position={[0, 0, 0.103]} scale={[1, 1.06, 0.4]}><sphereGeometry args={[0.038, 24, 16]} /><meshStandardMaterial color="#0E0A08" /></mesh>
      <mesh position={[0.028, 0.035, 0.112]}><sphereGeometry args={[0.018, 12, 10]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
      <mesh position={[-0.022, -0.026, 0.112]}><sphereGeometry args={[0.009, 10, 8]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
    </group>
    {/* pálpebra superior: casca de pele que desce para piscar (só aparece na piscada) */}
    {fechado > 0 && <mesh rotation={[-Math.PI / 2 + (1 - fechado) * -1.05, 0, 0]}>
      <sphereGeometry args={[0.118, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshPhysicalMaterial {...materialPele(pele)} side={DS} />
    </mesh>}
    {cilios && (
      <mesh position={[x > 0 ? 0.06 : -0.06, 0.085 - fechado * 0.09, 0.07]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]}>
        <capsuleGeometry args={[0.012, 0.035, 4, 8]} /><meshStandardMaterial color="#2A140C" />
      </mesh>
    )}
  </group>
);

// Lili do piloto (k001) quando o roteiro não traz personagens.
export const LILI: Crianca = {nome: 'Lili', tipo: 'menina', pele: '#FFB689', cabelo: {cor: '#4E2614', estilo: 'marias'}, roupa: '#7B5CF0', roupa2: '#FF4F73', olhos: '#7A4520'};

const Tecido: React.FC<{cor: string}> = ({cor}) => <meshPhysicalMaterial color={cor} roughness={0.85} sheen={0.4} sheenColor="#FFFFFF" sheenRoughness={0.7} side={DS} />;

export const CriancaModelo: React.FC<{c: Crianca; boca: number; t: number; aceno: number; pulo: number; olharPara: number}> = ({c, boca, t, aceno, pulo, olharPara}) => {
  const g = useMemo(() => geometrias(c.cabelo.estilo, c.tipo), [c.cabelo.estilo, c.tipo]);
  const fechado = (t % 3.7) < 0.13 ? 1 : (t % 3.7) < 0.2 ? 0.5 : 0;
  const y = 0.14 * Math.abs(Math.sin(pulo * Math.PI));
  const falando = boca > 0.05;
  const respira = Math.sin(t * 2.2);
  const balanco = 0.05 * Math.sin(t * 1.6);
  const pele = materialPele(c.pele);
  const cabelo = <meshPhysicalMaterial color={c.cabelo.cor} roughness={0.55} clearcoat={0.2} clearcoatRoughness={0.6} sheen={0.3} sheenColor="#A0602F" side={DS} />;
  const destaque = c.roupa2 ?? '#FFD45C';
  // Olhar: procura a câmera e, quando o animal fala, olha para ele (olharPara: 0 câmera … 1 animal).
  const olhar: [number, number] = [0.15 + 0.55 * olharPara + 0.04 * Math.sin(t * 0.7), 0.05 * Math.sin(t * 0.5)];
  return (
    <group position={[-0.78, y, 0.2]} rotation={[0, 0.28 + 0.1 * olharPara, 0]}>
      <mesh position={[0, 0.012 - y, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.45, 40]} /><meshBasicMaterial color="#000000" transparent opacity={0.16} /></mesh>
      <mesh geometry={g.pernas}><meshPhysicalMaterial {...pele} side={DS} /></mesh>
      <mesh geometry={g.sapatos}><meshPhysicalMaterial color={destaque} roughness={0.45} clearcoat={0.4} side={DS} /></mesh>
      {g.shorts && <mesh geometry={g.shorts}><Tecido cor={destaque} /></mesh>}
      <group scale={[1 + 0.01 * respira, 1 + 0.012 * respira, 1]}>
        <mesh geometry={g.roupa}><Tecido cor={c.roupa} /></mesh>
        <mesh position={[0, 0.95, 0.19]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 0.35]}><boxGeometry args={[0.075, 0.075, 0.075]} />
          <meshPhysicalMaterial color={destaque} clearcoat={1} roughness={0.3} /></mesh>
      </group>
      {[-1, 1].map((l) => (
        <group key={l} position={[l * 0.3, 1.02, 0.01]}
          rotation={[l > 0 ? -0.25 * aceno : 0, 0, l * (0.28 + balanco + (l > 0 ? aceno * (2.3 + 0.35 * Math.sin(t * 13)) : 0))]}>
          <mesh geometry={g.manga}><Tecido cor={c.roupa} /></mesh>
          <mesh geometry={g.braco} scale={[l, 1, 1]}><meshPhysicalMaterial {...pele} side={DS} /></mesh>
        </group>
      ))}
      <group position={[0, 1.62, 0]} rotation={[0.05 * Math.sin(t * 1.3) + (falando ? 0.035 * Math.sin(t * 8) : 0), 0.15 * olharPara, 0.05 * Math.sin(t * 0.9)]}>
        <mesh geometry={g.rosto}><meshPhysicalMaterial {...pele} side={DS} /></mesh>
        <mesh geometry={g.cabelo}>{cabelo}</mesh>
        {/* marias-chiquinhas (duas) ou rabo de cavalo (um, atrás) */}
        {(c.cabelo.estilo === 'marias' ? [-1, 1] : c.cabelo.estilo === 'rabo' ? [0] : []).map((l) => (
          <group key={l} position={l === 0 ? [0, 0.3, -0.5] : [l * 0.56, 0.12, -0.12]}
            rotation={l === 0 ? [-0.9 + 0.06 * Math.sin(t * 2.4), 0, 0] : [0, 0, l * (0.35 + 0.08 * Math.sin(t * 2.4 + l))]}>
            <mesh geometry={g.tranca}>{cabelo}</mesh>
            <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.075, 0.028, 12, 28]} />
              <meshPhysicalMaterial color={destaque} clearcoat={1} roughness={0.3} /></mesh>
          </group>
        ))}
        <Olho x={-OLHO_X} fechado={fechado} olhar={olhar} iris={c.olhos ?? '#6B3B1C'} pele={c.pele} cilios={c.tipo === 'menina'} />
        <Olho x={OLHO_X} fechado={fechado} olhar={olhar} iris={c.olhos ?? '#6B3B1C'} pele={c.pele} cilios={c.tipo === 'menina'} />
        {[-1, 1].map((l) => (
          <mesh key={`s${l}`} position={[l * 0.18, 0.2 + (falando ? 0.01 : 0), 0.42]} rotation={[0.2, 0, Math.PI / 2 - l * 0.12]}>
            <capsuleGeometry args={[0.014, 0.085, 4, 8]} /><meshStandardMaterial color={c.cabelo.cor} /></mesh>
        ))}
        {[-1, 1].map((l) => (
          <mesh key={`b${l}`} position={[l * 0.26, -0.12, 0.395]} scale={[1, 0.6, 0.25]}><sphereGeometry args={[0.08, 20, 14]} />
            <meshStandardMaterial color="#FF7F96" transparent opacity={0.4} /></mesh>
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
