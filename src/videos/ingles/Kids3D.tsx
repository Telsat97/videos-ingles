import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useVideoConfig} from 'remotion';
import {clamp, useT} from './comuns';
import {Animal3D, LOURO} from './Animal3D';
import {Ambiente, CriancaModelo, LILI} from './CriancaModelo';
import {Ilustracao} from './comuns';
import {COR, TEXTO, TITULO} from './tema';
import type {Cena, Episodio as Ep, Fala, Palavra} from './tipos';

// Vozes: 'crianca' (inglês) e 'animal' (português). 'lili'/'louro' são do piloto k001.
const ehCrianca = (voz?: string) => voz === 'crianca' || voz === 'lili';
const ehAnimal = (voz?: string) => voz === 'animal' || voz === 'louro';
// Gatilhos: 'objeto' (o desenho aparece) e 'palavra' (a criança diz a palavra). 'balao'/'numero' são do piloto.
const ehObjeto = (m?: string) => m === 'objeto' || m === 'balao';
const ehPalavra = (m?: string) => m === 'palavra' || m === 'numero';

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

// Cenários: céu/paredes e chão mudam; ao ar livre há árvores e nuvens, dentro de casa uma parede com janela.
const CENARIOS: Record<string, {fundo: string; chao: string; dentro: boolean; parede?: string}> = {
  jardim: {fundo: 'linear-gradient(180deg, #7CC8FF 0%, #BDE7FF 60%, #E8F7FF 100%)', chao: '#7ED957', dentro: false},
  praia: {fundo: 'linear-gradient(180deg, #5EC2FF 0%, #A8E2FF 55%, #FFE9B0 100%)', chao: '#F6D78B', dentro: false},
  quarto: {fundo: '#F7E3F0', chao: '#C99A6B', dentro: true, parede: '#FFD6EC'},
  cozinha: {fundo: '#FFF4D6', chao: '#E8D3B0', dentro: true, parede: '#FFF1C4'},
  escola: {fundo: '#E3F4E8', chao: '#B88A5A', dentro: true, parede: '#D6F0DC'},
};
export const fundoCenario = (c?: string) => (CENARIOS[c ?? 'jardim'] ?? CENARIOS.jardim).fundo;

const Cenario: React.FC<{t: number; nome?: string}> = ({t, nome}) => {
  const c = CENARIOS[nome ?? 'jardim'] ?? CENARIOS.jardim;
  return (
    <>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[7, 48]} /><meshStandardMaterial color={c.chao} /></mesh>
      {c.dentro ? (
        <>
          <mesh position={[0, 2.5, -2.4]}><planeGeometry args={[12, 6]} /><meshStandardMaterial color={c.parede} /></mesh>
          <mesh position={[1.6, 2.4, -2.38]}><planeGeometry args={[1.3, 1.1]} /><meshStandardMaterial color="#9ED8FF" /></mesh>
          <mesh position={[1.6, 2.4, -2.37]}><planeGeometry args={[1.42, 0.08]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
          <mesh position={[1.6, 2.4, -2.37]}><planeGeometry args={[0.08, 1.22]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
          <mesh position={[-1.9, 0.3, -1.9]}><boxGeometry args={[1, 0.6, 0.6]} /><meshPhysicalMaterial color="#FFB86B" roughness={0.6} /></mesh>
        </>
      ) : (
        <>
          {(nome === 'praia' ? [] : [[-2.3, -2.2], [2.4, -2.5], [-3.2, -4], [3.4, -4.2]]).map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.1, 0.13, 0.8, 10]} /><meshStandardMaterial color="#8B5A2B" /></mesh>
              <mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.6, 20, 16]} /><meshStandardMaterial color="#2E9E4F" /></mesh>
            </group>
          ))}
          {nome === 'praia' && <mesh position={[0, 0.01, -3.5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14, 3]} /><meshStandardMaterial color="#3FB5E8" /></mesh>}
          {[[-2.5, 4.2, -5], [1.8, 4.6, -6], [3.5, 3.8, -5.5]].map(([x, y, z], i) => (
            <group key={`n${i}`} position={[x + 0.15 * Math.sin(t * 0.2 + i), y, z]}>
              {[-0.35, 0, 0.35].map((dx, k) => (
                <mesh key={k} position={[dx, k === 1 ? 0.15 : 0, 0]}><sphereGeometry args={[0.4, 16, 12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
              ))}
            </group>
          ))}
        </>
      )}
    </>
  );
};

