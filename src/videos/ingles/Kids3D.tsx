import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useVideoConfig} from 'remotion';
import {clamp, useT} from './comuns';
import {Ambiente, LiliModelo} from './LiliModelo';
import {COR, TEXTO, TITULO} from './tema';
import type {Cena, Episodio as Ep, Fala, Palavra} from './tipos';

// Desenho 3D para crianças (TikTok/Facebook, 9:16): Louro, o papagaio que fala português, e Lili, que fala inglês.
// Tudo é calculado a partir do quadro atual (sem relógio): o render é quadro a quadro e sempre igual.
// Ver serie-ingles/kids/.

const CORES_BALAO = ['#FF4D5E', '#FFC23D', '#38C172', '#3D7BF7', '#A855F7'];

const todasFalas = (ep: Ep) => ep.cenas.flatMap((c) => c.falas);

// Boca: abre e fecha enquanto há palavra sendo dita por aquela voz.
const aberturaBoca = (palavras: Palavra[], t: number) => {
  const p = palavras.find((w) => t >= w.s - 0.03 && t <= w.e);
  if (!p) return 0;
  const k = (t - p.s) / Math.max(0.08, p.e - p.s);
  return 0.35 + 0.65 * Math.abs(Math.sin(k * Math.PI * Math.max(1, Math.round((p.e - p.s) / 0.14))));
};

// Materiais "de desenho atual": pele com brilho suave (sheen), cabelo e sapato com verniz (clearcoat).
const Pele = () => <meshPhysicalMaterial color="#F6C7A6" roughness={0.55} sheen={0.6} sheenColor="#FFD9C8" sheenRoughness={0.5} />;
const Cabelo = () => <meshPhysicalMaterial color="#5C2F1A" roughness={0.5} clearcoat={0.25} clearcoatRoughness={0.6} />;
const Tecido: React.FC<{cor: string}> = ({cor}) => <meshPhysicalMaterial color={cor} roughness={0.75} sheen={0.8} sheenColor="#FFFFFF" sheenRoughness={0.8} />;
const Brilho = () => <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.2} />;

// Olho grande estilo animação: branco, íris castanha com pupila e dois pontos de luz (dá "vida" ao olhar).
const Olho: React.FC<{x: number; fechado: number; olhar: number}> = ({x, fechado, olhar}) => (
  <group position={[x, 0.03, 0.4]} rotation={[0, x * 0.9, 0]} scale={[1, 1 - 0.92 * fechado, 1]}>
    <mesh scale={[1, 1.2, 0.5]}><sphereGeometry args={[0.125, 32, 24]} /><meshPhysicalMaterial color="#FFFFFF" roughness={0.2} clearcoat={1} /></mesh>
    <group position={[olhar * 0.02, -0.01, 0.045]}>
      <mesh scale={[1, 1.1, 0.35]}><sphereGeometry args={[0.088, 32, 24]} /><meshPhysicalMaterial color="#6B3B1C" roughness={0.3} clearcoat={1} /></mesh>
      <mesh position={[0, 0, 0.022]} scale={[1, 1.1, 0.3]}><sphereGeometry args={[0.05, 24, 16]} /><meshStandardMaterial color="#14100E" /></mesh>
      <mesh position={[0.03, 0.045, 0.045]}><sphereGeometry args={[0.022, 12, 10]} /><Brilho /></mesh>
      <mesh position={[-0.025, -0.03, 0.045]}><sphereGeometry args={[0.011, 10, 8]} /><Brilho /></mesh>
    </group>
  </group>
);

