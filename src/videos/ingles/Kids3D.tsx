import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useVideoConfig} from 'remotion';
import {clamp, useT} from './comuns';
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

const Lili: React.FC<{boca: number; t: number; aceno: number; pulo: number}> = ({boca, t, aceno, pulo}) => {
  const respira = 1 + 0.015 * Math.sin(t * 2.2);
  const piscando = (t % 3.7) < 0.12;
  const y = 0.12 * Math.abs(Math.sin(pulo * Math.PI)); // pulinho de alegria
  return (
    <group position={[-0.9, y, 0]} rotation={[0, 0.35 + 0.05 * Math.sin(t * 0.8), 0]}>
      {/* pernas */}
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, 0.25, 0]}><capsuleGeometry args={[0.07, 0.3, 6, 12]} /><meshStandardMaterial color="#F2C6A0" /></mesh>
      ))}
      {[-0.13, 0.13].map((x) => (
        <mesh key={`s${x}`} position={[x, 0.05, 0.05]}><sphereGeometry args={[0.1, 16, 12]} /><meshStandardMaterial color="#FF6B57" /></mesh>
      ))}
      {/* vestido */}
      <mesh position={[0, 0.72, 0]} scale={[1, respira, 1]}><coneGeometry args={[0.42, 0.75, 24]} /><meshStandardMaterial color="#FFB4F0" /></mesh>
      {/* braços: o direito acena */}
      <mesh position={[-0.33, 0.8, 0]} rotation={[0, 0, 0.5]}><capsuleGeometry args={[0.06, 0.32, 6, 12]} /><meshStandardMaterial color="#F2C6A0" /></mesh>
      <group position={[0.3, 0.95, 0]} rotation={[0, 0, -0.5 - aceno * (1.6 + 0.4 * Math.sin(t * 14))]}>
        <mesh position={[0, -0.18, 0]}><capsuleGeometry args={[0.06, 0.32, 6, 12]} /><meshStandardMaterial color="#F2C6A0" /></mesh>
      </group>
      {/* cabeça */}
      <group position={[0, 1.48, 0]} rotation={[0.05 * Math.sin(t * 1.3), 0, 0.04 * Math.sin(t * 0.9)]}>
        <mesh><sphereGeometry args={[0.44, 32, 24]} /><meshStandardMaterial color="#F2C6A0" /></mesh>
        <mesh position={[0, 0.12, -0.04]} scale={[1.05, 0.9, 1.05]}><sphereGeometry args={[0.45, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#5B2E1F" /></mesh>
        {[-0.46, 0.46].map((x) => (
          <mesh key={x} position={[x, 0.05, -0.05]}><sphereGeometry args={[0.15, 16, 12]} /><meshStandardMaterial color="#5B2E1F" /></mesh>
        ))}
        {[-0.15, 0.15].map((x) => (
          <group key={x} position={[x, 0.04, 0.38]}>
            <mesh scale={[1, piscando ? 0.1 : 1, 0.6]}><sphereGeometry args={[0.09, 16, 12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
            <mesh position={[0, 0, 0.05]} scale={[1, piscando ? 0.1 : 1, 1]}><sphereGeometry args={[0.05, 12, 10]} /><meshStandardMaterial color="#1B1B26" /></mesh>
          </group>
        ))}
        {[-0.25, 0.25].map((x) => (
          <mesh key={`b${x}`} position={[x, -0.1, 0.36]} scale={[1, 0.6, 0.4]}><sphereGeometry args={[0.07, 12, 10]} /><meshStandardMaterial color="#FF8A8A" /></mesh>
        ))}
        <mesh position={[0, -0.17, 0.41]} scale={[1, 0.25 + boca * 0.9, 0.5]}><sphereGeometry args={[0.07, 16, 12]} /><meshStandardMaterial color="#7A1F2B" /></mesh>
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
      <mesh scale={[0.8, 1.1, 0.8]}><sphereGeometry args={[0.38, 32, 24]} /><meshStandardMaterial color="#2FBF71" /></mesh>
      <mesh position={[0, -0.05, 0.22]} scale={[0.6, 0.8, 0.4]}><sphereGeometry args={[0.3, 24, 16]} /><meshStandardMaterial color="#FFD45C" /></mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * 0.3, 0.02, -0.02]} rotation={[0, 0, l * asa]} scale={[0.35, 0.85, 0.5]}>
          <sphereGeometry args={[0.35, 20, 16]} /><meshStandardMaterial color="#1E9E5A" />
        </mesh>
      ))}
      <mesh position={[0, -0.45, -0.15]} rotation={[0.5, 0, 0]} scale={[0.5, 1.2, 0.3]}><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color="#3D7BF7" /></mesh>
      <group position={[0, 0.5, 0.05]}>
        <mesh><sphereGeometry args={[0.27, 32, 24]} /><meshStandardMaterial color="#2FBF71" /></mesh>
        <mesh position={[0, 0.25, -0.05]} rotation={[-0.4, 0, 0]}><coneGeometry args={[0.07, 0.2, 10]} /><meshStandardMaterial color="#FF4D5E" /></mesh>
        {[-0.12, 0.12].map((x) => (
          <group key={x} position={[x, 0.06, 0.22]}>
            <mesh scale={[1, 1, 0.6]}><sphereGeometry args={[0.07, 14, 10]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
            <mesh position={[0, 0, 0.04]}><sphereGeometry args={[0.04, 10, 8]} /><meshStandardMaterial color="#1B1B26" /></mesh>
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
  // Câmera: aproxima devagar e balança de leve (sensação de câmera de desenho animado).
  const zoom = interpolate(t - cena.inicio, [0, 3], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #7CC8FF 0%, #BDE7FF 60%, #E8F7FF 100%)'}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0.25 * Math.sin(t * 0.25), 1.4, 8.5 - 0.4 * zoom], fov: 42}}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 6, 5]} intensity={1.6} />
        <hemisphereLight args={['#ffffff', '#7ED957', 0.5]} />
        <group position={[0, -1.2, 0]}>
          <Cenario t={t} />
          {Array.from({length: 5}, (_, i) => (
            i < visiveis && t >= entradas[i] - 0.05 || (cena.revisao || cena.encerramento) && i < visiveis
              ? <Balao key={i} i={i} entrada={cena.numero ? entradas[i] : -1} t={t} fps={fps} frame={frame} /> : null
          ))}
          <Lili boca={aberturaBoca(palavras.lili, t)} t={t} aceno={aceno} pulo={pulo} />
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
