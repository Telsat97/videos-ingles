import * as THREE from 'three';

// Modelagem por "campos de distância" (SDF): o personagem é uma soma suave de formas (bochecha que se funde no
// rosto, braço que se funde no ombro), sem emendas de bolinhas. A malha sai por Surface Nets e as normais vêm do
// gradiente do campo, então a superfície fica lisa como um modelo esculpido. Gerado uma vez por aba do render.

export type V3 = [number, number, number];
export type Campo = (x: number, y: number, z: number) => number;

const len = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

export const esfera = (c: V3, r: number): Campo => (x, y, z) => len(x - c[0], y - c[1], z - c[2]) - r;

// Elipsoide (aproximação com boa continuidade, de Inigo Quilez).
export const elipsoide = (c: V3, r: V3): Campo => (x, y, z) => {
  const px = x - c[0], py = y - c[1], pz = z - c[2];
  const k0 = len(px / r[0], py / r[1], pz / r[2]);
  const k1 = len(px / (r[0] * r[0]), py / (r[1] * r[1]), pz / (r[2] * r[2]));
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
};

// Cápsula com raios diferentes nas pontas (cone arredondado): braços, pernas, pescoço, saia.
export const capsula = (a: V3, b: V3, ra: number, rb: number): Campo => (x, y, z) => {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const pax = x - a[0], pay = y - a[1], paz = z - a[2];
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  return len(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h);
};

// União suave (k = quanto as formas "derretem" uma na outra), interseção e subtração.
export const uniao = (k: number, ...fs: Campo[]): Campo => (x, y, z) => {
  let d = fs[0](x, y, z);
  for (let i = 1; i < fs.length; i++) {
    const e = fs[i](x, y, z);
    const h = Math.max(k - Math.abs(d - e), 0) / k;
    d = Math.min(d, e) - h * h * k * 0.25;
  }
  return d;
};
export const intersecao = (a: Campo, b: Campo): Campo => (x, y, z) => Math.max(a(x, y, z), b(x, y, z));
export const subtrai = (k: number, a: Campo, b: Campo): Campo => (x, y, z) => {
  const d1 = a(x, y, z), d2 = -b(x, y, z);
  const h = Math.max(k - Math.abs(d1 - d2), 0) / k;
  return Math.max(d1, d2) + h * h * k * 0.25;
};
// Semiespaço: lado onde n·p > c fica "dentro".
export const semiespaco = (n: V3, c: number): Campo => {
  const l = len(...n);
  return (x, y, z) => c - (n[0] * x + n[1] * y + n[2] * z) / l;
};

// Surface Nets: um vértice por célula cruzada pela superfície, quads nas arestas cruzadas.
export const malha = (f: Campo, min: V3, max: V3, passo: number): THREE.BufferGeometry => {
  const nx = Math.ceil((max[0] - min[0]) / passo) + 1;
  const ny = Math.ceil((max[1] - min[1]) / passo) + 1;
  const nz = Math.ceil((max[2] - min[2]) / passo) + 1;
  const val = new Float32Array(nx * ny * nz);
  const id = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++)
    val[id(i, j, k)] = f(min[0] + i * passo, min[1] + j * passo, min[2] + k * passo);

  const vert = new Int32Array(nx * ny * nz).fill(-1);
  const pos: number[] = [];
  const cantos = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const arestas = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const v = cantos.map(([a, b, c]) => val[id(i + a, j + b, k + c)]);
    if (v.every((x) => x > 0) || v.every((x) => x <= 0)) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of arestas) {
      if ((v[a] > 0) === (v[b] > 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      const ca = cantos[a], cb = cantos[b];
      sx += ca[0] + (cb[0] - ca[0]) * t; sy += ca[1] + (cb[1] - ca[1]) * t; sz += ca[2] + (cb[2] - ca[2]) * t; n++;
    }
    vert[id(i, j, k)] = pos.length / 3;
    pos.push(min[0] + (i + sx / n) * passo, min[1] + (j + sy / n) * passo, min[2] + (k + sz / n) * passo);
  }
  const ind: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, inverte: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (inverte) ind.push(a, c, b, a, d, c); else ind.push(a, b, c, a, c, d);
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const dentro = val[id(i, j, k)] <= 0;
    if (dentro !== (val[id(i + 1, j, k)] <= 0))
      quad(vert[id(i, j - 1, k - 1)], vert[id(i, j, k - 1)], vert[id(i, j, k)], vert[id(i, j - 1, k)], dentro);
    if (dentro !== (val[id(i, j + 1, k)] <= 0))
      quad(vert[id(i - 1, j, k - 1)], vert[id(i - 1, j, k)], vert[id(i, j, k)], vert[id(i, j, k - 1)], dentro);
    if (dentro !== (val[id(i, j, k + 1)] <= 0))
      quad(vert[id(i - 1, j - 1, k)], vert[id(i, j - 1, k)], vert[id(i, j, k)], vert[id(i - 1, j, k)], dentro);
  }
  // Normais pelo gradiente do campo: superfície lisa, sem "facetas".
  const nor = new Float32Array(pos.length);
  const e = passo * 0.5;
  for (let p = 0; p < pos.length; p += 3) {
    const [x, y, z] = [pos[p], pos[p + 1], pos[p + 2]];
    const gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e);
    const l = len(gx, gy, gz) || 1;
    nor[p] = gx / l; nor[p + 1] = gy / l; nor[p + 2] = gz / l;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setIndex(ind);
  return g;
};