const Lili: React.FC<{boca: number; t: number; aceno: number; pulo: number}> = ({boca, t, aceno, pulo}) => {
  const respira = 1 + 0.02 * Math.sin(t * 2.2);
  const fechado = (t % 3.7) < 0.13 ? 1 : 0;
  const y = 0.14 * Math.abs(Math.sin(pulo * Math.PI)); // pulinho de alegria
  const falando = boca > 0.05;
  const balanco = 0.06 * Math.sin(t * 1.6);
  return (
    <group position={[-0.78, y, 0.2]} rotation={[0, 0.28 + 0.05 * Math.sin(t * 0.8), 0]}>
      {/* sombra macia no chão */}
      <mesh position={[0, 0.012 - y, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.42, 32]} /><meshBasicMaterial color="#000000" transparent opacity={0.18} /></mesh>
      {/* pernas, meias e tênis */}
      {[-0.12, 0.12].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.3, 0]}><capsuleGeometry args={[0.072, 0.26, 8, 16]} /><Pele /></mesh>
          <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.078, 0.078, 0.1, 20]} /><Tecido cor="#FFFFFF" /></mesh>
          <mesh position={[0, 0.06, 0.05]} scale={[1, 0.62, 1.45]}><sphereGeometry args={[0.11, 24, 16]} />
            <meshPhysicalMaterial color="#FF5A7A" roughness={0.3} clearcoat={1} /></mesh>
        </group>
      ))}
      {/* saia com babado */}
      <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.26, 0.43, 0.36, 40, 1, true]} /><Tecido cor="#8C6CFF" /></mesh>
      <mesh position={[0, 0.43, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.43, 0.035, 12, 48]} /><Tecido cor="#B9A6FF" /></mesh>
      {/* blusa, gola e coração */}
      <mesh position={[0, 0.88, 0]} scale={[1, respira, 0.86]}><capsuleGeometry args={[0.25, 0.2, 10, 24]} /><Tecido cor="#FFC93C" /></mesh>
      <mesh position={[0, 1.08, 0.02]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.11, 0.03, 10, 32]} /><Tecido cor="#FFFFFF" /></mesh>
      <mesh position={[0, 0.9, 0.23]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 0.3]}><boxGeometry args={[0.08, 0.08, 0.08]} /><Tecido cor="#FF5A7A" /></mesh>
      <mesh position={[0, 1.12, 0]}><cylinderGeometry args={[0.07, 0.08, 0.08, 16]} /><Pele /></mesh>
      {/* braço esquerdo, parado */}
      <group position={[-0.34, 1.0, 0.02]} rotation={[0, 0, -0.3 - balanco]}>
        <mesh position={[0, -0.02, 0]}><sphereGeometry args={[0.095, 20, 16]} /><Tecido cor="#FFC93C" /></mesh>
        <mesh position={[0, -0.22, 0]}><capsuleGeometry args={[0.058, 0.26, 8, 16]} /><Pele /></mesh>
        <mesh position={[0, -0.4, 0]}><sphereGeometry args={[0.072, 20, 16]} /><Pele /></mesh>
      </group>
      {/* braço direito: acena */}
      <group position={[0.34, 1.0, 0.02]} rotation={[0, 0, 0.3 + balanco + aceno * (2.2 + 0.35 * Math.sin(t * 13))]}>
        <mesh position={[0, -0.02, 0]}><sphereGeometry args={[0.095, 20, 16]} /><Tecido cor="#FFC93C" /></mesh>
        <mesh position={[0, -0.22, 0]}><capsuleGeometry args={[0.058, 0.26, 8, 16]} /><Pele /></mesh>
        <mesh position={[0, -0.4, 0]}><sphereGeometry args={[0.072, 20, 16]} /><Pele /></mesh>
      </group>
      {/* cabeça grande (proporção de personagem infantil de animação) */}
      <group position={[0, 1.6, 0]} rotation={[0.05 * Math.sin(t * 1.3) + (falando ? 0.03 * Math.sin(t * 9) : 0), 0, 0.05 * Math.sin(t * 0.9)]}>
        <mesh scale={[1, 0.95, 0.93]}><sphereGeometry args={[0.52, 48, 36]} /><Pele /></mesh>
        {[-1, 1].map((l) => (
          <mesh key={l} position={[l * 0.49, -0.04, -0.02]} scale={[0.6, 1, 0.8]}><sphereGeometry args={[0.1, 20, 16]} /><Pele /></mesh>
        ))}
        {/* cabelo: calota, franja em mechas e duas marias-chiquinhas com laço */}
        <mesh position={[0, 0.04, -0.05]} rotation={[-0.7, 0, 0]} scale={[1.05, 1, 1.05]}>
          <sphereGeometry args={[0.53, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.52]} /><Cabelo /></mesh>
        {[-0.3, -0.12, 0.08, 0.27].map((x, i) => (
          <mesh key={x} position={[x, 0.36 - Math.abs(x) * 0.35, 0.33 - Math.abs(x) * 0.25]} rotation={[0.5, 0, (i - 1.5) * 0.35]}
            scale={[1, 0.62, 0.5]}><sphereGeometry args={[0.15, 24, 16]} /><Cabelo /></mesh>
        ))}
        {[-1, 1].map((l) => (
          <group key={`c${l}`} position={[l * 0.56, 0.1, -0.12]} rotation={[0, 0, l * (-0.5 + 0.08 * Math.sin(t * 2.4 + l))]}>
            <mesh position={[l * 0.1, -0.12, 0]} scale={[0.85, 1.35, 0.85]}><sphereGeometry args={[0.17, 24, 18]} /><Cabelo /></mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.07, 0.03, 10, 24]} /><meshPhysicalMaterial color="#FF5A7A" clearcoat={1} roughness={0.3} /></mesh>
          </group>
        ))}
        <Olho x={-0.18} fechado={fechado} olhar={0.3} />
        <Olho x={0.18} fechado={fechado} olhar={0.3} />
        {[-1, 1].map((l) => (
          <mesh key={`s${l}`} position={[l * 0.18, 0.2, 0.44]} rotation={[0, 0, Math.PI / 2 - l * 0.18]}>
            <capsuleGeometry args={[0.016, 0.1, 4, 8]} /><Cabelo /></mesh>
        ))}
        <mesh position={[0, -0.09, 0.49]} scale={[1.2, 0.9, 1]}><sphereGeometry args={[0.04, 16, 12]} /><Pele /></mesh>
        {[-1, 1].map((l) => (
          <mesh key={`b${l}`} position={[l * 0.3, -0.13, 0.4]} scale={[1, 0.6, 0.3]}><sphereGeometry args={[0.075, 16, 12]} />
            <meshStandardMaterial color="#FF8FA3" transparent opacity={0.55} /></mesh>
        ))}
        {/* boca: sorriso fechado em repouso; abre (com língua) quando fala */}
        {falando ? (
          <group position={[0, -0.24, 0.45]}>
            <mesh scale={[1, 0.3 + boca * 0.75, 0.45]}><sphereGeometry args={[0.085, 24, 16]} /><meshStandardMaterial color="#6E1E2C" /></mesh>
            <mesh position={[0, -0.03 * boca, 0.02]} scale={[0.75, 0.35 * boca, 0.4]}><sphereGeometry args={[0.07, 16, 12]} /><meshStandardMaterial color="#FF7A8A" /></mesh>
          </group>
        ) : (
          <mesh position={[0, -0.2, 0.46]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.07, 0.016, 10, 24, Math.PI]} /><meshStandardMaterial color="#8A2A35" /></mesh>
        )}
      </group>
    </group>
  );
};

