export type Palavra = {w: string; s: number; e: number};

// Card do painel do podcast (ver serie-ingles/podcast/FORMATO.md).
export type CardPodcast =
  | {tipo: 'palavra'; termo: string; significado: string; exemplo?: string}
  | {tipo: 'erro'; errado: string; certo: string}
  | {tipo: 'frase'; en: string}
  | {tipo: 'quiz'; pergunta: string}
  | {tipo: 'resposta'; texto: string}
  | {tipo: 'lista'; titulo?: string; itens: string[]};

export type Fala = {
  card?: CardPodcast; // podcast: aparece no painel a partir desta fala
  voz?: string; // chave de roteiro.vozes: 'pt' | 'en' | 'narr' (narrador em inglês da versão global)
  texto?: string;
  pausa?: number;
  mostra?: string;
  gatilho?: string; // palavra da fala que dispara o "mostra" (padrão: a primeira)
  inicio: number;
  fim: number;
  palavras?: Palavra[];
};

export type Cena = {
  tipo: 'abertura' | 'erro' | 'quiz' | 'final' | 'tela' | 'bloco' | 'kids'; // 'bloco': podcast · 'kids': desenho 3D
  // 'tela' (formato dica): uma ideia em tela cheia
  // kids (desenho 3D): palavra em inglês/português, quantos balões na cena e o tipo de momento
  en?: string;
  pt?: string;
  baloes?: number;
  quantidade?: number; // kids: quantas cópias do desenho (imagem) aparecem
  revisao?: boolean;
  desafio?: boolean;
  encerramento?: boolean;
  cenario?: string; // podcast: estudio | cafe | mercado | rua | casa | trabalho | viagem
  visual?: 'erro' | 'certo' | 'regra' | 'vez' | 'bonus' | 'quiz';
  grande?: string;
  pequeno?: string;
  inicio: number;
  fim: number;
  falas: Fala[];
  titulo?: string[];
  numero?: number;
  manchete?: string; // shorts: título curto do bloco no lugar do "Nº", ex.: "IN ou ON?"
  rotulo?: string; // ex.: "ERRO COMUM", "FALSO AMIGO", "PALAVRA DO DIA"
  imagem?: string; // emoji ilustrativo (vira desenho Twemoji), ex.: "🍎"
  pronuncia?: string; // pronúncia aproximada para brasileiros, ex.: "câmf-ter-bou"
  errado?: string; // opcional: sem ele, o bloco vira dica → certo → exemplo
  dica?: string;
  certo?: string;
  exemplo?: {en: string; pt: string};
  pergunta?: string;
  opcoes?: string[];
  correta?: number;
  chamada?: string;
};

export type Episodio = {
  slug: string;
  episodio: number;
  titulo: string;
  tema?: string; // dica: etiqueta fixa do topo (padrão: titulo); use uma pergunta quando o título entrega a resposta
  formato?: 'short' | 'episodio' | 'longo' | 'dica' | 'podcast' | 'kids';
  nivel?: string; // podcast: A1, A2, B1, B2
  serie?: string; // podcast: Easy | Real Talk
  ep?: number; // podcast: número do episódio na série
  personagens?: Personagens; // kids: criança e animal do episódio
  capa?: string; // podcast: 2-4 palavras grandes da miniatura (\n quebra linha) // ver serie-ingles/ESTRATEGIA.md (padrão: episodio)
  duracao: number;
  audio: string;
  fotos: string[];
  cenario?: string[]; // emojis do cenário de fundo, ex.: ["✈️", "🧳", "🛂"]
  cenas: Cena[];
};

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9']/g, '');

// Segundo (absoluto) em que o elemento `chave` da cena aparece. Vem sempre do tempo da palavra falada.
export const momento = (cena: Cena, chave: string): number | null => {
  const fala = cena.falas.find((f) => f.mostra === chave);
  if (!fala) return null;
  const p = fala.palavras ?? [];
  if (fala.gatilho) {
    const g = p.find((x) => norm(x.w) === norm(fala.gatilho!));
    if (g) return g.s;
  }
  return p[0]?.s ?? fala.inicio;
};

// Desenho 3D para crianças: cada episódio tem uma criança (fala inglês) e um animal (fala português) diferentes.
export type Crianca = {
  nome: string;
  tipo: 'menina' | 'menino';
  pele: string;
  cabelo: {cor: string; estilo: 'curto' | 'cacheado' | 'marias' | 'rabo' | 'black'};
  roupa: string;
  roupa2?: string;
  olhos?: string;
};
export type Animal = {tipo: 'papagaio' | 'gato' | 'cachorro' | 'coelho' | 'sapo' | 'urso'; nome: string; cor: string; cor2?: string};
export type Personagens = {crianca: Crianca; animal: Animal};
