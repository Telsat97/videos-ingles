import {Audio} from '@remotion/media';
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, staticFile} from 'remotion';
import {clamp, Ilustracao, useT} from './comuns';
import {Personagem, type Expressao, type Palavra, type Visual} from './Personagem';
import {COR, TEXTO, TITULO} from './tema';
import type {CardPodcast, Cena, Episodio as Ep, Fala} from './tipos';

// English Mistake Fix Podcast (16:9, semanal): Mia e Leo conversam num estúdio ilustrado; o painel da direita mostra
// o card da vez (palavra, erro, frase para repetir, quiz); legenda grande embaixo. Ver serie-ingles/podcast/FORMATO.md.

const PERSONAGENS: Record<'mia' | 'leo', {nome: string; cor: string; visual: Visual; x: number}> = {
  mia: {nome: 'Mia', cor: COR.coral, x: 300,
    visual: {pele: '#F2C6A0', cabelo: '#5B2E1F', roupa: COR.coral, detalhe: '#FFFFFF', contorno: '#2A1B14', cabeloLongo: true}},
  leo: {nome: 'Leo', cor: COR.azul, x: 680,
    visual: {pele: '#C98E64', cabelo: '#1E1E28', roupa: '#2F4B7C', detalhe: COR.amarelo, contorno: '#1A1410'}},
};
const quem = (voz?: string) => (voz?.startsWith('leo') ? 'leo' : 'mia');

const CENARIO: Record<string, {fundo: [string, string]; emojis: string[]}> = {
  estudio: {fundo: ['#1D2340', '#2C3566'], emojis: ['🎙️', '🎧', '📚', '💬']},
  cafe: {fundo: ['#3A2418', '#6B4128'], emojis: ['☕', '🥐', '🍰', '🧁']},
  mercado: {fundo: ['#16382C', '#24604A'], emojis: ['🛒', '🍎', '🥖', '🧀']},
  rua: {fundo: ['#1F2B3A', '#355070'], emojis: ['🚌', '🏙️', '🚦', '🗺️']},
  casa: {fundo: ['#3B2A3F', '#6A4C73'], emojis: ['🏠', '🛋️', '🪴', '🐈']},
  trabalho: {fundo: ['#1E2A2F', '#3A5560'], emojis: ['💼', '💻', '📞', '☕']},
  viagem: {fundo: ['#163246', '#2B6A8F'], emojis: ['✈️', '🧳', '🏨', '🗺️']},
};

// Todas as falas com tempo, na ordem.
const todasFalas = (ep: Ep) => ep.cenas.flatMap((c, ci) => c.falas.map((f) => ({...f, ci})));

