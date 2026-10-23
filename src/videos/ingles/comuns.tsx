import React, {createContext, useContext, useState} from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COR, SERIE, TEXTO, TITULO} from './tema';
import type {Episodio, Fala} from './tipos';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Layout do episódio: o mesmo roteiro sai em 9:16 (Shorts/TikTok/Reels) e 16:9 (YouTube).
// Vertical: zonas livres para a interface dos apps (topo ~250, base ~420, direita ~140).
export type Layout = {h: boolean; w: number; alt: number; esq: number; dir: number; topo: number};
export const VERTICAL: Layout = {h: false, w: 1080, alt: 1920, esq: 64, dir: 130, topo: 250};
export const HORIZONTAL: Layout = {h: true, w: 1920, alt: 1080, esq: 90, dir: 90, topo: 60};
const LayoutCtx = createContext<Layout>(VERTICAL);
export const LayoutProvider = LayoutCtx.Provider;
export const useLayout = () => useContext(LayoutCtx);

export const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame, fps, t: frame / fps};
};

// Mola 0 → 1 que começa no segundo `inicio` (absoluto). Antes disso vale 0: nada aparece antes de ser dito.
export const useMola = (inicio: number | null, damping = 15) => {
  const {frame, fps} = useT();
  if (inicio === null) return 0;
  return spring({frame: frame - Math.round(inicio * fps), fps, config: {damping, stiffness: 160}});
};

// Emoji → desenho Twemoji (CC-BY 4.0), igual em qualquer computador. Os SVGs são baixados antes
// do render por tools/narrar.py para projetos/_twemoji/ (mesmo nome de arquivo que codigo_twemoji()).
export const twemoji = (e: string) => {
  const cps = [...e].map((c) => c.codePointAt(0)!.toString(16));
  const nome = (e.includes('‍') ? cps : cps.filter((c) => c !== 'fe0f')).join('-');
  return staticFile(`_twemoji/${nome}.svg`);
};

export const Ilustracao: React.FC<{emoji: string; tam: number; style?: React.CSSProperties}> = ({emoji, tam, style}) => {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return <span style={{fontSize: tam * 0.85, lineHeight: 1, ...style}}>{emoji}</span>;
  return <Img src={twemoji(emoji)} onError={() => setFalhou(true)} style={{width: tam, height: tam, ...style}} />;
};

