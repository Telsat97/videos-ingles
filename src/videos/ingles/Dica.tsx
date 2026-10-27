import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, staticFile, useVideoConfig} from 'remotion';
import {clamp, Ilustracao, useT} from './comuns';
import {COR, TEXTO, TITULO} from './tema';
import {momento, type Cena, type Episodio as Ep, type Fala} from './tipos';

// Micro-Short global ("dica"): uma ideia por tela em tela cheia, corte seco entre telas, cor de fundo
// diferente a cada tela (quebra de padrão a cada 2-3 s), zoom de impacto na entrada, legenda grande em
// blocos de até 4 palavras e um quiz sem resposta no fim (puxa o replay). Ver serie-ingles/PLANO-DO-TIME.md.

const PALETA: Record<NonNullable<Cena['visual']>, {fundo: string; texto: string; destaque: string; selo: string}> = {
  erro: {fundo: '#2B0E14', texto: '#FFFFFF', destaque: '#FF4D5E', selo: '❌'},
  certo: {fundo: '#0E3B2A', texto: '#FFFFFF', destaque: '#38E39A', selo: '✅'},
  regra: {fundo: '#13224A', texto: '#FFFFFF', destaque: COR.amarelo, selo: '💡'},
  vez: {fundo: COR.coral, texto: '#FFFFFF', destaque: COR.amarelo, selo: '🎤'},
  bonus: {fundo: '#3B1F66', texto: '#FFFFFF', destaque: '#FFB4F0', selo: '🎁'},
  quiz: {fundo: '#101826', texto: '#FFFFFF', destaque: COR.amarelo, selo: '🤔'},
};

const SFX: Record<NonNullable<Cena['visual']>, string> = {erro: 'erro', certo: 'ding', regra: 'pop', vez: 'pop', bonus: 'whoosh', quiz: 'tick'};

// Tamanho que faz o texto caber em até 3 linhas na largura útil (zona segura: x 64-900).
const tamanho = (texto: string, max: number) => {
  const maiorLinha = Math.max(...texto.split('\n').map((l) => l.length));
  const porLargura = 820 / (Math.min(maiorLinha, 18) * 0.56);
  const linhas = Math.ceil(texto.length / 18);
  return Math.min(max, porLargura, linhas > 2 ? 104 : max);
};