const Louro: React.FC<{boca: number; t: number}> = ({boca, t}) => {
  const asa = 0.25 + (boca > 0 ? 0.35 * Math.abs(Math.sin(t * 9)) : 0.05 * Math.sin(t * 2));
  return (
    <group position={[0.95, 1.1 + 0.05 * Math.sin(t * 1.7), 0]} rotation={[0, -0.45, 0]}>
      {/* poleiro */}
      <mesh position={[0, -0.55, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 0.9, 12]} /><meshStandardMaterial color="#8B5A2B" /></mesh>
      <mesh position={[0, -1.1, 0]}><cylinderGeometry args={[0.05, 0.05, 1.1, 12]} /><meshStandardMaterial color="#8B5A2B" /></mesh>
      <mesh scale={[0.8, 1.1, 0.8]}><sphereGeometry args={[0.38, 40, 30]} /><meshPhysicalMaterial color="#2FBF71" roughness={0.6} sheen={0.7} sheenColor="#B8FFD8" /></mesh>
      <mesh position={[0, -0.05, 0.22]} scale={[0.6, 0.8, 0.4]}><sphereGeometry args={[0.3, 24, 16]} /><meshStandardMaterial color="#FFD45C" /></mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * 0.3, 0.02, -0.02]} rotation={[0, 0, l * asa]} scale={[0.35, 0.85, 0.5]}>
          <sphereGeometry args={[0.35, 20, 16]} /><meshStandardMaterial color="#1E9E5A" />
        </mesh>
      ))}
      <mesh position={[0, -0.45, -0.15]} rotation={[0.5, 0, 0]} scale={[0.5, 1.2, 0.3]}><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color="#3D7BF7" /></mesh>
      <group position={[0, 0.5, 0.05]}>
        <mesh><sphereGeometry args={[0.27, 40, 30]} /><meshPhysicalMaterial color="#2FBF71" roughness={0.6} sheen={0.7} sheenColor="#B8FFD8" /></mesh>
        <mesh position={[0, 0.25, -0.05]} rotation={[-0.4, 0, 0]}><coneGeometry args={[0.07, 0.2, 10]} /><meshStandardMaterial color="#FF4D5E" /></mesh>
        {[-0.12, 0.12].map((x) => (
          <group key={x} position={[x, 0.06, 0.2]} rotation={[0, x * 2.5, 0]} scale={(t % 4.3) < 0.12 ? [1, 0.1, 1] : [1, 1, 1]}>
            <mesh scale={[1, 1.15, 0.6]}><sphereGeometry args={[0.085, 24, 16]} /><meshPhysicalMaterial color="#FFFFFF" clearcoat={1} roughness={0.2} /></mesh>
            <mesh position={[0, 0, 0.04]} scale={[1, 1, 0.4]}><sphereGeometry args={[0.055, 20, 14]} /><meshStandardMaterial color="#14100E" /></mesh>
            <mesh position={[0.02, 0.03, 0.065]}><sphereGeometry args={[0.016, 10, 8]} /><Brilho /></mesh>
          </group>
        ))}
        {/* bico: a parte de baixo abre quando ele fala */}
        <mesh position={[0, -0.03, 0.27]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.08, 0.2, 12]} /><meshStandardMaterial color="#FF9F1C" /></mesh>
        <mesh position={[0, -0.1 - boca * 0.05, 0.24]} rotation={[Math.PI / 2 + boca * 0.5, 0, 0]}><coneGeometry args={[0.06, 0.13, 12]} /><meshStandardMaterial color="#E07A00" /></mesh>
      </group>
    </group>
  );
};

