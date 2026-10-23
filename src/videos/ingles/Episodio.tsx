import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Abertura, Erro, Final, Quiz} from './cenas';
import {clamp, Fundo, HORIZONTAL, LayoutProvider, Topo, useT, VERTICAL} from './comuns';
import {momento, type Cena, type Episodio as Ep} from './tipos';

const SFX_POR_CHAVE: Record<string, string> = {
  titulo: 'whoosh', errado: 'erro', dica: 'pop', certo: 'ding', exemplo: 'pop', pergunta: 'whoosh', opcoes: 'pop', resposta: 'ding', chamada: 'pop',
};

const efeitos = (cenas: Cena[]) => {
  const lista: {t: number; som: string; vol: number}[] = [];
  cenas.forEach((c, i) => {
    if (i > 0) lista.push({t: c.inicio, som: 'whoosh', vol: 0.25});
    for (const [chave, som] of Object.entries(SFX_POR_CHAVE)) {
      const t = momento(c, chave);
      if (t !== null) lista.push({t, som, vol: som === 'ding' ? 0.3 : 0.38});
    }
    const cont = c.falas.find((f) => f.mostra === 'contagem');
    if (cont) [0, 1, 2].forEach((k) => lista.push({t: cont.inicio + (k * (cont.fim - cont.inicio)) / 3, som: 'tick', vol: 0.45}));
  });
  return lista;
};

const Transicao: React.FC<{inicio: number; children: React.ReactNode}> = ({inicio, children}) => {
  const {t} = useT();
  const p = interpolate(t, [inicio, inicio + 0.35], [0, 1], clamp);
  return <AbsoluteFill style={{opacity: p, transform: `translateX(${(1 - p) * 70}px)`}}>{children}</AbsoluteFill>;
};

export const Episodio: React.FC<{ep: Ep; formato?: 'vertical' | 'horizontal'}> = ({ep, formato = 'vertical'}) => {
  const {fps} = useVideoConfig();
  // Uma foto por episódio: o figurino não muda no meio do vídeo, mas varia de um dia para o outro.
  const foto = ep.fotos.length ? ep.fotos[(ep.episodio - 1) % ep.fotos.length] : undefined;
  const {frame} = useT();
  const f = (s: number) => Math.round(s * fps);
  // As cenas leem o tempo absoluto (os gatilhos do episodio.json são absolutos), por isso
  // ficam fora de <Sequence>, que zeraria o relógio. Cenas são contíguas: nunca há tela vazia.
  return (
    <LayoutProvider value={formato === 'horizontal' ? HORIZONTAL : VERTICAL}>
    <AbsoluteFill style={{background: '#000'}}>
      <Fundo cenario={ep.cenario} />
      {ep.cenas.map((c, i) => {
        if (c.tipo === 'tela') return null; // telas são do formato dica (Dica.tsx)
        const Comp = {abertura: Abertura, erro: Erro, quiz: Quiz, final: Final}[c.tipo];
        const ini = i === 0 ? 0 : f(c.inicio);
        const fim = i === ep.cenas.length - 1 ? Infinity : f(c.fim);
        if (frame < ini || frame >= fim) return null;
        return (
          <Transicao key={i} inicio={i === 0 ? -1 : c.inicio}>
            <Comp cena={c} foto={foto} />
          </Transicao>
        );
      })}
      <Topo ep={ep} />
      <Audio src={staticFile(ep.audio)} />
      {efeitos(ep.cenas).map((e, i) => (
        <Sequence key={`sfx${i}`} from={f(e.t)} durationInFrames={f(1)} layout="none">
          <Audio src={staticFile(`_sfx/${e.som}.wav`)} volume={e.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
    </LayoutProvider>
  );
};