// O desenho da palavra (emoji em ilustração Twemoji) entra quicando e flutua entre as personagens.
const Objeto: React.FC<{cena: Cena}> = ({cena}) => {
  const {frame, fps, t} = useT();
  if (!cena.imagem || cena.baloes) return null;
  const f = cena.falas.find((x) => ehObjeto(x.mostra)) ?? cena.falas[0];
  const ini = cena.desafio ? cena.inicio : f.inicio;
  if (t < ini - 0.05) return null;
  const m = spring({frame: frame - Math.round(ini * fps), fps, config: {damping: 8, stiffness: 150}});
  const n = Math.max(1, Math.min(5, cena.quantidade ?? 1));
  const tam = n === 1 ? 300 : 190;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', gap: 12}}>
      {Array.from({length: n}, (_, i) => (
        <div key={i} style={{transform: `translateY(${14 * Math.sin(t * 1.6 + i)}px) scale(${m}) rotate(${6 * Math.sin(t * 1.1 + i)}deg)`,
          filter: 'drop-shadow(0 18px 18px rgba(0,0,0,.25))'}}>
          <Ilustracao emoji={cena.imagem!} tam={tam} />
        </div>
      ))}
    </div>
  );
};

// Texto 2D por cima do 3D: número grande + palavra em inglês + tradução, repita, quiz, legenda.
const Placa: React.FC<{cena: Cena}> = ({cena}) => {
  const {frame, fps, t} = useT();
  const fala = cena.falas.find((f) => ehPalavra(f.mostra) || f.mostra === 'todos' || f.mostra === 'resposta');
  if (!fala || !cena.en && !cena.revisao && !cena.desafio) return null;
  const m = spring({frame: frame - Math.round(fala.inicio * fps), fps, config: {damping: 10, stiffness: 160}});
  if (t < fala.inicio) return null;
  // Piloto de números: algarismo grande. Demais episódios: só a palavra (o desenho já está na tela).
  const grande = cena.numero ? `${cena.numero}` : cena.baloes && cena.revisao ? '1 2 3 4 5' : cena.baloes && cena.desafio ? '3 = three' : '';
  const todas = cena.revisao && !cena.baloes ? cena.falas.find((f) => f.mostra === 'todos')?.texto : undefined;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 110, display: 'flex', flexDirection: 'column', alignItems: 'center',
      transform: `scale(${0.6 + 0.4 * m})`, opacity: m}}>
      {grande && <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: cena.revisao || cena.desafio ? 130 : 170, lineHeight: 1, color: '#fff',
        WebkitTextStroke: '10px #1F2A44', paintOrder: 'stroke'}}>{grande}</div>}
      {todas && <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 84, lineHeight: 1.1, color: COR.amarelo, textAlign: 'center',
        WebkitTextStroke: '7px #1F2A44', paintOrder: 'stroke'}}>{todas}</div>}
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

const Legenda: React.FC<{ep: Ep; emojiAnimal: string}> = ({ep, emojiAnimal}) => {
  const {t} = useT();
  const fala = todasFalas(ep).find((f) => f.voz && t >= f.inicio && t < f.fim);
  if (!fala?.texto) return null;
  const en = ehCrianca(fala.voz);
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1420, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: en ? '#FFB4F0' : '#2FBF71', color: COR.tinta, fontFamily: TEXTO, fontWeight: 900, fontSize: 58, lineHeight: 1.2,
        borderRadius: 30, padding: '14px 34px', textAlign: 'center', border: '6px solid #1F2A44'}}>
        {en ? (ep.personagens?.crianca.tipo === 'menino' ? '👦 ' : '👧 ') : `${emojiAnimal} `}{fala.texto}
      </div>
    </div>
  );
};

const EMOJI_ANIMAL: Record<string, string> = {papagaio: '🦜', gato: '🐱', cachorro: '🐶', coelho: '🐰', sapo: '🐸', urso: '🐻'};

