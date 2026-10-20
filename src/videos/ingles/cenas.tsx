import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Card, clamp, Foto, Ilustracao, Legenda, Professor, Selo, useLayout, useMola, useT} from './comuns';
import {COR, TEXTO, TITULO} from './tema';
import {momento, type Cena} from './tipos';

type P = {cena: Cena; foto?: string};

// Cards do bloco de ensino ficam numa coluna: o espaço é reservado antes de aparecerem, nada pula.
const EMPILHA: React.CSSProperties = {position: 'relative', left: 0, right: 0};

const Rotulo: React.FC<{cor: string; children: React.ReactNode}> = ({cor, children}) => (
  <div style={{fontFamily: TEXTO, fontWeight: 900, fontSize: 30, letterSpacing: 2, color: cor, marginBottom: 4}}>{children}</div>
);

// Desenho que entra com mola e fica "boiando" (balanço suave).
const Adesivo: React.FC<{emoji: string; inicio: number | null; tam: number; style: React.CSSProperties}> = ({emoji, inicio, tam, style}) => {
  const {t} = useT();
  const m = useMola(inicio, 10);
  return (
    <div
      style={{
        position: 'absolute', ...style, opacity: interpolate(m, [0, 0.2], [0, 1], clamp),
        transform: `scale(${m}) translateY(${10 * Math.sin(t * 2)}px) rotate(${6 * Math.sin(t * 1.4)}deg)`,
        filter: 'drop-shadow(0 14px 18px rgba(31,42,68,.22))',
      }}
    >
      <Ilustracao emoji={emoji} tam={tam} />
    </div>
  );
};

// Abertura: o apresentador em destaque, título grande ao lado (16:9) ou abaixo do rosto (9:16).
export const Abertura: React.FC<P> = ({cena, foto}) => {
  const {t} = useT();
  const L = useLayout();
  const zoom = interpolate(t, [cena.inicio, cena.fim], [1.0, 1.08], clamp);
  const ti = momento(cena, 'titulo');
  const linhas = cena.titulo ?? [];
  return (
    <AbsoluteFill>
      {/* No 16:9 a foto (retrato 9:16) entra inteira à direita, sobre um fundo azul, com a borda esquerda
          se dissolvendo. No 9:16 ela ocupa a tela toda, com um degradê por cima para o título. */}
      {L.h && <AbsoluteFill style={{background: 'linear-gradient(90deg, #1F2A44 0%, #1F2A44 55%, #2b3656 100%)'}} />}
      <AbsoluteFill
        style={
          L.h
            ? {left: 'auto', right: 0, width: 700, overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent, #000 22%)'}
            : undefined
        }
      >
        <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 30%'}}>
          <Foto src={foto} />
        </AbsoluteFill>
      </AbsoluteFill>
      {!L.h && (
        <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,.35) 0%, transparent 18%, transparent 42%, rgba(15,20,35,.88) 62%)'}} />
      )}
      <div style={L.h ? {position: 'absolute', left: 110, width: 820, top: 230} : {position: 'absolute', left: L.esq, right: L.dir, top: 900, textAlign: 'center'}}>
        {linhas.map((l, i) => (
          <Linha key={l} texto={l} inicio={ti === null ? null : ti + i * 0.18} grande={i === 0} largura={L.h ? 820 : L.w - L.esq - L.dir} />
        ))}
      </div>
      <Legenda falas={cena.falas} top={L.h ? 780 : 1270} dir={L.h ? 1000 : undefined} esq={L.h ? 110 : undefined} />
    </AbsoluteFill>
  );
};

const Linha: React.FC<{texto: string; inicio: number | null; grande: boolean; largura: number}> = ({texto, inicio, grande, largura}) => {
  const m = useMola(inicio, 12);
  // A palavra grande cabe numa linha só: palavras longas ("RESTAURANTE") diminuem em vez de cortar ou quebrar.
  const tam = grande ? Math.min(190, Math.floor(largura / (texto.length * 0.66))) : 72;
  return (
    <div
      style={{
        fontFamily: TITULO, fontWeight: 700, lineHeight: 1.02, fontSize: tam, whiteSpace: grande ? 'nowrap' : undefined,
        color: grande ? COR.amarelo : COR.branco, textShadow: '0 10px 30px rgba(0,0,0,.5)',
        opacity: interpolate(m, [0, 0.3], [0, 1], clamp), transform: `translateY(${(1 - m) * 50}px) scale(${0.85 + 0.15 * m})`,
      }}
    >
      {texto}
    </div>
  );
};