const Balao: React.FC<{i: number; entrada: number; t: number; fps: number; frame: number}> = ({i, entrada, t, fps, frame}) => {
  const m = entrada < 0 ? 1 : spring({frame: frame - Math.round(entrada * fps), fps, config: {damping: 9, stiffness: 140}});
  const x = -1.2 + i * 0.6;
  const y = 2.55 + 0.1 * Math.sin(t * 1.4 + i);
  return (
    <group position={[x, y, -0.6]} scale={m}>
      <mesh scale={[1, 1.18, 1]}><sphereGeometry args={[0.26, 32, 24]} /><meshStandardMaterial color={CORES_BALAO[i]} roughness={0.25} /></mesh>
      <mesh position={[0, -0.32, 0]}><coneGeometry args={[0.04, 0.06, 8]} /><meshStandardMaterial color={CORES_BALAO[i]} /></mesh>
      <mesh position={[0, -0.75, 0]}><cylinderGeometry args={[0.006, 0.006, 0.8, 6]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
    </group>
  );
};

const Cenario: React.FC<{t: number}> = ({t}) => (
  <>
    <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[6, 48]} /><meshStandardMaterial color="#7ED957" /></mesh>
    {[[-2.3, -2.2], [2.4, -2.5], [-3.2, -4], [3.4, -4.2]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.1, 0.13, 0.8, 10]} /><meshStandardMaterial color="#8B5A2B" /></mesh>
        <mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.6, 20, 16]} /><meshStandardMaterial color="#2E9E4F" /></mesh>
      </group>
    ))}
    {[[-2.5, 4.2, -5], [1.8, 4.6, -6], [3.5, 3.8, -5.5]].map(([x, y, z], i) => (
      <group key={`n${i}`} position={[x + 0.15 * Math.sin(t * 0.2 + i), y, z]}>
        {[-0.35, 0, 0.35].map((dx, k) => (
          <mesh key={k} position={[dx, k === 1 ? 0.15 : 0, 0]}><sphereGeometry args={[0.4, 16, 12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
        ))}
      </group>
    ))}
    {[-1.6, -0.6, 1.9].map((x, i) => (
      <group key={`f${i}`} position={[x, 0, 0.9 + (i % 2) * 0.3]}>
        <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.012, 0.012, 0.16, 6]} /><meshStandardMaterial color="#2E9E4F" /></mesh>
        <mesh position={[0, 0.18, 0]}><sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color={['#FF6B57', '#FFD45C', '#B07CFF'][i]} /></mesh>
      </group>
    ))}
  </>
);

