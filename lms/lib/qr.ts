// Dependency-free QR Code encoder (byte mode, EC level M) → SVG / boolean matrix.
//
// Self-contained implementation of the parts of ISO/IEC 18004 needed to encode
// a short ASCII URL (the certificate verify link, ~40–60 chars): Reed–Solomon
// over GF(256), the standard module placement, data masking with penalty
// scoring, and BCH format/version information. Supports versions 1–10, which
// comfortably covers our URLs. NO npm dependency — see lib/__tests__/qr.test.ts.

// ── GF(256) arithmetic (primitive polynomial 0x11d) ──────────────────────────
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/** Reed–Solomon generator polynomial for `degree` EC codewords. */
function rsGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

/** EC codewords for one data block. */
function rsEncode(data: number[], ecCount: number): number[] {
  const gen = rsGenerator(ecCount);
  const res = new Array(ecCount).fill(0);
  for (const d of data) {
    const factor = d ^ res[0];
    res.shift();
    res.push(0);
    if (factor !== 0) {
      for (let i = 0; i < gen.length; i++) res[i] ^= gfMul(gen[i], factor);
    }
  }
  return res;
}

// ── Per-version tables (EC level M) ──────────────────────────────────────────
// [ecCodewordsPerBlock, blocksG1, dataPerBlockG1, blocksG2, dataPerBlockG2]
const EC_TABLE_M: Record<number, [number, number, number, number, number]> = {
  1: [10, 1, 16, 0, 0],
  2: [16, 1, 28, 0, 0],
  3: [26, 1, 44, 0, 0],
  4: [18, 2, 32, 0, 0],
  5: [24, 2, 43, 0, 0],
  6: [16, 4, 27, 0, 0],
  7: [18, 4, 31, 0, 0],
  8: [22, 2, 38, 2, 39],
  9: [22, 3, 36, 2, 37],
  10: [26, 4, 43, 1, 44],
};

/** Alignment-pattern centre coordinates per version (empty for v1). */
const ALIGN_POS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

// Remainder bits appended after the final codeword, per version.
const REMAINDER_BITS: Record<number, number> = {
  1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 0, 8: 0, 9: 0, 10: 0,
};

function totalDataCodewords(version: number): number {
  const [, b1, d1, b2, d2] = EC_TABLE_M[version];
  return b1 * d1 + b2 * d2;
}

/** Smallest version (1–10) whose byte-mode capacity fits `byteLen`. */
function pickVersion(byteLen: number): number {
  for (let v = 1; v <= 10; v++) {
    const countBits = v <= 9 ? 8 : 16;
    const needed = 4 + countBits + byteLen * 8; // mode + count + payload
    if (needed <= totalDataCodewords(v) * 8) return v;
  }
  throw new Error("qr: URL too long for supported versions (max 10)");
}

// ── Bit buffer ───────────────────────────────────────────────────────────────
class BitBuffer {
  bits: number[] = [];
  put(value: number, length: number) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >> i) & 1);
  }
  get length() {
    return this.bits.length;
  }
}

// ── Codeword assembly (data + EC, interleaved) ───────────────────────────────
function buildCodewords(text: string, version: number): number[] {
  const bytes = new TextEncoder().encode(text);
  const buf = new BitBuffer();
  buf.put(0b0100, 4); // byte mode
  buf.put(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) buf.put(b, 8);

  const capacityBits = totalDataCodewords(version) * 8;
  // Terminator (up to 4 zero bits).
  for (let i = 0; i < 4 && buf.length < capacityBits; i++) buf.bits.push(0);
  // Pad to a byte boundary.
  while (buf.length % 8 !== 0) buf.bits.push(0);

  const dataCodewords: number[] = [];
  for (let i = 0; i < buf.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | buf.bits[i + j];
    dataCodewords.push(byte);
  }
  // Pad bytes.
  const padBytes = [0xec, 0x11];
  let p = 0;
  while (dataCodewords.length < totalDataCodewords(version)) {
    dataCodewords.push(padBytes[p++ % 2]);
  }

  // Split into blocks.
  const [ecCount, b1, d1, b2, d2] = EC_TABLE_M[version];
  const blocks: { data: number[]; ec: number[] }[] = [];
  let offset = 0;
  for (let i = 0; i < b1; i++) {
    const data = dataCodewords.slice(offset, offset + d1);
    offset += d1;
    blocks.push({ data, ec: rsEncode(data, ecCount) });
  }
  for (let i = 0; i < b2; i++) {
    const data = dataCodewords.slice(offset, offset + d2);
    offset += d2;
    blocks.push({ data, ec: rsEncode(data, ecCount) });
  }

  // Interleave data codewords, then EC codewords.
  const result: number[] = [];
  const maxData = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxData; i++) {
    for (const blk of blocks) if (i < blk.data.length) result.push(blk.data[i]);
  }
  for (let i = 0; i < ecCount; i++) {
    for (const blk of blocks) result.push(blk.ec[i]);
  }
  return result;
}

