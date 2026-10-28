import React, {useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export type Palavra = {w: string; s: number; e: number};
export type Expressao = 'neutro' | 'feliz' | 'surpreso' | 'bravo' | 'confuso';
export type Visual = {pele: string; cabelo: string; roupa: string; detalhe: string; contorno: string};

// ---------- Boca: 6 visemas descritos por parâmetros (interpolar números é mais estável que morphing de path)
type Boca = {abre: number; larg: number; redondo: number; dentes: number};
const VISEMA: Record<'X' | 'M' | 'E' | 'A' | 'O' | 'F', Boca> = {
  X: {abre: 0.04, larg: 0.55, redondo: 0, dentes: 0}, // repouso
  M: {abre: 0, larg: 0.5, redondo: 0, dentes: 0}, // m b p
  E: {abre: 0.35, larg: 0.9, redondo: 0, dentes: 1}, // e i (s z t d)
  A: {abre: 0.95, larg: 0.7, redondo: 0.15, dentes: 0.6}, // a
  O: {abre: 0.6, larg: 0.35, redondo: 1, dentes: 0}, // o u w
  F: {abre: 0.12, larg: 0.6, redondo: 0, dentes: 1}, // f v
};
type V = keyof typeof VISEMA;

// Grafema → visema (aproximação que serve para PT e EN; sem dependências e determinística).
const paraVisemas = (w: string): V[] => {
  const s = w.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
  const out: V[] = [];
  for (const c of s) {
    const v: V | null = 'aá'.includes(c) ? 'A' : 'ei'.includes(c) ? 'E' : 'ouwy'.includes(c) ? 'O'
      : 'mbp'.includes(c) ? 'M' : 'fv'.includes(c) ? 'F' : null;
    if (v && out[out.length - 1] !== v) out.push(v);
  }
  return out.length ? out : ['E'];
};

type Chave = {t: number; v: V};
const ANTECIPA = 0.05; // a boca chega ~1,5 quadro antes do som (senão parece atrasada)
export const chavesDaBoca = (palavras: Palavra[]): Chave[] => {
  const ch: Chave[] = [{t: -1, v: 'X'}];
  palavras.forEach((p, i) => {
    const vs = paraVisemas(p.w);
    const passo = Math.max(0.06, (p.e - p.s) / vs.length); // no máx. ~16 formas/s
    vs.forEach((v, k) => ch.push({t: p.s - ANTECIPA + k * passo, v}));
    const prox = palavras[i + 1];
    // Fecha entre palavras só quando há respiro; em fala corrida a boca não "bate" a cada palavra.
    if (!prox || prox.s - p.e > 0.12) ch.push({t: p.e, v: prox ? 'M' : 'X'});
  });
  return ch.sort((a, b) => a.t - b.t);
};

const bocaEm = (ch: Chave[], t: number): Boca => {
  let i = 0;
  while (i < ch.length - 1 && ch[i + 1].t <= t) i++;
  const a = ch[i], b = ch[i + 1];
  if (!b) return VISEMA[a.v];
  // Segura a forma atual e só migra para a próxima nos ~2 quadros finais (sem "boca de borracha").
  const ini = Math.max(a.t, b.t - 0.07);
  const tr = interpolate(t, [ini, b.t], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  });
  const A = VISEMA[a.v], B = VISEMA[b.v];
  const m = (x: number, y: number) => x + (y - x) * tr;
  return {abre: m(A.abre, B.abre), larg: m(A.larg, B.larg), redondo: m(A.redondo, B.redondo), dentes: m(A.dentes, B.dentes)};
};

// ---------- Expressões: números, não desenhos (misturáveis entre si)
type Rosto = {sobr: number; sobrAlt: number; palp: number; pupila: number; sorriso: number; boca: number; assim: number};
const EXPR: Record<Expressao, Rosto> = {
  neutro: {sobr: 0, sobrAlt: 0, palp: 0.15, pupila: 1, sorriso: 0.15, boca: 0, assim: 0},
  feliz: {sobr: -4, sobrAlt: 4, palp: 0.25, pupila: 1.05, sorriso: 1, boca: 0.15, assim: 0},
  surpreso: {sobr: -8, sobrAlt: 14, palp: 0, pupila: 0.7, sorriso: 0, boca: 0.55, assim: 0},
  bravo: {sobr: 22, sobrAlt: -6, palp: 0.4, pupila: 0.9, sorriso: -0.8, boca: 0, assim: 0},
  confuso: {sobr: -10, sobrAlt: 6, palp: 0.25, pupila: 1, sorriso: -0.3, boca: 0, assim: 12},
};
const mistura = (a: Rosto, b: Rosto, k: number): Rosto =>
  Object.fromEntries(Object.keys(a).map((c) => [c, a[c as keyof Rosto] + (b[c as keyof Rosto] - a[c as keyof Rosto]) * k])) as Rosto;