// Bloco de ensino: (errado →) (dica →) certo → exemplo → "sua vez".
export const Erro: React.FC<P> = ({cena, foto}) => {
  const {t} = useT();
  const L = useLayout();
  const entrada = useMola(cena.inicio, 13);
  const tErr = momento(cena, 'errado');
  const tDica = momento(cena, 'dica');
  const tCerto = momento(cena, 'certo');
  const mErrado = useMola(tErr);
  const mDica = useMola(tDica, 11);
  const mCerto = useMola(tCerto, 11);
  const mEx = useMola(momento(cena, 'exemplo'));
  const fSuaVez = cena.falas.find((f) => f.mostra === 'suavez');
  const naVez = fSuaVez && t >= fSuaVez.inicio && t < fSuaVez.fim;
  const pVez = fSuaVez ? interpolate(t, [fSuaVez.inicio, fSuaVez.fim], [1, 0], clamp) : 0;
  const risco = interpolate(t, [(tErr ?? 0) + 0.5, (tErr ?? 0) + 1.0], [0, 100], clamp);
  // A ilustração entra junto com o primeiro conteúdo dito, nunca antes.
  const tImg = [tErr, tDica, tCerto].filter((x): x is number => x !== null).sort((a, b) => a - b)[0] ?? null;

  const cabecalho = (
    <div style={{transform: `translateX(${(1 - entrada) * 80}px)`, opacity: entrada}}>
      <div style={{fontFamily: TEXTO, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: COR.suave}}>
        {cena.rotulo ?? (cena.errado ? 'ERRO COMUM' : 'DICA')}
      </div>
      <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 92, color: COR.coral, lineHeight: 1}}>Nº {cena.numero}</div>
    </div>
  );

  return (
    <AbsoluteFill>
      {L.h ? (
        <>
          <Professor foto={foto} falas={cena.falas} x={130} y={150} tam={300} entrada={entrada} />
          <div style={{position: 'absolute', left: 120, top: 490}}>{cabecalho}</div>
          {cena.imagem && <Adesivo emoji={cena.imagem} inicio={tImg} tam={210} style={{left: 170, top: 640}} />}
        </>
      ) : (
        <>
          <Professor foto={foto} falas={cena.falas} x={L.esq + 6} y={308} tam={170} entrada={entrada} />
          <div style={{position: 'absolute', left: 270, top: 330}}>{cabecalho}</div>
          {cena.imagem && <Adesivo emoji={cena.imagem} inicio={tImg} tam={180} style={{left: L.w - L.dir - 190, top: 300}} />}
        </>
      )}

      <div
        style={{
          position: 'absolute', left: L.h ? 640 : L.esq, right: L.dir, top: L.h ? 120 : 515,
          display: 'flex', flexDirection: 'column', gap: L.h ? 18 : 22,
        }}
      >
        {cena.errado && (
          <Card entrada={mErrado} fundo={COR.vermelhoClaro} borda={COR.vermelho} style={EMPILHA}>
            <Rotulo cor={COR.vermelho}>✗ NÃO FALE ASSIM</Rotulo>
            <span style={{position: 'relative', fontFamily: TITULO, fontWeight: 600, fontSize: 62, color: COR.tinta}}>
              {cena.errado}
              <span style={{position: 'absolute', left: 0, top: '54%', height: 8, width: `${risco}%`, background: COR.vermelho, borderRadius: 4}} />
            </span>
          </Card>
        )}

        {cena.dica && (
          <Card entrada={mDica} fundo={COR.amarelo} borda="#F2B92B" giro={-1.6} style={{...EMPILHA, padding: '18px 28px'}}>
            <div style={{fontFamily: TEXTO, fontWeight: 800, fontSize: 44, color: COR.tinta, lineHeight: 1.2}}>💡 {cena.dica}</div>
          </Card>
        )}

        <Card entrada={mCerto} fundo={COR.mentaClaro} borda={COR.menta} style={EMPILHA}>
          <Rotulo cor={COR.menta}>✓ FALE ASSIM</Rotulo>
          <div style={{fontFamily: TITULO, fontWeight: 700, fontSize: 72, color: COR.menta, lineHeight: 1.05}}>{cena.certo}</div>
          {cena.pronuncia && (
            <div style={{fontFamily: TEXTO, fontWeight: 800, fontSize: 40, color: COR.suave, marginTop: 6}}>🔊 fala-se: {cena.pronuncia}</div>
          )}
        </Card>

        <Card
          entrada={mEx}
          fundo={COR.branco}
          borda={naVez ? COR.coral : '#E8DCCB'}
          style={{...EMPILHA, padding: '16px 28px', transform: `scale(${naVez ? 1.03 : 1}) translateY(${(1 - mEx) * 60}px)`}}
        >
          <div style={{fontFamily: TITULO, fontWeight: 600, fontSize: 50, color: COR.tinta}}><Selo lingua="en" />{cena.exemplo?.en}</div>
          <div style={{fontFamily: TEXTO, fontWeight: 600, fontSize: 36, color: COR.suave}}><Selo lingua="pt" tam={28} />{cena.exemplo?.pt}</div>
          {naVez && (
            <>
              <div
                style={{
                  position: 'absolute', right: -14, top: -40, background: COR.coral, color: COR.branco, fontFamily: TITULO,
                  fontWeight: 700, fontSize: 40, padding: '8px 24px', borderRadius: 40, transform: `rotate(4deg) scale(${1 + 0.05 * Math.sin(t * 10)})`,
                }}
              >
                SUA VEZ!
              </div>
              <div style={{position: 'absolute', left: 28, bottom: 10, height: 8, width: `calc(${pVez * 100}% - 56px)`, background: COR.coral, borderRadius: 4}} />
            </>
          )}
        </Card>
      </div>

      <Legenda falas={cena.falas} />
    </AbsoluteFill>
  );
};