const Tela: React.FC<{cena: Cena}> = ({cena}) => {
  const {t, frame, fps} = useT();
  const v = cena.visual ?? 'regra';
  const p = PALETA[v];
  // O erro é o gancho: aparece já no corte (quadro 0 na primeira tela). Ele é mostrado, nunca falado.
  const tGrande = v === 'erro' ? cena.inicio : momento(cena, 'grande') ?? cena.inicio;
  const tPequeno = momento(cena, 'pequeno');
  const mG = spring({frame: frame - Math.round(tGrande * fps), fps, config: {damping: 11, stiffness: 220}});
  // O selo (❌ ✅ 💡…) entra no corte, antes do texto: a tela nunca fica vazia.
  const mSelo = spring({frame: frame - Math.round(cena.inicio * fps), fps, config: {damping: 11, stiffness: 220}});
  const mP = tPequeno === null ? 0 : spring({frame: frame - Math.round(tPequeno * fps), fps, config: {damping: 14}});
  // Zoom de impacto na entrada da tela + câmera que nunca para (deriva lenta).
  const punch = interpolate(t, [cena.inicio, cena.inicio + 0.2], [1.12, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const deriva = 1 + 0.035 * interpolate(t, [cena.inicio, cena.fim], [0, 1], clamp);
  // Tremida curta quando o erro aparece.
  const dtErro = t - tGrande;
  const treme = v === 'erro' && dtErro >= 0 && dtErro < 0.35 ? 14 * (1 - dtErro / 0.35) : 0;
  const risco = v === 'erro' ? interpolate(t, [tGrande + 0.35, tGrande + 0.7], [0, 100], clamp) : 0;
  const grande = cena.grande ?? '';
  const fs = tamanho(grande, v === 'quiz' ? 96 : 132);

  return (
    <AbsoluteFill style={{background: p.fundo, overflow: 'hidden'}}>
      {/* brilho radial estático (sem blur por quadro: render leve) */}
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%, ${p.destaque}33 0%, transparent 55%)`}} />
      <AbsoluteFill
        style={{
          transform: `scale(${punch * deriva}) translate(${treme * Math.sin(frame * 2.3)}px, ${treme * Math.cos(frame * 3.1)}px)`,
          transformOrigin: '50% 45%',
        }}
      >
        <div
          style={{
            position: 'absolute', left: 64, right: 180, top: 410, height: 860, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 34,
          }}
        >
          <div style={{transform: `scale(${mSelo}) rotate(${6 * Math.sin(t * 2)}deg)`}}>
            <Ilustracao emoji={p.selo} tam={210} />
          </div>
          <div
            style={{
              position: 'relative', fontFamily: TITULO, fontWeight: 700, fontSize: fs, lineHeight: 1.05, color: p.texto,
              textAlign: 'center', whiteSpace: 'pre-line', opacity: interpolate(mG, [0, 0.3], [0, 1], clamp),
              transform: `scale(${0.7 + 0.3 * mG})`, textShadow: '0 8px 30px rgba(0,0,0,.45)',
            }}
          >
            {grande}
            {v === 'erro' && (
              <div style={{position: 'absolute', left: 0, top: '52%', height: 16, width: `${risco}%`, background: p.destaque, borderRadius: 8}} />
            )}
          </div>
          {cena.pequeno && (
            <div
              style={{
                fontFamily: TEXTO, fontWeight: 800, fontSize: 58, lineHeight: 1.2, color: p.destaque, textAlign: 'center',
                whiteSpace: 'pre-line', opacity: mP, transform: `translateY(${(1 - mP) * 40}px)`,
              }}
            >
              {cena.pequeno}
            </div>
          )}
          {v === 'quiz' && cena.opcoes && <Opcoes cena={cena} />}
          {v === 'vez' && <Pausa cena={cena} />}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Opcoes: React.FC<{cena: Cena}> = ({cena}) => {
  const {frame, fps} = useT();
  // As opções entram logo depois da pergunta (a fala 'opcoes' do roteiro é só a pausa final).
  const tO = (momento(cena, 'grande') ?? cena.inicio) + 0.6;
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 26, width: '100%'}}>
      {cena.opcoes!.map((o, i) => {
        const m = spring({frame: frame - Math.round((tO + i * 0.25) * fps), fps, config: {damping: 13}});
        return (
          <div
            key={o}
            style={{
              display: 'flex', alignItems: 'center', gap: 24, background: '#FFFFFF', borderRadius: 30, padding: '22px 30px',
              fontFamily: TEXTO, fontWeight: 900, fontSize: 56, color: COR.tinta, opacity: m, transform: `translateX(${(1 - m) * 120}px)`,
            }}
          >
            <span style={{background: COR.coral, color: '#fff', borderRadius: 18, padding: '2px 22px', fontFamily: TITULO}}>{'AB'[i]}</span>
            {o}
          </div>
        );
      })}
    </div>
  );
};

// Pausa "sua vez": anel que esvazia enquanto a pessoa repete.
const Pausa: React.FC<{cena: Cena}> = ({cena}) => {
  const {t} = useT();
  const f = cena.falas.find((x) => x.mostra === 'suavez');
  if (!f || t < f.inicio) return null;
  const p = interpolate(t, [f.inicio, f.fim], [1, 0], clamp);
  return (
    <svg width={200} height={200} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={42} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth={10} />
      <circle cx={50} cy={50} r={42} fill="none" stroke="#fff" strokeWidth={10} strokeDasharray={`${264 * p} 264`}
        transform="rotate(-90 50 50)" strokeLinecap="round" />
    </svg>
  );
};

// Legenda grande em blocos de até 4 palavras (nunca uma palavra solta), na faixa y 1270-1450.
const Legenda: React.FC<{falas: Fala[]}> = ({falas}) => {
  const {t, frame, fps} = useT();
  const fala = falas.find((f) => f.palavras?.length && t >= f.palavras[0].s - 0.05 && t < f.fim);
  if (!fala?.palavras) return null;
  const ws = fala.palavras;
  const blocos: (typeof ws)[] = [[]];
  ws.forEach((w, i) => {
    const b = blocos[blocos.length - 1];
    b.push(w);
    const resto = ws.length - 1 - i;
    if ((b.length >= 4 || /[.!?,:]$/.test(w.w)) && resto >= 2) blocos.push([]);
  });
  const bloco = [...blocos].reverse().find((b) => b.length && t >= b[0].s - 0.05) ?? blocos[0];
  const modelo = fala.voz === 'en'; // a voz nativa (frase-modelo) ganha cor própria
  return (
    <div style={{position: 'absolute', left: 64, right: 180, top: 1290, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 18px'}}>
      {bloco.map((p) => {
        const dita = t >= p.s;
        const ativa = dita && t <= p.e + 0.08;
        const pop = spring({frame: frame - Math.round(p.s * fps), fps, config: {damping: 14, stiffness: 220}});
        return (
          <span
            key={p.s}
            style={{
              fontFamily: TEXTO, fontWeight: 900, fontSize: 80, lineHeight: 1.1, padding: '0 10px', borderRadius: 14,
              color: ativa ? COR.tinta : '#FFFFFF', background: ativa ? (modelo ? '#38E39A' : COR.amarelo) : 'transparent',
              WebkitTextStroke: ativa ? undefined : '3px rgba(0,0,0,.55)', opacity: dita ? 1 : 0,
              transform: `scale(${dita ? 0.85 + 0.15 * pop : 0.85})`,
            }}
          >
            {p.w}
          </span>
        );
      })}
    </div>
  );
};

// Etiqueta fixa no topo (abaixo da barra do app do YouTube, que cobre y < ~220), igual em todas as telas: "FIX #12" (série numerada, casa com o nome English Mistake Fix: quem vê um procura os outros)
// + o tema. Qualquer quadro que o YouTube escolha como capa do Short mostra o assunto.
const Tema: React.FC<{texto: string; dia: number | null}> = ({texto, dia}) => {
  const fs = Math.min(70, Math.floor(820 / ((texto.length + (dia ? 7 : 0)) * 0.6)));
  return (
    <div style={{position: 'absolute', left: 64, right: 180, top: 250, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 16, fontFamily: TITULO, fontWeight: 700, fontSize: fs, color: '#FFFFFF',
          background: 'rgba(0,0,0,.38)', border: '3px solid rgba(255,255,255,.35)', borderRadius: 999,
          padding: dia ? '6px 30px 6px 8px' : '8px 34px', whiteSpace: 'nowrap',
        }}
      >
        {dia && <span style={{background: COR.amarelo, color: COR.tinta, borderRadius: 999, padding: '2px 20px'}}>FIX #{dia}</span>}
        {texto}
      </div>
    </div>
  );
};

// Barra de progresso em segmentos (uma por tela).
const Progresso: React.FC<{ep: Ep}> = ({ep}) => {
  const {t} = useT();
  return (
    <div style={{position: 'absolute', left: 64, right: 180, top: 372, display: 'flex', gap: 10}}>
      {ep.cenas.map((c, i) => {
        const p = interpolate(t, [c.inicio, c.fim], [0, 1], clamp);
        return (
          <div key={i} style={{flex: 1, height: 14, borderRadius: 7, background: 'rgba(255,255,255,.25)', overflow: 'hidden'}}>
            <div style={{width: `${p * 100}%`, height: '100%', background: '#FFFFFF'}} />
          </div>
        );
      })}
    </div>
  );
};

// capa=true: quadro para a capa do Short (sem legenda; ver tools/produzir.py).
export const Dica: React.FC<{ep: Ep; formato?: 'horizontal' | 'vertical'; capa?: boolean}> = ({ep, capa}) => {
  const {fps} = useVideoConfig();
  const {frame} = useT();
  const f = (s: number) => Math.round(s * fps);
  const atual = ep.cenas.findIndex((c, i) => frame >= (i === 0 ? 0 : f(c.inicio)) && (i === ep.cenas.length - 1 || frame < f(c.fim)));
  const cena = ep.cenas[Math.max(0, atual)];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* A primeira tela "começa" 0,4 s antes do vídeo: no quadro 0 o gancho já está inteiro na tela. */}
      <Tela cena={atual <= 0 ? {...cena, inicio: -0.4} : cena} />
      <Tema texto={ep.tema ?? ep.titulo} dia={Number(/^d(\d+)-/.exec(ep.slug)?.[1]) || null} />
      <Progresso ep={ep} />
      {!capa && <Legenda falas={cena.falas} />}
      <Audio src={staticFile(ep.audio)} />
      {ep.cenas.map((c, i) => (
        <Sequence key={`sfx${i}`} from={f(c.visual === 'erro' ? c.inicio : momento(c, 'grande') ?? c.inicio)} durationInFrames={f(1)} layout="none">
          <Audio src={staticFile(`_sfx/${SFX[c.visual ?? 'regra']}.wav`)} volume={c.visual === 'erro' ? 0.5 : 0.32} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