// Texto 2D por cima do 3D: número grande + palavra em inglês + tradução, repita, quiz, legenda.
const Placa: React.FC<{cena: Cena}> = ({cena}) => {
  const {frame, fps, t} = useT();
  const fala = cena.falas.find((f) => f.mostra === 'numero' || f.mostra === 'todos' || f.mostra === 'resposta');
  if (!fala || !cena.en && !cena.revisao && !cena.desafio) return null;
  const m = spring({frame: frame - Math.round(fala.inicio * fps), fps, config: {damping: 10, stiffness: 160}});
  if (t < fala.inicio) return null;
  const grande = cena.revisao ? '1 2 3 4 5' : cena.desafio ? '3 = three' : `${cena.numero}`;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 110, display: 'flex', flexDirection: 'column', alignItems: 'center',
      transform: `scale(${0.6 + 0.4 * m})`, opacity: m}}>
      <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: cena.revisao || cena.desafio ? 130 : 170, lineHeight: 1, color: '#fff',
        WebkitTextStroke: '10px #1F2A44', paintOrder: 'stroke'}}>{grande}</div>
      {cena.en && (
        <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 100, color: COR.amarelo, WebkitTextStroke: '8px #1F2A44', paintOrder: 'stroke'}}>
          {cena.en.toUpperCase()}
        </div>
      )}
      {cena.pt && <div style={{fontFamily: TEXTO, fontWeight: 900, fontSize: 60, color: '#fff', WebkitTextStroke: '5px #1F2A44', paintOrder: 'stroke'}}>({cena.pt})</div>}
    </div>
  );
};

const Repita: React.FC<{fala?: Fala; texto: string}> = ({fala, texto}) => {
  const {t} = useT();
  if (!fala || t < fala.inicio || t > fala.fim) return null;
  const p = interpolate(t, [fala.inicio, fala.fim], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1400, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24}}>
      <svg width={130} height={130} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={40} fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.4)" strokeWidth={10} />
        <circle cx={50} cy={50} r={40} fill="none" stroke="#FFD45C" strokeWidth={10} strokeDasharray={`${251 * p} 251`} transform="rotate(-90 50 50)" strokeLinecap="round" />
      </svg>
      <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 76, color: '#fff', WebkitTextStroke: '6px #1F2A44', paintOrder: 'stroke'}}>{texto}</div>
    </div>
  );
};

const Legenda: React.FC<{ep: Ep}> = ({ep}) => {
  const {t} = useT();
  const fala = todasFalas(ep).find((f) => f.voz && t >= f.inicio && t < f.fim);
  if (!fala?.texto) return null;
  const en = fala.voz === 'lili';
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1420, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: en ? '#FFB4F0' : '#2FBF71', color: COR.tinta, fontFamily: TEXTO, fontWeight: 900, fontSize: 58, lineHeight: 1.2,
        borderRadius: 30, padding: '14px 34px', textAlign: 'center', border: '6px solid #1F2A44'}}>
        {en ? '👧 ' : '🦜 '}{fala.texto}
      </div>
    </div>
  );
};