// ── Matrix placement ─────────────────────────────────────────────────────────
type Cell = { dark: boolean; reserved: boolean };

function makeMatrix(size: number): Cell[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ dark: false, reserved: false })),
  );
}

function placeFinder(m: Cell[][], row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || rr >= m.length || cc < 0 || cc >= m.length) continue;
      const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
      const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      m[rr][cc] = { dark: isBorder || isCore, reserved: true };
    }
  }
}

function placeAlignment(m: Cell[][], version: number) {
  const pos = ALIGN_POS[version];
  for (const r of pos) {
    for (const c of pos) {
      // Skip the three finder-pattern corners.
      if ((r === 6 && c === 6) || (r === 6 && c === m.length - 7) || (r === m.length - 7 && c === 6))
        continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isRing = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          m[r + dr][c + dc] = { dark: isRing, reserved: true };
        }
      }
    }
  }
}

function placeTiming(m: Cell[][]) {
  const size = m.length;
  for (let i = 8; i < size - 8; i++) {
    const dark = i % 2 === 0;
    if (!m[6][i].reserved) m[6][i] = { dark, reserved: true };
    if (!m[i][6].reserved) m[i][6] = { dark, reserved: true };
  }
}

function reserveFormatAreas(m: Cell[][], version: number) {
  const size = m.length;
  // Format info (around the finders).
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      m[8][i].reserved = true;
      m[i][8].reserved = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    m[8][size - 1 - i].reserved = true;
    m[size - 1 - i][8].reserved = true;
  }
  // Dark module.
  m[size - 8][8] = { dark: true, reserved: true };
  // Version info blocks (v >= 7).
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        m[i][size - 11 + j].reserved = true;
        m[size - 11 + j][i].reserved = true;
      }
    }
  }
}

/** Zig-zag placement of the codeword bitstream into unreserved modules. */
function placeData(m: Cell[][], codewords: number[], version: number) {
  const size = m.length;
  const bits: number[] = [];
  for (const cw of codewords) for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
  for (let i = 0; i < REMAINDER_BITS[version]; i++) bits.push(0);

  let idx = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip the vertical timing column
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (m[row][cc].reserved) continue;
        m[row][cc].dark = idx < bits.length ? bits[idx] === 1 : false;
        idx++;
      }
    }
    upward = !upward;
  }
}

// ── Masking ──────────────────────────────────────────────────────────────────
function maskCondition(pattern: number, row: number, col: number): boolean {
  switch (pattern) {
    case 0: return (row + col) % 2 === 0;
    case 1: return row % 2 === 0;
    case 2: return col % 3 === 0;
    case 3: return (row + col) % 3 === 0;
    case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6: return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    case 7: return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
    default: return false;
  }
}

function applyMask(m: Cell[][], pattern: number): Cell[][] {
  const out = m.map((r) => r.map((c) => ({ ...c })));
  for (let row = 0; row < out.length; row++) {
    for (let col = 0; col < out.length; col++) {
      if (!out[row][col].reserved && maskCondition(pattern, row, col)) {
        out[row][col].dark = !out[row][col].dark;
      }
    }
  }
  return out;
}

/** Penalty score (lower is better) per the four ISO rules. */
function penalty(m: Cell[][]): number {
  const size = m.length;
  const at = (r: number, c: number) => m[r][c].dark;
  let score = 0;

  // Rule 1: runs of 5+ same-colour modules.
  for (let r = 0; r < size; r++) {
    for (const line of [true, false]) {
      let run = 1;
      let prev = line ? at(r, 0) : at(0, r);
      for (let c = 1; c < size; c++) {
        const cur = line ? at(r, c) : at(c, r);
        if (cur === prev) {
          run++;
        } else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
          prev = cur;
        }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
  }
  // Rule 2: 2×2 blocks.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = at(r, c);
      if (v === at(r, c + 1) && v === at(r + 1, c) && v === at(r + 1, c + 1)) score += 3;
    }
  }
  // Rule 3: finder-like patterns.
  const pat1 = [true, false, true, true, true, false, true, false, false, false, false];
  const pat2 = [false, false, false, false, true, false, true, true, true, false, true];
  const matches = (arr: boolean[], get: (i: number) => boolean) =>
    arr.every((v, i) => v === get(i));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 11 <= size) {
        if (matches(pat1, (i) => at(r, c + i)) || matches(pat2, (i) => at(r, c + i))) score += 40;
      }
      if (r + 11 <= size) {
        if (matches(pat1, (i) => at(r + i, c)) || matches(pat2, (i) => at(r + i, c))) score += 40;
      }
    }
  }
  // Rule 4: dark-module proportion.
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (at(r, c)) dark++;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;
  return score;
}