// Piscadas determinísticas: intervalos de 2,2–5,2 s derivados do id do personagem.
const piscadas = (seed: number, dur: number) => {
  const ts: number[] = [];
  for (let t = 0.8 + (seed % 7) * 0.3, i = 0; t < dur; i++) {
    ts.push(t);
    t += 2.2 + 3 * ((Math.sin(seed * 91.7 + i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  }
  return ts;
};

export const Personagem: React.FC<{
  id: string; visual: Visual; palavras: Palavra[]; // só as palavras DESTE personagem (tempo absoluto)
  expressoes: {t: number; e: Expressao}[]; // linha do tempo, já compilada a partir do roteiro
  olhar?: number; // -1 (esquerda) … 1 (direita): para quem ele olha
  x: number; y: number; escala?: number;
}> = ({id, visual, palavras, expressoes, olhar = 0, x, y, escala = 1}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const seed = useMemo(() => [...id].reduce((s, c) => s + c.charCodeAt(0), 0), [id]);
  const chaves = useMemo(() => chavesDaBoca(palavras), [palavras]);
  const blinks = useMemo(() => piscadas(seed, durationInFrames / fps), [seed, durationInFrames, fps]);

  // Expressão atual = mistura da anterior com a nova em 0,2 s (com leve exagero na chegada).
  const idx = expressoes.reduce((acc, e, i) => (e.t <= t ? i : acc), -1);
  const atual = expressoes[idx]?.e ?? 'neutro';
  const anterior = expressoes[idx - 1]?.e ?? 'neutro';
  const k = idx < 0 ? 1 : interpolate(t, [expressoes[idx].t, expressoes[idx].t + 0.2], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)),
  });
  const r = mistura(EXPR[anterior], EXPR[atual], k);

  const b = bocaEm(chaves, t);
  const falando = b.abre > 0.08;
  const pisc = blinks.some((tb) => t >= tb && t < tb + 0.14) || (idx >= 0 && t - expressoes[idx].t < 0.1);
  const palp = pisc ? 1 : r.palp;
  const resp = Math.sin((t * 2 * Math.PI) / 3.6 + seed); // respiração ~3,6 s
  const cabeca = falando ? 2.5 * Math.sin(t * 7 + seed) : 1.2 * Math.sin(t * 0.9 + seed); // aceno ao falar

  // Boca: largura, abertura e curva do sorriso → um path fechado.
  const W = 34 + 34 * b.larg - 14 * b.redondo, H = 4 + 46 * Math.max(b.abre, r.boca);
  const cy = -r.sorriso * 7;
  const boca = `M ${-W / 2} ${cy} Q 0 ${r.sorriso * 6 - H * 0.35} ${W / 2} ${cy} Q 0 ${r.sorriso * 9 + H * 1.15} ${-W / 2} ${cy} Z`;
  const clip = `boca-${id}`;
  const olho = (lado: -1 | 1) => {
    const yS = -40 - r.sobrAlt - lado * r.assim; // assimetria: confuso ergue uma sobrancelha só
    return (
    <g transform={`translate(${lado * 38} -10)`}>
      <ellipse rx={20} ry={24} fill="#fff" stroke={visual.contorno} strokeWidth={4} />
      <circle cx={olhar * 7} cy={2} r={10 * r.pupila} fill="#1b1b26" />
      <circle cx={olhar * 7 + 4} cy={-3} r={3.5} fill="#fff" />
      {/* pálpebra: retângulo da cor da pele que desce */}
      <rect x={-23} y={-28} width={46} height={52 * palp} fill={visual.pele} stroke={visual.contorno} strokeWidth={palp > 0.9 ? 4 : 0} />
      <path d={`M -22 ${yS} L 22 ${yS}`} stroke={visual.cabelo} strokeWidth={9} strokeLinecap="round"
        transform={`rotate(${lado * -r.sobr} 0 ${yS})`} />
    </g>
  );
  };

  return (
    <svg viewBox="-160 -260 320 520" width={320 * escala} height={520 * escala}
      style={{position: 'absolute', left: x - 160 * escala, top: y - 260 * escala, overflow: 'visible'}}>
      <defs><clipPath id={clip}><path d={boca} /></clipPath></defs>
      {/* corpo: respira escalando a partir do quadril */}
      <g transform={`translate(0 250) scale(${1 + 0.006 * resp} ${1 + 0.014 * resp}) translate(0 -250)`}>
        <path d="M -95 250 C -100 140 -80 95 0 95 C 80 95 100 140 95 250 Z" fill={visual.roupa} stroke={visual.contorno} strokeWidth={5} />
        <path d="M -30 97 L 0 135 L 30 97" fill="none" stroke={visual.detalhe} strokeWidth={8} strokeLinejoin="round" />
      </g>
      <g transform={`translate(0 ${2 * resp}) rotate(${cabeca} 0 80)`}>
        <rect x={-18} y={60} width={36} height={40} fill={visual.pele} />
        <circle cx={-98} cy={-5} r={18} fill={visual.pele} stroke={visual.contorno} strokeWidth={4} />
        <circle cx={98} cy={-5} r={18} fill={visual.pele} stroke={visual.contorno} strokeWidth={4} />
        <rect x={-100} y={-115} width={200} height={190} rx={90} fill={visual.pele} stroke={visual.contorno} strokeWidth={5} />
        <path d="M -104 -40 C -110 -150 110 -150 104 -40 C 70 -95 -30 -100 -104 -40 Z" fill={visual.cabelo} stroke={visual.contorno} strokeWidth={5} />
        {olho(-1)}{olho(1)}
        <ellipse cx={-62} cy={28} rx={16} ry={9} fill="#ff8a8a" opacity={0.25 + 0.3 * Math.max(0, r.sorriso)} />
        <ellipse cx={62} cy={28} rx={16} ry={9} fill="#ff8a8a" opacity={0.25 + 0.3 * Math.max(0, r.sorriso)} />
        <path d="M -4 8 Q 6 22 -6 26" fill="none" stroke={visual.contorno} strokeWidth={4} strokeLinecap="round" />
        <g transform="translate(0 46)">
          <path d={boca} fill="#5a1f2b" stroke={visual.contorno} strokeWidth={4} strokeLinejoin="round" />
          <g clipPath={`url(#${clip})`}>
            <rect x={-40} y={cy - H} width={80} height={H * 0.55} fill="#fff" opacity={b.dentes} />
            <ellipse cx={0} cy={cy + H * 0.9} rx={W * 0.32} ry={H * 0.35} fill="#e46a7b" />
          </g>
        </g>
      </g>
    </svg>
  );
};