// Desafio final: pergunta, três opções, contagem e revelação.
export const Quiz: React.FC<P> = ({cena}) => {
  const {t} = useT();
  const L = useLayout();
  const mPerg = useMola(momento(cena, 'pergunta'));
  const tOp = momento(cena, 'opcoes');
  const tResp = momento(cena, 'resposta');
  const fCont = cena.falas.find((f) => f.mostra === 'contagem');
  const revelou = tResp !== null && t >= tResp;
  return (
    <AbsoluteFill>
      <Card entrada={mPerg} fundo={COR.tinta} borda={COR.tinta} style={{top: L.h ? 120 : 320, textAlign: 'center', ...(L.h ? {left: 160, right: 160} : {})}}>
        <div style={{fontFamily: TEXTO, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: COR.amarelo}}>🧠 DESAFIO</div>
        <div style={{fontFamily: TITULO, fontWeight: 600, fontSize: 58, color: COR.branco, lineHeight: 1.15}}>{cena.pergunta}</div>
      </Card>
      {(cena.opcoes ?? []).map((op, i) => (
        <Opcao key={op} i={i} texto={op} inicio={tOp === null ? null : tOp + i * 0.35} revelou={revelou} certa={i === cena.correta} />
      ))}
      {fCont && t >= fCont.inicio && t < fCont.fim && <Contagem inicio={fCont.inicio} dur={fCont.fim - fCont.inicio} />}
      {revelou && <Adesivo emoji="🎉" inicio={tResp} tam={L.h ? 220 : 170} style={L.h ? {left: 1500, top: 420} : {left: L.w - L.dir - 180, top: 1060}} />}
      <Legenda falas={cena.falas} />
    </AbsoluteFill>
  );
};

