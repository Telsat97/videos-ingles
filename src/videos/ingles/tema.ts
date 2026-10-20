import {loadFont as carregarFredoka} from '@remotion/google-fonts/Fredoka';
import {loadFont as carregarNunito} from '@remotion/google-fonts/Nunito';

// Identidade da série: aconchegante, clara, legível no celular.
export const COR = {
  fundo: '#FFF6EA',
  fundo2: '#FDE9D2',
  tinta: '#1F2A44',
  suave: '#5B6478',
  coral: '#FF6B57',
  menta: '#1FA971',
  mentaClaro: '#DDF6EA',
  vermelho: '#E5484D',
  vermelhoClaro: '#FDE3E3',
  amarelo: '#FFD45C',
  branco: '#FFFFFF',
  azul: '#3D7BF7',
};

export const SERIE = 'INGLÊS FÁCIL';

export const TITULO = carregarFredoka('normal', {weights: ['500', '600', '700'], subsets: ['latin']}).fontFamily;
export const TEXTO = carregarNunito('normal', {weights: ['600', '800', '900'], subsets: ['latin']}).fontFamily;

// Zonas seguras do 9:16 (interface do TikTok/Reels/Shorts): topo ~250 px, base ~420 px, lateral direita ~140 px.
export const ZONA = {topo: 250, base: 1920 - 420, esq: 64, dir: 1080 - 140};