const Fundo: React.FC<{cenario: string}> = ({cenario}) => {
  const {t} = useT();
  const c = CENARIO[cenario] ?? CENARIO.estudio;
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${c.fundo[0]}, ${c.fundo[1]})`, overflow: 'hidden'}}>
      {Array.from({length: 8}).map((_, i) => {
        const x = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
        const y = ((Math.sin(i * 78.233) * 12345.678) % 1 + 1) % 1;
        return (
          <div key={i} style={{position: 'absolute', left: x * 1700, top: y * 900 + 14 * Math.sin(t * 0.5 + i), opacity: 0.1,
            transform: `rotate(${8 * Math.sin(t * 0.3 + i)}deg)`}}>
            <Ilustracao emoji={c.emojis[i % c.emojis.length]} tam={130} />
          </div>
        );
      })}
      {/* bancada do estúdio */}
      <div style={{position: 'absolute', left: 60, top: 760, width: 900, height: 60, borderRadius: 30, background: 'rgba(0,0,0,.35)'}} />
    </AbsoluteFill>
  );
};

const Topo: React.FC<{ep: Ep; ci: number}> = ({ep, ci}) => {
  const cena = ep.cenas[ci];
  const {frame, fps} = useT();
  const m = spring({frame: frame - Math.round(cena.inicio * fps), fps, config: {damping: 16}});
  return (
    <>
      <div style={{position: 'absolute', left: 60, top: 44, display: 'flex', gap: 14, alignItems: 'center', fontFamily: TITULO, fontWeight: 700}}>
        <span style={{background: COR.amarelo, color: COR.tinta, borderRadius: 999, padding: '6px 22px', fontSize: 34}}>{ep.nivel ?? 'A2'}</span>
        <span style={{color: '#fff', fontSize: 32, opacity: 0.9}}>{(ep.serie ?? 'Easy').toUpperCase()} · EP. {ep.ep ?? 1}</span>
      </div>
      <div style={{position: 'absolute', right: 60, top: 50, color: 'rgba(255,255,255,.75)', fontFamily: TITULO, fontWeight: 600, fontSize: 28}}>
        🎙️ English Mistake Fix Podcast
      </div>
      <div style={{position: 'absolute', left: 60, top: 112, color: '#fff', fontFamily: TITULO, fontWeight: 700, fontSize: 44,
        opacity: m, transform: `translateY(${(1 - m) * 20}px)`}}>
        <span style={{color: COR.amarelo}}>{ci + 1}/{ep.cenas.length}</span> {cena.titulo}
      </div>
    </>
  );
};

const Elenco: React.FC<{ep: Ep}> = ({ep}) => {
  const {t} = useT();
  const falas = useMemo(() => todasFalas(ep), [ep]);
  const palavras = useMemo(() => {
    const out: Record<'mia' | 'leo', Palavra[]> = {mia: [], leo: []};
    for (const f of falas) if (f.palavras) out[quem(f.voz)].push(...f.palavras);
    return out;
  }, [falas]);
  // Expressão: feliz ao começar a falar em cards de resposta/lista, surpreso no quiz, confuso no erro.
  const expressoes = useMemo(() => {
    const out: Record<'mia' | 'leo', {t: number; e: Expressao}[]> = {mia: [], leo: []};
    for (const f of falas) {
      if (!f.voz) continue;
      const e: Expressao = f.card?.tipo === 'erro' ? 'confuso' : f.card?.tipo === 'quiz' ? 'surpreso'
        : f.card?.tipo === 'resposta' ? 'feliz' : 'neutro';
      out[quem(f.voz)].push({t: f.inicio, e});
    }
    return out;
  }, [falas]);
  const fala = falas.find((f) => f.voz && t >= f.inicio && t < f.fim);
  const ativo = fala ? quem(fala.voz) : null;
  return (
    <>
      {(['mia', 'leo'] as const).map((id) => {
        const p = PERSONAGENS[id];
        const foco = ativo === id;
        return (
          <React.Fragment key={id}>
            <div style={{position: 'absolute', left: p.x - 150, top: 330, width: 300, height: 300, borderRadius: '50%',
              background: `radial-gradient(circle, ${p.cor}55 0%, transparent 70%)`, opacity: foco ? 1 : 0.2}} />
            <Personagem id={id} visual={p.visual} palavras={palavras[id]} expressoes={expressoes[id]}
              olhar={id === 'mia' ? 1 : -1} x={p.x} y={540} escala={foco ? 1.08 : 1} />
            <div style={{position: 'absolute', left: p.x - 90, top: 790, width: 180, textAlign: 'center', fontFamily: TITULO,
              fontWeight: 700, fontSize: 36, color: '#fff', background: p.cor, borderRadius: 999, padding: '4px 0',
              opacity: foco ? 1 : 0.65}}>
              {p.nome}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

const CardView: React.FC<{card: CardPodcast}> = ({card}) => {
  const titulo = (txt: string, cor: string) => (
    <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 34, color: cor, letterSpacing: 1}}>{txt}</div>
  );
  const grande = (txt: string, cor = '#fff', tam = 64) => (
    <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: tam, lineHeight: 1.1, color: cor}}>{txt}</div>
  );
  const texto = (txt: string) => <div style={{fontFamily: TEXTO, fontWeight: 600, fontSize: 38, lineHeight: 1.3, color: '#E8ECF8'}}>{txt}</div>;
  switch (card.tipo) {
    case 'palavra':
      return <>{titulo('💡 WORD FOCUS', COR.amarelo)}{grande(card.termo)}{texto(card.significado)}{card.exemplo && texto(`“${card.exemplo}”`)}</>;
    case 'erro':
      return (
        <>
          {titulo('🛠️ MISTAKE FIX', '#FF8A8A')}
          {grande(`❌ ${card.errado}`, '#FF8A8A', 54)}
          {grande(`✅ ${card.certo}`, '#7CF0B8', 58)}
        </>
      );
    case 'frase':
      return <>{titulo('🎤 SAY IT WITH US', '#7CF0B8')}{grande(card.en, '#fff', 60)}</>;
    case 'quiz':
      return <>{titulo('🤔 QUIZ (answer at the end)', COR.amarelo)}{grande(card.pergunta, '#fff', 58)}</>;
    case 'resposta':
      return <>{titulo('✅ QUIZ ANSWER', '#7CF0B8')}{grande(card.texto, '#fff', 56)}</>;
    case 'lista':
      return (
        <>
          {titulo(`📋 ${card.titulo ?? 'TODAY YOU LEARNED'}`, COR.amarelo)}
          {card.itens.slice(0, 8).map((i) => (
            <div key={i} style={{fontFamily: TEXTO, fontWeight: 700, fontSize: 36, color: '#fff'}}>• {i}</div>
          ))}
        </>
      );
  }
};

// Card atual: o último card já aberto dentro do bloco atual.
const Painel: React.FC<{ep: Ep; ci: number}> = ({ep, ci}) => {
  const {t, frame, fps} = useT();
  const cena = ep.cenas[ci];
  const comCard = cena.falas.filter((f) => f.card && f.inicio <= t);
  const f = comCard[comCard.length - 1];
  const repita = cena.falas.find((x) => x.mostra === 'repita' && t >= x.inicio && t < x.fim);
  if (!f?.card && !repita) return <Cena ep={ep} ci={ci} />;
  const m = f ? spring({frame: frame - Math.round(f.inicio * fps), fps, config: {damping: 15}}) : 1;
  return (
    <div style={{position: 'absolute', left: 1010, top: 190, width: 850, height: 560, borderRadius: 36,
      background: 'rgba(10,14,30,.72)', border: '3px solid rgba(255,255,255,.18)', padding: '40px 46px',
      display: 'flex', flexDirection: 'column', gap: 22, justifyContent: 'center', opacity: m, transform: `scale(${0.94 + 0.06 * m})`}}>
      {f?.card && <CardView card={f.card} />}
      {repita && <Repita fala={repita} />}
    </div>
  );
};

// Blocos de história (sem card): quadro da cena com o desenho grande do cenário, para a tela nunca ficar vazia.
const Cena: React.FC<{ep: Ep; ci: number}> = ({ep, ci}) => {
  const {t, frame, fps} = useT();
  const cena = ep.cenas[ci];
  const c = CENARIO[cena.cenario ?? 'estudio'] ?? CENARIO.estudio;
  const m = spring({frame: frame - Math.round(cena.inicio * fps), fps, config: {damping: 15}});
  const i = Math.floor(Math.max(0, t - cena.inicio) / 6) % c.emojis.length; // troca o desenho a cada 6 s
  return (
    <div style={{position: 'absolute', left: 1010, top: 190, width: 850, height: 560, borderRadius: 36,
      background: 'rgba(10,14,30,.45)', border: '3px solid rgba(255,255,255,.12)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24, opacity: m}}>
      <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 34, color: COR.amarelo, letterSpacing: 2}}>📖 STORY TIME</div>
      <div style={{transform: `scale(${1 + 0.04 * Math.sin(t * 1.2)})`}}><Ilustracao emoji={c.emojis[i]} tam={260} /></div>
      <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 48, color: '#fff', textAlign: 'center', padding: '0 30px'}}>{cena.titulo}</div>
    </div>
  );
};

// Pausa "repita comigo": anel que esvazia.
const Repita: React.FC<{fala: Fala}> = ({fala}) => {
  const {t} = useT();
  const p = interpolate(t, [fala.inicio, fala.fim], [1, 0], clamp);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 10}}>
      <svg width={110} height={110} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={10} />
        <circle cx={50} cy={50} r={40} fill="none" stroke="#7CF0B8" strokeWidth={10} strokeDasharray={`${251 * p} 251`}
          transform="rotate(-90 50 50)" strokeLinecap="round" />
      </svg>
      <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 48, color: '#7CF0B8'}}>Your turn! Repeat.</div>
    </div>
  );
};

// O TTS devolve as palavras sem pontuação: recupera a palavra escrita (com vírgula, ponto, aspas) do texto do roteiro.
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const comPontuacao = (texto: string, palavras: Palavra[]) => {
  const tokens = texto.split(/\s+/).filter(Boolean);
  let j = 0;
  return palavras.map((p) => {
    for (let k = j; k < Math.min(tokens.length, j + 4); k++) {
      if (norm(tokens[k]).startsWith(norm(p.w)) || norm(p.w).startsWith(norm(tokens[k]))) {
        j = k + 1;
        return {...p, w: tokens[k]};
      }
    }
    return p;
  });
};

// Legenda grande: a fala atual, palavra dita em destaque, cor de quem fala.
const Legenda: React.FC<{ep: Ep}> = ({ep}) => {
  const {t} = useT();
  const falas = useMemo(() => todasFalas(ep), [ep]);
  const fala = falas.find((f) => f.palavras?.length && t >= f.inicio - 0.05 && t < f.fim);
  if (!fala?.palavras) return null;
  // Falas longas: janela de até 14 palavras em volta da atual (quebra em pontuação quando dá).
  const ws = comPontuacao(fala.texto ?? '', fala.palavras);
  const blocos: (typeof ws)[] = [[]];
  ws.forEach((w, i) => {
    const b = blocos[blocos.length - 1];
    b.push(w);
    if ((b.length >= 14 || (b.length >= 7 && /[.!?]$/.test(w.w))) && i < ws.length - 1) blocos.push([]);
  });
  const bloco = [...blocos].reverse().find((b) => b.length && t >= b[0].s - 0.05) ?? blocos[0];
  const p = PERSONAGENS[quem(fala.voz)];
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 860, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(8,10,20,.78)', borderRadius: 24, padding: '14px 30px', maxWidth: 1700, borderLeft: `10px solid ${p.cor}`,
        fontFamily: TEXTO, fontWeight: 800, fontSize: 50, lineHeight: 1.3, color: '#fff', textAlign: 'center'}}>
        <span style={{color: p.cor}}>{p.nome}: </span>
        {bloco.map((w) => (
          <span key={w.s} style={{color: t >= w.s && t <= w.e + 0.1 ? COR.amarelo : '#fff'}}>{w.w} </span>
        ))}
      </div>
    </div>
  );
};

export const Podcast: React.FC<{ep: Ep}> = ({ep}) => {
  const {t} = useT();
  const ci = Math.max(0, ep.cenas.findIndex((c, i) => t < c.fim || i === ep.cenas.length - 1));
  const cena: Cena = ep.cenas[ci];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Fundo cenario={cena.cenario ?? 'estudio'} />
      <Topo ep={ep} ci={ci} />
      <Elenco ep={ep} />
      <Painel ep={ep} ci={ci} />
      <Legenda ep={ep} />
      <div style={{position: 'absolute', right: 60, bottom: 24, color: 'rgba(255,255,255,.55)', fontFamily: TEXTO, fontSize: 22}}>
        AI voices · story & lessons written and reviewed by our team
      </div>
      {/* No render em partes (workflow podcast.yml) o vídeo sai mudo e a narração entra inteira na junção. */}
      <Audio src={staticFile(ep.audio)} />
    </AbsoluteFill>
  );
};

// Miniatura 1280x720 (still): Mia e Leo + 2-4 palavras enormes + selo de nível. Sem texto dentro de imagem de IA:
// tudo é desenhado aqui.
export const PodcastCapa: React.FC<{ep: Ep}> = ({ep}) => {
  const palavras = (ep.capa ?? ep.titulo).toUpperCase();
  return (
    <AbsoluteFill style={{background: `linear-gradient(135deg, #1D2340, ${COR.coral})`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -40, top: 60, transform: 'scale(.82)', transformOrigin: 'left top'}}>
        {(['mia', 'leo'] as const).map((id) => (
          <Personagem key={id} id={id} visual={PERSONAGENS[id].visual} palavras={[]}
            expressoes={[{t: -1, e: id === 'mia' ? 'surpreso' : 'feliz'}]} olhar={id === 'mia' ? 1 : -1}
            x={PERSONAGENS[id].x - 80} y={560} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 640, right: 40, top: 70, display: 'flex', flexDirection: 'column', gap: 18}}>
        <div style={{display: 'flex', gap: 14}}>
          <span style={{background: COR.amarelo, color: COR.tinta, borderRadius: 999, padding: '4px 26px', fontFamily: TITULO,
            fontWeight: 700, fontSize: 56}}>{ep.nivel ?? 'A2'}</span>
          <span style={{background: '#fff', color: COR.tinta, borderRadius: 999, padding: '4px 26px', fontFamily: TITULO,
            fontWeight: 700, fontSize: 56}}>🎧 PODCAST</span>
        </div>
        <div style={{fontFamily: TITULO, fontWeight: 700, lineHeight: 1.0,
          fontSize: Math.min(110, Math.floor(600 / (Math.max(...palavras.split('\n').map((l) => l.length)) * 0.66))), color: '#fff', whiteSpace: 'pre-line',
          textShadow: '0 6px 24px rgba(0,0,0,.45)'}}>{palavras}</div>
        <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 44, color: COR.amarelo}}>EP. {ep.ep ?? 1}</div>
      </div>
    </AbsoluteFill>
  );
};