export const Kids3D: React.FC<{ep: Ep}> = ({ep}) => {
  const {width, height, fps} = useVideoConfig();
  const {t, frame} = useT();
  const crianca = ep.personagens?.crianca ?? LILI;
  const animal = ep.personagens?.animal ?? LOURO;
  const falas = useMemo(() => todasFalas(ep), [ep]);
  const palavras = useMemo(() => {
    const out: Record<'animal' | 'crianca', Palavra[]> = {animal: [], crianca: []};
    for (const f of falas) if (f.palavras) (ehCrianca(f.voz) ? out.crianca : ehAnimal(f.voz) ? out.animal : []).push(...f.palavras);
    return out;
  }, [falas]);
  const ci = Math.max(0, ep.cenas.findIndex((c, i) => t < c.fim || i === ep.cenas.length - 1));
  const cena = ep.cenas[ci];
  // Balões (só no piloto de números): cada um entra quando é dito pela 1ª vez; nas outras cenas já estão na tela.
  const entradas = Array.from({length: 5}, (_, i) => {
    const c = ep.cenas.find((x) => x.numero === i + 1);
    return c ? (c.falas.find((f) => ehObjeto(f.mostra))?.inicio ?? c.inicio) : Infinity;
  });
  const visiveis = cena.baloes ? (cena.desafio ? 3 : cena.baloes) : 0;
  const aceno = cena.falas.some((f) => f.mostra === 'aceno' && t >= f.inicio && t < f.fim) ? 1 : 0;
  const fc = cena.falas.find((f) => ehCrianca(f.voz) && t >= f.inicio && t < f.fim + 0.6);
  const pulo = fc && (ehPalavra(fc.mostra) || fc.mostra === 'resposta') ? interpolate(t, [fc.inicio, fc.inicio + 0.6], [0, 1], clamp) : 0;
  // A criança olha para o animal quando ele fala (vira o rosto em ~0,3 s) e volta para a câmera depois.
  const fa = falas.find((f) => ehAnimal(f.voz) && t >= f.inicio - 0.3 && t < f.fim + 0.3);
  const olharAnimal = fa ? Math.min(interpolate(t, [fa.inicio - 0.3, fa.inicio], [0, 1], clamp), interpolate(t, [fa.fim, fa.fim + 0.3], [1, 0], clamp)) : 0;
  // Câmera: aproxima devagar e balança de leve (sensação de câmera de desenho animado).
  const zoom = interpolate(t - cena.inicio, [0, 3], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: fundoCenario(cena.cenario)}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0.25 * Math.sin(t * 0.25), 1.35, 7.6 - 0.4 * zoom], fov: 40}}>
        <Ambiente />
        <ambientLight intensity={0.25} />
        <pointLight position={[-0.6, 2.2, 3.5]} intensity={6} distance={9} color="#FFE8D6" />
        <hemisphereLight args={['#EAF6FF', '#7ED957', 0.75]} />
        <directionalLight position={[3, 6, 5]} intensity={1.7} color="#FFF3E0" />
        <directionalLight position={[-4, 3, -3]} intensity={1.1} color="#CDE7FF" />
        <group position={[0, -1.2, 0]}>
          <Cenario t={t} nome={cena.cenario} />
          {Array.from({length: 5}, (_, i) => (
            i < visiveis && t >= entradas[i] - 0.05 || (cena.revisao || cena.encerramento) && i < visiveis
              ? <Balao key={i} i={i} entrada={cena.numero ? entradas[i] : -1} t={t} fps={fps} frame={frame} /> : null
          ))}
          <CriancaModelo c={crianca} boca={aberturaBoca(palavras.crianca, t)} t={t} aceno={aceno} pulo={pulo} olharPara={olharAnimal} />
          <Animal3D a={animal} boca={aberturaBoca(palavras.animal, t)} t={t} />
        </group>
      </ThreeCanvas>
      <Objeto cena={cena} />
      <Placa cena={cena} />
      <Repita fala={cena.falas.find((f) => f.mostra === 'repita')} texto="Sua vez!" />
      <Repita fala={cena.falas.find((f) => f.mostra === 'contagem')} texto={cena.baloes ? 'Quantos?' : 'Pensa…'} />
      <Legenda ep={ep} emojiAnimal={EMOJI_ANIMAL[animal.tipo] ?? '🐾'} />
      <Audio src={staticFile(ep.audio)} />
    </AbsoluteFill>
  );
};
