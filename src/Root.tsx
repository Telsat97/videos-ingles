import React from 'react';
import {Composition, Folder} from 'remotion';
import {MinimalSuico} from './estilos/MinimalSuico';
import {TerminalTecnico} from './estilos/TerminalTecnico';
import {VerticalDados} from './estilos/VerticalDados';
import {VerticalLegendas} from './estilos/VerticalLegendas';
import {VerticalPrint} from './estilos/VerticalPrint';
import {Dica} from './videos/ingles/Dica';
import {Episodio} from './videos/ingles/Episodio';
import {Podcast, PodcastCapa} from './videos/ingles/Podcast';
import {episodios} from './videos/ingles/episodios.gen';

const FPS = 30;
const SEIS_SEGUNDOS = 6 * FPS;

export const RemotionRoot: React.FC = () => (
  <>
    {/* Exemplos que rodam sem nenhum vídeo. Servem de referência de estilo, não de padrão fixo. */}
    <Folder name="Estilos">
      <Composition id="MinimalSuico" component={MinimalSuico} width={1920} height={1080} fps={FPS} durationInFrames={SEIS_SEGUNDOS} />
      <Composition id="TerminalTecnico" component={TerminalTecnico} width={1920} height={1080} fps={FPS} durationInFrames={SEIS_SEGUNDOS} />
      <Composition id="VerticalLegendas" component={VerticalLegendas} width={1080} height={1920} fps={FPS} durationInFrames={SEIS_SEGUNDOS} />
      <Composition id="VerticalPrint" component={VerticalPrint} width={1080} height={1920} fps={FPS} durationInFrames={SEIS_SEGUNDOS} />
      <Composition id="VerticalDados" component={VerticalDados} width={1080} height={1920} fps={FPS} durationInFrames={SEIS_SEGUNDOS} />
    </Folder>

    {/* Seus vídeos entram aqui: um <Folder name="001-slug"> por projeto, com o código em src/videos/<slug>/. */}
    {/* Série de inglês: um episódio por roteiro, gerado por tools/narrar.py. */}
    <Folder name="ingles">
      {episodios.map((ep) => ep.formato === 'podcast' ? (
        // Podcast semanal: só 16:9 (ver serie-ingles/podcast/FORMATO.md).
        <React.Fragment key={ep.slug}>
          <Composition id={`ingles-${ep.slug}`} component={Podcast} defaultProps={{ep}} width={1920} height={1080}
            fps={FPS} durationInFrames={Math.ceil(ep.duracao * FPS)} />
          <Composition id={`ingles-${ep.slug}-capa`} component={PodcastCapa} defaultProps={{ep}} width={1280} height={720}
            fps={FPS} durationInFrames={1} />
        </React.Fragment>
      ) : (
        <React.Fragment key={ep.slug}>
          <Composition
            id={`ingles-${ep.slug}`}
            component={ep.formato === 'dica' ? Dica : Episodio}
            defaultProps={{ep, formato: 'vertical' as const}}
            width={1080}
            height={1920}
            fps={FPS}
            durationInFrames={Math.ceil(ep.duracao * FPS)}
          />
          <Composition
            id={`ingles-${ep.slug}-h`}
            component={Episodio}
            defaultProps={{ep, formato: 'horizontal' as const}}
            width={1920}
            height={1080}
            fps={FPS}
            durationInFrames={Math.ceil(ep.duracao * FPS)}
          />
        </React.Fragment>
      ))}
    </Folder>
  </>
);