// ── Format & version information (BCH) ────────────────────────────────────────
function bch(data: number, poly: number, deg: number): number {
  let d = data << deg;
  const dataBits = 32 - Math.clz32(data);
  void dataBits;
  const polyBits = 32 - Math.clz32(poly);
  while (32 - Math.clz32(d) >= polyBits) {
    d ^= poly << (32 - Math.clz32(d) - polyBits);
  }
  return d;
}

function placeFormatInfo(m: Cell[][], maskPattern: number) {
  const size = m.length;
  // EC level M = 0b00.
  const data = (0b00 << 3) | maskPattern;
  const bits = ((data << 10) | bch(data, 0b10100110111, 10)) ^ 0b101010000010010;

  const bit = (i: number) => ((bits >> i) & 1) === 1;
  // Around top-left finder.
  for (let i = 0; i <= 5; i++) m[8][i].dark = bit(i);
  m[8][7].dark = bit(6);
  m[8][8].dark = bit(7);
  m[7][8].dark = bit(8);
  for (let i = 9; i <= 14; i++) m[14 - i][8].dark = bit(i);
  // Around the other two finders.
  for (let i = 0; i <= 7; i++) m[size - 1 - i][8].dark = bit(i);
  for (let i = 8; i <= 14; i++) m[8][size - 15 + i].dark = bit(i);
}

function placeVersionInfo(m: Cell[][], version: number) {
  if (version < 7) return;
  const size = m.length;
  const bits = (version << 12) | bch(version, 0b1111100100101, 12);
  for (let i = 0; i < 18; i++) {
    const on = ((bits >> i) & 1) === 1;
    const r = Math.floor(i / 3);
    const c = i % 3;
    m[r][size - 11 + c].dark = on;
    m[size - 11 + c][r].dark = on;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
/** Encode `text` as a QR matrix (true = dark module). */
export function qrMatrix(text: string): boolean[][] {
  const byteLen = new TextEncoder().encode(text).length;
  const version = pickVersion(byteLen);
  const size = 21 + (version - 1) * 4;

  const base = makeMatrix(size);
  placeFinder(base, 0, 0);
  placeFinder(base, 0, size - 7);
  placeFinder(base, size - 7, 0);
  placeAlignment(base, version);
  placeTiming(base);
  reserveFormatAreas(base, version);

  const codewords = buildCodewords(text, version);
  placeData(base, codewords, version);

  // Choose the mask with the lowest penalty.
  let best: Cell[][] | null = null;
  let bestPattern = 0;
  let bestScore = Infinity;
  for (let pattern = 0; pattern < 8; pattern++) {
    const masked = applyMask(base, pattern);
    placeFormatInfo(masked, pattern);
    placeVersionInfo(masked, version);
    const score = penalty(masked);
    if (score < bestScore) {
      bestScore = score;
      best = masked;
      bestPattern = pattern;
    }
  }
  void bestPattern;
  return best!.map((row) => row.map((cell) => cell.dark));
}

/**
 * Render `text` as a self-contained SVG string. `size` is the pixel edge of the
 * drawing; a quiet zone of `margin` modules is included per the spec.
 */
export function qrSvg(
  text: string,
  { size = 160, margin = 4, dark = "#16140F", light = "#F9F8FB" }: {
    size?: number;
    margin?: number;
    dark?: string;
    light?: string;
  } = {},
): string {
  const matrix = qrMatrix(text);
  const count = matrix.length;
  const total = count + margin * 2;
  const rects: string[] = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        rects.push(`<rect x="${c + margin}" y="${r + margin}" width="1" height="1"/>`);
      }
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" ` +
    `aria-label="QR code linking to the certificate verification page">` +
    `<rect width="${total}" height="${total}" fill="${light}"/>` +
    `<g fill="${dark}">${rects.join("")}</g>` +
    `</svg>`
  );
}
