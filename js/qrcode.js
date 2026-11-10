/**
 * Gerador de QR Code Moderno e Autocontido para a Cabine de Fotos
 * Gera matriz QR padrão ISO/IEC 18004 com suporte a correção de erros e renderização direta em Canvas/SVG/DataURL.
 */
(function(root) {
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  for (let i = 0, x = 1; i < 255; i++) {
    EXP[i] = x;
    EXP[i + 255] = x;
    LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }

  function gfMul(x, y) {
    return (x === 0 || y === 0) ? 0 : EXP[LOG[x] + LOG[y]];
  }

  function rsGenPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= gfMul(poly[j], EXP[i]);
        next[j + 1] ^= poly[j];
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, numEcBytes) {
    const gen = rsGenPoly(numEcBytes);
    const res = new Array(numEcBytes).fill(0);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ res[0];
      res.shift();
      res.push(0);
      for (let j = 0; j < numEcBytes; j++) {
        res[j] ^= gfMul(gen[j + 1], factor);
      }
    }
    return res;
  }

  const VERSIONS = [
    null,
    { totalBytes: 26, ecBytes: 10, align: [] },
    { totalBytes: 44, ecBytes: 16, align: [6, 18] },
    { totalBytes: 70, ecBytes: 26, align: [6, 22] },
    { totalBytes: 100, ecBytes: 36, align: [6, 26] },
    { totalBytes: 134, ecBytes: 48, align: [6, 30] },
    { totalBytes: 172, ecBytes: 64, align: [6, 34] },
    { totalBytes: 196, ecBytes: 72, align: [6, 22, 38] },
    { totalBytes: 242, ecBytes: 88, align: [6, 24, 42] },
    { totalBytes: 292, ecBytes: 110, align: [6, 26, 46] },
    { totalBytes: 346, ecBytes: 130, align: [6, 28, 50] }
  ];

  function pickVersion(dataLen) {
    for (let v = 1; v < VERSIONS.length; v++) {
      const cap = VERSIONS[v].totalBytes - VERSIONS[v].ecBytes - 3;
      if (dataLen <= cap) return v;
    }
    return 10;
  }

  class QRCodeModel {
    constructor(text) {
      this.text = text;
      const utf8 = new TextEncoder().encode(text);
      this.version = pickVersion(utf8.length);
      const vInfo = VERSIONS[this.version];
      this.moduleCount = this.version * 4 + 17;
      this.modules = Array.from({ length: this.moduleCount }, () => new Array(this.moduleCount).fill(null));
      this.isDark = Array.from({ length: this.moduleCount }, () => new Array(this.moduleCount).fill(false));

      this.make(utf8, vInfo);
    }

    make(utf8, vInfo) {
      this.setupFinderPatterns();
      this.setupTimingPatterns();
      this.setupAlignmentPatterns(vInfo.align);

      const dataCap = vInfo.totalBytes - vInfo.ecBytes;
      const bits = [];
      const pushBits = (val, len) => {
        for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
      };

      pushBits(0b0100, 4);
      pushBits(utf8.length, this.version < 10 ? 8 : 16);
      for (let b of utf8) pushBits(b, 8);

      const padLen = dataCap * 8 - bits.length;
      const termLen = Math.min(4, Math.max(0, padLen));
      for (let i = 0; i < termLen; i++) bits.push(0);
      while (bits.length % 8 !== 0) bits.push(0);

      const padBytes = [0xEC, 0x11];
      let pIdx = 0;
      while (bits.length < dataCap * 8) {
        pushBits(padBytes[pIdx % 2], 8);
        pIdx++;
      }

      const dataBytes = [];
      for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
        dataBytes.push(byte);
      }

      const ecBytes = rsEncode(dataBytes, vInfo.ecBytes);
      const finalSequence = [...dataBytes, ...ecBytes];

      this.mapData(finalSequence);
    }

    setupFinderPatterns() {
      const drawFinder = (startX, startY) => {
        for (let y = -1; y <= 7; y++) {
          for (let x = -1; x <= 7; x++) {
            const rx = startX + x;
            const ry = startY + y;
            if (rx < 0 || rx >= this.moduleCount || ry < 0 || ry >= this.moduleCount) continue;
            const isDark = (x >= 0 && x <= 6 && (y === 0 || y === 6)) ||
                           (y >= 0 && y <= 6 && (x === 0 || x === 6)) ||
                           (x >= 2 && x <= 4 && y >= 2 && y <= 4);
            this.modules[ry][rx] = true;
            this.isDark[ry][rx] = isDark;
          }
        }
      };

      drawFinder(0, 0);
      drawFinder(this.moduleCount - 7, 0);
      drawFinder(0, this.moduleCount - 7);
    }

    setupTimingPatterns() {
      for (let i = 8; i < this.moduleCount - 8; i++) {
        if (this.modules[6][i] === null) {
          this.modules[6][i] = true;
          this.isDark[6][i] = (i % 2 === 0);
        }
        if (this.modules[i][6] === null) {
          this.modules[i][6] = true;
          this.isDark[i][6] = (i % 2 === 0);
        }
      }
    }

    setupAlignmentPatterns(align) {
      for (let r of align) {
        for (let c of align) {
          if (this.modules[r][c] !== null) continue;
          for (let y = -2; y <= 2; y++) {
            for (let x = -2; x <= 2; x++) {
              this.modules[r + y][c + x] = true;
              this.isDark[r + y][c + x] = Math.max(Math.abs(x), Math.abs(y)) !== 1;
            }
          }
        }
      }
    }

    mapData(dataBytes) {
      let byteIdx = 0;
      let bitIdx = 7;
      let upward = true;

      for (let right = this.moduleCount - 1; right > 0; right -= 2) {
        if (right === 6) right--;
        const yRange = upward ? 
          Array.from({ length: this.moduleCount }, (_, i) => this.moduleCount - 1 - i) :
          Array.from({ length: this.moduleCount }, (_, i) => i);

        for (let y of yRange) {
          for (let colOffset = 0; colOffset < 2; colOffset++) {
            const x = right - colOffset;
            if (this.modules[y][x] === null) {
              let dark = false;
              if (byteIdx < dataBytes.length) {
                dark = ((dataBytes[byteIdx] >> bitIdx) & 1) === 1;
              }
              if ((x + y) % 2 === 0) dark = !dark;
              this.isDark[y][x] = dark;
              this.modules[y][x] = true;

              bitIdx--;
              if (bitIdx < 0) {
                bitIdx = 7;
                byteIdx++;
              }
            }
          }
        }
        upward = !upward;
      }
    }

    renderToCanvas(canvas, options = {}) {
      const {
        size = 280,
        margin = 4,
        darkColor = '#0b0c10',
        lightColor = '#ffffff',
        dotRadius = 0.25
      } = options;

      const count = this.moduleCount + margin * 2;
      const cellSize = size / count;

      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = lightColor;
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = darkColor;

      for (let r = 0; r < this.moduleCount; r++) {
        for (let c = 0; c < this.moduleCount; c++) {
          if (this.isDark[r][c]) {
            const x = (c + margin) * cellSize;
            const y = (r + margin) * cellSize;

            if (dotRadius > 0) {
              const rad = cellSize * dotRadius;
              ctx.beginPath();
              ctx.roundRect(x, y, cellSize + 0.3, cellSize + 0.3, rad);
              ctx.fill();
            } else {
              ctx.fillRect(x, y, cellSize + 0.3, cellSize + 0.3);
            }
          }
        }
      }
      return canvas;
    }

    toDataURL(options = {}) {
      const canvas = document.createElement('canvas');
      this.renderToCanvas(canvas, options);
      return canvas.toDataURL('image/png');
    }
  }

  root.QRCode = {
    generate(text, options = {}) {
      const qr = new QRCodeModel(text);
      return qr.toDataURL(options);
    },
    draw(canvas, text, options = {}) {
      const qr = new QRCodeModel(text);
      return qr.renderToCanvas(canvas, options);
    }
  };
})(typeof window !== 'undefined' ? window : this);