const Opcao: React.FC<{i: number; texto: string; inicio: number | null; revelou: boolean; certa: boolean}> = ({
  i, texto, inicio, revelou, certa,
}) => {
  const L = useLayout();
  const m = useMola(inicio);
  const letra = 'ABC'[i];
  const cor = revelou ? (certa ? COR.menta : '#C9C2B8') : COR.tinta;
  return (
    <Card
      entrada={m}
      fundo={revelou && certa ? COR.mentaClaro : COR.branco}
      borda={revelou && certa ? COR.menta : '#E8DCCB'}
      style={{
        top: L.h ? 360 + i * 145 : 600 + i * 150, ...(L.h ? {left: 160, right: 560} : {}),
        padding: '18px 26px', display: 'flex', alignItems: 'center', gap: 24, opacity: revelou && !certa ? 0.45 : 1,
        transform: `translateX(${(1 - m) * 120}px) scale(${revelou && certa ? 1.05 : 1})`,
      }}
    >
      <div
        style={{
          width: 76, height: 76, borderRadius: 20, background: cor, color: COR.branco, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: TITULO, fontWeight: 700, fontSize: 46, flexShrink: 0,
        }}
      >
        {revelou ? (certa ? '✓' : '✗') : letra}
      </div>
      <div style={{fontFamily: TITULO, fontWeight: 600, fontSize: 54, color: COR.tinta}}>{texto}</div>
    </Card>
  );
};

const Contagem: React.FC<{inicio: number; dur: number}> = ({inicio, dur}) => {
  const {t} = useT();
  const L = useLayout();
  const passo = dur / 3;
  const k = Math.min(2, Math.floor((t - inicio) / passo));
  const fr = ((t - inicio) % passo) / passo;
  const tam = L.h ? 220 : 150;
  return (
    <div
      style={{
        position: 'absolute', left: L.h ? 1500 : (L.w - L.dir + L.esq) / 2 - tam / 2, top: L.h ? 420 : 1065, width: tam, height: tam,
        borderRadius: '50%', background: COR.coral, color: COR.branco, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: TITULO, fontWeight: 700, fontSize: tam * 0.64, transform: `scale(${1.25 - 0.25 * Math.min(1, fr * 4)})`,
        boxShadow: '0 14px 30px rgba(255,107,87,.4)',
      }}
    >
      {3 - k}
    </div>
  );
};

// Encerramento: apresentador, chamada para seguir.
export const Final: React.FC<P> = ({cena, foto}) => {
  const {t} = useT();
  const L = useLayout();
  const entrada = useMola(cena.inicio, 12);
  const tCh = momento(cena, 'chamada');
  const mCh = useMola(tCh, 11);
  const centro = (L.w - L.dir + L.esq) / 2;
  return (
    <AbsoluteFill>
      <Professor foto={foto} falas={cena.falas} x={L.h ? 230 : centro - 190} y={L.h ? 170 : 330} tam={L.h ? 520 : 380} entrada={entrada} />
      <Adesivo emoji="🔔" inicio={tCh} tam={L.h ? 150 : 130} style={L.h ? {left: 660, top: 140} : {left: centro + 140, top: 300}} />
      <div
        style={{
          position: 'absolute', ...(L.h ? {left: 900, right: L.dir, top: 280, textAlign: 'left'} : {left: L.esq, right: L.dir, top: 790, textAlign: 'center'}),
          fontFamily: TITULO, fontWeight: 700, fontSize: L.h ? 88 : 76, color: COR.tinta, lineHeight: 1.08,
          opacity: mCh, transform: `translateY(${(1 - mCh) * 40}px)`,
        }}
      >
        {cena.chamada}
      </div>
      <div
        style={{
          position: 'absolute', left: L.h ? 900 : centro, top: L.h ? 600 : 1080,
          transform: `${L.h ? '' : 'translateX(-50%) '}scale(${mCh * (1 + 0.05 * Math.sin(t * 6))})`, transformOrigin: L.h ? 'left center' : 'center',
          background: COR.coral, color: COR.branco, fontFamily: TITULO, fontWeight: 700, fontSize: 54, padding: '18px 52px',
          borderRadius: 60, boxShadow: '0 14px 30px rgba(255,107,87,.4)', whiteSpace: 'nowrap',
        }}
      >
        {L.h ? 'INSCREVA-SE' : 'SEGUIR'}
      </div>
      <Legenda falas={cena.falas} />
    </AbsoluteFill>
  );
};