// Fundo creme com bolhas que respiram e o cenário do episódio flutuando bem de leve.
export const Fundo: React.FC<{cenario?: string[]}> = ({cenario}) => {
  const {t} = useT();
  const L = useLayout();
  const itens = cenario?.length ? cenario : ['📚', '✏️', '💬', '⭐'];
  const bolha = (x: number, y: number, r: number, cor: string, f: number) => (
    <div
      style={{
        position: 'absolute', left: x * L.w + 30 * Math.sin(t * f), top: y * L.alt + 40 * Math.cos(t * f * 0.8),
        width: r, height: r, borderRadius: '50%', background: cor, filter: 'blur(60px)', opacity: 0.55,
      }}
    />
  );
  return (
    <AbsoluteFill style={{background: COR.fundo, overflow: 'hidden'}}>
      {bolha(-0.17, 0.06, 620, '#FFD9B8', 0.21)}
      {bolha(0.57, 0.4, 560, '#CFEFE0', 0.17)}
      {bolha(-0.11, 0.72, 640, '#FFE7A3', 0.13)}
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(31,42,68,.07) 2px, transparent 2px)', backgroundSize: '44px 44px'}} />
      {Array.from({length: L.h ? 10 : 9}).map((_, i) => {
        // Posições fixas pseudo-aleatórias: o render é determinístico.
        const x = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
        const y = ((Math.sin(i * 78.233) * 12345.678) % 1 + 1) % 1;
        const tam = 110 + ((i * 37) % 70);
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x * (L.w - tam), top: y * (L.alt - tam) + 18 * Math.sin(t * 0.6 + i),
              transform: `rotate(${10 * Math.sin(t * 0.4 + i * 2)}deg)`, opacity: 0.13,
            }}
          >
            <Ilustracao emoji={itens[i % itens.length]} tam={tam} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Barra de progresso + selo da série.
export const Topo: React.FC<{ep: Episodio}> = ({ep}) => {
  const {t} = useT();
  const L = useLayout();
  const p = Math.min(1, t / ep.duracao);
  const top = L.h ? L.topo - 30 : L.topo - 40;
  return (
    <>
      <div style={{position: 'absolute', left: L.esq, right: L.dir, top, height: 12, borderRadius: 8, background: 'rgba(31,42,68,.12)'}}>
        <div style={{width: `${p * 100}%`, height: '100%', borderRadius: 8, background: COR.coral}} />
      </div>
      <div
        style={{
          position: 'absolute', left: L.esq, top: top + 32, fontFamily: TITULO, fontWeight: 600, fontSize: 32, color: COR.tinta,
          letterSpacing: 1.5, background: 'rgba(255,255,255,.9)', padding: '4px 18px', borderRadius: 30,
        }}
      >
        {SERIE}{' '}
        <span style={{color: COR.coral}}>
          · {ep.formato === 'short' ? 'DICA RÁPIDA' : ep.formato === 'longo' ? 'AULA' : `EP ${String(ep.episodio).padStart(2, '0')}`}
        </span>
      </div>
    </>
  );
};

// Foto do apresentador (ou silhueta enquanto não houver foto).
export const Foto: React.FC<{src?: string; style?: React.CSSProperties}> = ({src, style}) =>
  src ? (
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%', ...style}} />
  ) : (
    <div style={{width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 35%, #8b7a6b, #3a332c 80%)', ...style}}>
      <svg viewBox="0 0 100 100" style={{width: '100%', height: '100%'}} preserveAspectRatio="xMidYMid slice">
        <circle cx="50" cy="40" r="17" fill="#cbb8a6" />
        <path d="M14 100 C16 70 32 62 50 62 C68 62 84 70 86 100 Z" fill="#cbb8a6" />
      </svg>
    </div>
  );

const falando = (falas: Fala[], t: number) =>
  falas.some((f) => f.voz === 'pt' && f.palavras?.some((p) => t >= p.s && t <= p.e + 0.12));

// Selo de idioma (emoji de bandeira não existe no Windows: vira "US"/"BR").
export const Selo: React.FC<{lingua: 'en' | 'pt'; tam?: number}> = ({lingua, tam = 34}) => (
  <span
    style={{
      display: 'inline-block', fontFamily: TEXTO, fontWeight: 900, fontSize: tam * 0.62, letterSpacing: 1,
      color: COR.branco, background: lingua === 'en' ? COR.azul : COR.menta, borderRadius: tam * 0.3,
      padding: `${tam * 0.12}px ${tam * 0.3}px`, marginRight: tam * 0.35, verticalAlign: 'middle', transform: 'translateY(-4px)',
    }}
  >
    {lingua === 'en' ? 'EN' : 'PT'}
  </span>
);

// Card redondo do professor, com anel que pulsa enquanto ele fala e um leve balanço.
export const Professor: React.FC<{foto?: string; falas: Fala[]; x: number; y: number; tam: number; entrada: number}> = ({
  foto, falas, x, y, tam, entrada,
}) => {
  const {t} = useT();
  const fala = falando(falas, t);
  const pulso = fala ? 1 + 0.035 * Math.abs(Math.sin(t * 9)) : 1;
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y + 6 * Math.sin(t * 1.3), width: tam, height: tam,
        transform: `scale(${entrada * pulso}) rotate(${1.5 * Math.sin(t * 0.9)}deg)`,
      }}
    >
      <div style={{position: 'absolute', inset: -10, borderRadius: '50%', border: `8px solid ${fala ? COR.coral : COR.amarelo}`}} />
      <div style={{width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 14px 34px rgba(31,42,68,.25)'}}>
        <Foto src={foto} />
      </div>
    </div>
  );
};

// Legenda palavra por palavra. Português em branco sobre azul; inglês com selo EN e destaque menta.
export const Legenda: React.FC<{falas: Fala[]; top?: number; esq?: number; dir?: number}> = ({falas, top, esq, dir}) => {
  const {t, frame, fps} = useT();
  const L = useLayout();
  const topo = top ?? (L.h ? 905 : 1268);
  const caixa = {position: 'absolute' as const, left: esq ?? L.esq, right: dir ?? L.dir, top: topo};
  const vez = falas.find((f) => f.mostra === 'suavez' && t >= f.inicio && t < f.fim);
  if (vez) {
    const m = spring({frame: frame - Math.round(vez.inicio * fps), fps, config: {damping: 12}});
    return (
      <div style={{...caixa, display: 'flex', flexDirection: L.h ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 20, transform: `scale(${m})`}}>
        <div style={{transform: `rotate(${8 * Math.sin(t * 8)}deg)`}}>
          <Ilustracao emoji="🎤" tam={L.h ? 90 : 120} />
        </div>
        <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 60, color: COR.coral}}>Fala em voz alta!</div>
      </div>
    );
  }
  const fala = falas.find((f) => f.palavras?.length && t >= f.palavras[0].s - 0.05 && t < f.fim);
  if (!fala?.palavras) return null;
  const ws = fala.palavras;
  const max = L.h ? 9 : 6;
  // Blocos curtos, quebrando em pontuação forte.
  const blocos: (typeof ws)[] = [[]];
  ws.forEach((w, i) => {
    const b = blocos[blocos.length - 1];
    b.push(w);
    const pont = /[.!?:]$/.test(fala.texto?.split(/\s+/)[i] ?? '') || /[.!?:]$/.test(w.w);
    if ((b.length >= max || pont) && i < ws.length - 1) blocos.push([]);
  });
  const bloco = [...blocos].reverse().find((b) => b.length && t >= b[0].s - 0.05) ?? blocos[0];
  const en = fala.voz === 'en';
  return (
    <div
      style={{
        ...caixa, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-start', gap: '6px 14px',
        fontFamily: TEXTO, fontWeight: 900, fontSize: (en ? 74 : 64) * (L.h ? 0.85 : 1), lineHeight: 1.18,
      }}
    >
      {en && <span style={{alignSelf: 'center'}}><Selo lingua="en" tam={L.h ? 52 : 60} /></span>}
      {bloco.map((p) => {
        const dita = t >= p.s;
        const ativa = dita && t <= p.e + 0.08;
        const pop = spring({frame: frame - Math.round(p.s * fps), fps, config: {damping: 14, stiffness: 200}});
        return (
          <span
            key={p.s}
            style={{
              display: 'inline-block', padding: '2px 14px', borderRadius: 16,
              color: ativa ? COR.tinta : en ? COR.menta : COR.branco,
              background: ativa ? (en ? '#9FF0CB' : COR.amarelo) : en ? COR.branco : COR.tinta,
              opacity: dita ? 1 : 0.0, transform: `scale(${dita ? 0.8 + 0.2 * pop : 0.8})`,
              boxShadow: '0 8px 20px rgba(31,42,68,.18)',
            }}
          >
            {p.w}
          </span>
        );
      })}
    </div>
  );
};

export const Card: React.FC<{
  entrada: number; fundo: string; borda: string; style?: React.CSSProperties; children: React.ReactNode; giro?: number;
}> = ({entrada, fundo, borda, style, children, giro = 0}) => {
  const L = useLayout();
  return (
    <div
      style={{
        position: 'absolute', left: L.esq, right: L.dir, background: fundo, border: `5px solid ${borda}`,
        borderRadius: 34, padding: '22px 30px', boxShadow: '0 16px 40px rgba(31,42,68,.14)',
        opacity: interpolate(entrada, [0, 0.3], [0, 1], clamp),
        transform: `translateY(${(1 - entrada) * 60}px) scale(${0.9 + 0.1 * entrada}) rotate(${giro}deg)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