export const Kids3D: React.FC<{ep: Ep}> = ({ep}) => {
  const {width, height, fps} = useVideoConfig();
  const {t, frame} = useT();
  const falas = useMemo(() => todasFalas(ep), [ep]);
  const palavras = useMemo(() => {
    const out: Record<'louro' | 'lili', Palavra[]> = {louro: [], lili: []};
    for (const f of falas) if (f.palavras && (f.voz === 'louro' || f.voz === 'lili')) out[f.voz].push(...f.palavras);
    return out;
  }, [falas]);
  const ci = Math.max(0, ep.cenas.findIndex((c, i) => t < c.fim || i === ep.cenas.length - 1));
  const cena = ep.cenas[ci];
  // Balões: cada um entra quando é dito pela 1ª vez (cenas de número); nas outras cenas já estão na tela.
  const entradas = Array.from({length: 5}, (_, i) => {
    const c = ep.cenas.find((x) => x.numero === i + 1);
    return c ? (c.falas.find((f) => f.mostra === 'balao')?.inicio ?? c.inicio) : Infinity;
  });
  const visiveis = cena.desafio ? 3 : cena.baloes ?? 0;
  const aceno = cena.falas.some((f) => f.mostra === 'aceno' && t >= f.inicio && t < f.fim) ? 1 : 0;
  const lili = cena.falas.find((f) => f.voz === 'lili' && t >= f.inicio && t < f.fim + 0.6);
  const pulo = lili && (lili.mostra === 'numero' || lili.mostra === 'resposta') ? interpolate(t, [lili.inicio, lili.inicio + 0.6], [0, 1], clamp) : 0;
  // Lili olha para o Louro quando ele fala (vira o rosto em ~0,3 s) e volta para a câmera depois.
  const falaLouro = falas.find((f) => f.voz === 'louro' && t >= f.inicio - 0.3 && t < f.fim + 0.3);
  const olharLouro = falaLouro ? Math.min(interpolate(t, [falaLouro.inicio - 0.3, falaLouro.inicio], [0, 1], clamp), interpolate(t, [falaLouro.fim, falaLouro.fim + 0.3], [1, 0], clamp)) : 0;
  // Câmera: aproxima devagar e balança de leve (sensação de câmera de desenho animado).
  const zoom = interpolate(t - cena.inicio, [0, 3], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #7CC8FF 0%, #BDE7FF 60%, #E8F7FF 100%)'}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0.25 * Math.sin(t * 0.25), 1.35, 7.6 - 0.4 * zoom], fov: 40}}>
        <Ambiente />
        <ambientLight intensity={0.25} />
        <pointLight position={[-0.6, 2.2, 3.5]} intensity={6} distance={9} color="#FFE8D6" />
        <hemisphereLight args={['#EAF6FF', '#7ED957', 0.75]} />
        <directionalLight position={[3, 6, 5]} intensity={1.7} color="#FFF3E0" />
        <directionalLight position={[-4, 3, -3]} intensity={1.1} color="#CDE7FF" />
        <group position={[0, -1.2, 0]}>
          <Cenario t={t} />
          {Array.from({length: 5}, (_, i) => (
            i < visiveis && t >= entradas[i] - 0.05 || (cena.revisao || cena.encerramento) && i < visiveis
              ? <Balao key={i} i={i} entrada={cena.numero ? entradas[i] : -1} t={t} fps={fps} frame={frame} /> : null
          ))}
          <LiliModelo boca={aberturaBoca(palavras.lili, t)} t={t} aceno={aceno} pulo={pulo} olharPara={olharLouro} />
          <Louro boca={aberturaBoca(palavras.louro, t)} t={t} />
        </group>
      </ThreeCanvas>
      <Placa cena={cena} />
      <Repita fala={cena.falas.find((f) => f.mostra === 'repita')} texto="Sua vez!" />
      <Repita fala={cena.falas.find((f) => f.mostra === 'contagem')} texto="Quantos?" />
      <Legenda ep={ep} />
      <Audio src={staticFile(ep.audio)} />
    </AbsoluteFill>
  );
};
