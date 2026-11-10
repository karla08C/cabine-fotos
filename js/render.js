/**
 * Motor de Renderização de Tiras e Efeitos da Cabine de Fotos
 * Filtros de ANIME (Cel-Shading, Ghibli, Shinkai, Mangá P&B e Kawaii)
 * Rodapé com Logos: Kina Tech e REC'n'Play 2026
 */
class StripRenderer {
  constructor() {
    this.logos = {
      kina: null,
      recnplay: null
    };
    this.loadLogos();
  }

  async loadLogos() {
    const config = window.CABINE_CONFIG || {};
    const lKina = (config.logos && config.logos.kina) || 'assets/logo-kina-tech.png';
    const lRec = (config.logos && config.logos.recnplay) || 'assets/logo-recnplay-2026.png';

    const loadImage = (src) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

    const [lk, lr] = await Promise.all([
      loadImage(lKina),
      loadImage(lRec)
    ]);

    this.logos.kina = lk;
    this.logos.recnplay = lr;
  }

  getFilterCSS(filterName) {
    switch (filterName) {
      // --- Filtros de Anime ---
      case 'anime-cel':
        return 'contrast(1.45) saturate(2.1) brightness(1.04)';
      case 'anime-ghibli':
        return 'contrast(0.98) saturate(1.45) brightness(1.12) sepia(0.18)';
      case 'anime-shinkai':
        return 'contrast(1.35) saturate(2.2) hue-rotate(-8deg) brightness(1.06)';
      case 'anime-manga':
        return 'grayscale(1) contrast(2.3) brightness(1.15)';
      case 'anime-kawaii':
        return 'contrast(1.08) saturate(1.5) brightness(1.14) hue-rotate(6deg)';

      // --- Filtros Ópticos ---
      case 'reading-stone':
        return 'contrast(1.12) saturate(1.15) sepia(0.2) brightness(1.03)';
      case 'noir':
        return 'grayscale(1) contrast(1.4) brightness(0.95)';
      case 'prism35':
        return 'sepia(0.35) contrast(1.08) saturate(1.25) hue-rotate(-10deg)';
      case 'cyber':
        return 'contrast(1.25) saturate(1.6) hue-rotate(185deg)';
      case 'emerald':
        return 'contrast(1.1) saturate(0.9) hue-rotate(55deg) brightness(0.98)';
      case 'sepia':
        return 'sepia(0.85) contrast(1.1) brightness(0.92)';
      case 'none':
      default:
        return 'none';
    }
  }

  applyAdvancedEffects(ctx, x, y, width, height, filterName) {
    if (filterName === 'none') return;

    if (filterName.startsWith('anime-')) {
      this.applyAnimeShader(ctx, x, y, width, height, filterName);
      return;
    }

    const vignette = ctx.createRadialGradient(
      x + width / 2, y + height / 2, Math.min(width, height) * 0.35,
      x + width / 2, y + height / 2, Math.max(width, height) * 0.75
    );

    if (filterName === 'reading-stone') {
      vignette.addColorStop(0, 'rgba(255, 240, 210, 0.05)');
      vignette.addColorStop(0.8, 'rgba(30, 20, 10, 0.22)');
      vignette.addColorStop(1, 'rgba(10, 5, 0, 0.45)');
      ctx.fillStyle = vignette;
      ctx.fillRect(x, y, width, height);

      const flare = ctx.createLinearGradient(x, y, x + width, y + height);
      flare.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      flare.addColorStop(0.3, 'rgba(255, 220, 180, 0.02)');
      flare.addColorStop(1, 'transparent');
      ctx.fillStyle = flare;
      ctx.fillRect(x, y, width, height);
    } else if (filterName === 'noir') {
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(x, y, width, height);
    } else if (filterName === 'cyber') {
      vignette.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
      vignette.addColorStop(1, 'rgba(255, 0, 128, 0.25)');
      ctx.fillStyle = vignette;
      ctx.fillRect(x, y, width, height);
    }
  }

  applyAnimeShader(ctx, x, y, width, height, animeType) {
    const imgData = ctx.getImageData(x, y, width, height);
    const d = imgData.data;
    const w = width;
    const h = height;

    if (animeType === 'anime-cel') {
      const levels = 5;
      const step = 255 / (levels - 1);
      const lum = new Float32Array(w * h);

      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        let r = d[i], g = d[i + 1], b = d[i + 2];
        r = Math.round(Math.round(r / step) * step);
        g = Math.round(Math.round(g / step) * step);
        b = Math.round(Math.round(b / step) * step);
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        lum[p] = (0.299 * r + 0.587 * g + 0.114 * b);
      }

      for (let py = 1; py < h - 1; py += 2) {
        for (let px = 1; px < w - 1; px += 2) {
          const idx = py * w + px;
          const gx = (-lum[idx - w - 1] + lum[idx - w + 1]) +
                     (-2 * lum[idx - 1] + 2 * lum[idx + 1]) +
                     (-lum[idx + w - 1] + lum[idx + w + 1]);
          const gy = (-lum[idx - w - 1] - 2 * lum[idx - w] - lum[idx - w + 1]) +
                     (lum[idx + w - 1] + 2 * lum[idx + w] + lum[idx + w + 1]);
          const mag = Math.abs(gx) + Math.abs(gy);

          if (mag > 165) {
            const pIdx = (py * w + px) * 4;
            d[pIdx] = Math.max(0, d[pIdx] - 120);
            d[pIdx + 1] = Math.max(0, d[pIdx + 1] - 120);
            d[pIdx + 2] = Math.max(0, d[pIdx + 2] - 120);
          }
        }
      }
      ctx.putImageData(imgData, x, y);

    } else if (animeType === 'anime-manga') {
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const i = (py * w + px) * 4;
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const pattern = ((px + py) % 4 === 0) ? 70 : ((px - py) % 4 === 0 ? 140 : 210);
          const finalVal = gray > pattern ? 255 : (gray > 80 ? 30 : 0);
          d[i] = finalVal;
          d[i + 1] = finalVal;
          d[i + 2] = finalVal;
        }
      }
      ctx.putImageData(imgData, x, y);

    } else if (animeType === 'anime-ghibli') {
      ctx.putImageData(imgData, x, y);
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      const ghibliGrad = ctx.createLinearGradient(x, y, x, y + height);
      ghibliGrad.addColorStop(0, 'rgba(255, 230, 180, 0.4)');
      ghibliGrad.addColorStop(0.5, 'rgba(180, 240, 200, 0.2)');
      ghibliGrad.addColorStop(1, 'rgba(255, 200, 160, 0.35)');
      ctx.fillStyle = ghibliGrad;
      ctx.fillRect(x, y, width, height);
      ctx.restore();

    } else if (animeType === 'anime-shinkai') {
      ctx.putImageData(imgData, x, y);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const sunbeam = ctx.createLinearGradient(x, y, x + width * 0.7, y + height * 0.7);
      sunbeam.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      sunbeam.addColorStop(0.4, 'rgba(120, 200, 255, 0.15)');
      sunbeam.addColorStop(1, 'transparent');
      ctx.fillStyle = sunbeam;
      ctx.fillRect(x, y, width, height);
      ctx.restore();

    } else if (animeType === 'anime-kawaii') {
      ctx.putImageData(imgData, x, y);
      ctx.save();
      const blush = ctx.createRadialGradient(
        x + width * 0.5, y + height * 0.55, 20,
        x + width * 0.5, y + height * 0.55, width * 0.45
      );
      blush.addColorStop(0, 'rgba(255, 150, 180, 0.18)');
      blush.addColorStop(1, 'transparent');
      ctx.fillStyle = blush;
      ctx.fillRect(x, y, width, height);

      ctx.fillStyle = '#ffffff';
      this.drawSparkle(ctx, x + width * 0.85, y + height * 0.15, 14);
      this.drawSparkle(ctx, x + width * 0.15, y + height * 0.22, 10);
      this.drawSparkle(ctx, x + width * 0.88, y + height * 0.82, 12);
      ctx.restore();
    }
  }

  drawSparkle(ctx, cx, cy, size) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx, cy, cx + size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + size);
    ctx.quadraticCurveTo(cx, cy, cx - size, cy);
    ctx.quadraticCurveTo(cx, cy, cx - size);
    ctx.fill();
    ctx.restore();
  }

  async render({
    photos,
    layout = 'strip3',
    filter = 'reading-stone',
    theme = 'obsidian',
    caption = '',
    customDate = ''
  }) {
    if (!photos || photos.length === 0) {
      throw new Error('Nenhuma foto fornecida para renderização.');
    }

    const config = window.CABINE_CONFIG || {};

    const themeStyles = {
      obsidian: {
        bg: '#0a0c10',
        cardBg: '#12161f',
        border: 'rgba(255, 255, 255, 0.1)',
        text: '#f2f5fa',
        subtext: '#8a94a6',
        accent: '#ff2a51',
        footerBg: '#06070a',
        badgeBg: 'rgba(255, 255, 255, 0.06)'
      },
      alabaster: {
        bg: '#f8f7f4',
        cardBg: '#ffffff',
        border: 'rgba(0, 0, 0, 0.08)',
        text: '#141416',
        subtext: '#686a73',
        accent: '#b21e28',
        footerBg: '#eceae5',
        badgeBg: 'rgba(0, 0, 0, 0.05)'
      },
      cyberneon: {
        bg: '#050508',
        cardBg: '#0d0d14',
        border: 'rgba(0, 242, 254, 0.35)',
        text: '#ffffff',
        subtext: '#00f2fe',
        accent: '#fe0979',
        footerBg: '#020204',
        badgeBg: 'rgba(254, 9, 121, 0.15)'
      },
      rosequartz: {
        bg: '#1b1417',
        cardBg: '#261c21',
        border: 'rgba(244, 162, 185, 0.2)',
        text: '#fae8ed',
        subtext: '#d8a4b8',
        accent: '#e07a5f',
        footerBg: '#130d10',
        badgeBg: 'rgba(244, 162, 185, 0.12)'
      },
      vintage: {
        bg: '#2b231c',
        cardBg: '#382e25',
        border: 'rgba(224, 192, 151, 0.25)',
        text: '#fdf6e9',
        subtext: '#d3b793',
        accent: '#d46a38',
        footerBg: '#1e1813',
        badgeBg: 'rgba(224, 192, 151, 0.15)'
      }
    };

    const curTheme = themeStyles[theme] || themeStyles.obsidian;

    let W = 800;
    let H = 2400;
    const pad = 50;

    let photoW = W - pad * 2;
    let photoH = Math.round(photoW * 0.75);
    let gap = 30;
    let count = 3;

    if (layout === 'strip4') {
      count = Math.min(photos.length, 4);
      photoH = Math.round(photoW * 0.72);
      H = pad + count * (photoH + gap) + 320;
    } else if (layout === 'polaroid') {
      count = 1;
      photoH = Math.round(photoW * 0.85);
      H = pad + photoH + 420;
    } else if (layout === 'grid2x2') {
      count = Math.min(photos.length, 4);
      photoW = (W - pad * 2 - gap) / 2;
      photoH = photoW;
      H = pad + (photoH * 2 + gap) + 360;
    } else {
      count = Math.min(photos.length, 3);
      H = pad + count * (photoH + gap) + 340;
    }

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = curTheme.bg;
    ctx.fillRect(0, 0, W, H);

    this.drawSubtleNoise(ctx, W, H);

    ctx.strokeStyle = curTheme.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, W - 24, H - 24);

    if (document.fonts && document.fonts.load) {
      try {
        await Promise.all([
          document.fonts.load('600 36px "Inter"'),
          document.fonts.load('600 48px "Cinzel"'),
          document.fonts.load('400 24px "JetBrains Mono"')
        ]);
      } catch (e) {}
    }

    const filterCSS = this.getFilterCSS(filter);

    for (let i = 0; i < count; i++) {
      let px, py, pw, ph;

      if (layout === 'grid2x2') {
        const col = i % 2;
        const row = Math.floor(i / 2);
        px = pad + col * (photoW + gap);
        py = pad + row * (photoH + gap);
        pw = photoW;
        ph = photoH;
      } else {
        px = pad;
        py = pad + i * (photoH + gap);
        pw = photoW;
        ph = photoH;
      }

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 8);
      ctx.clip();

      const photo = photos[i] || photos[0];
      ctx.filter = filterCSS;
      ctx.drawImage(photo, 0, 0, photo.width, photo.height, px, py, pw, ph);

      ctx.filter = 'none';
      this.applyAdvancedEffects(ctx, px, py, pw, ph, filter);

      ctx.restore();

      ctx.strokeStyle = curTheme.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 8);
      ctx.stroke();

      const filterLabel = filter.startsWith('anime-') ? 'ANIME EDITION' : 'POINT OF VIEW';
      const badgeText = `0${i + 1} / ${filterLabel}`;
      ctx.fillStyle = curTheme.badgeBg;
      ctx.fillRect(px + 12, py + ph - 34, 195, 24);
      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = curTheme.subtext;
      ctx.fillText(badgeText, px + 22, py + ph - 18);
    }

    const footerStartY = (layout === 'grid2x2') ?
      pad + (photoH * 2 + gap) + 40 :
      pad + count * (photoH + gap) + 15;

    const displayCaption = caption || config.defaultCaption || 'Meu momento no evento';
    ctx.textAlign = 'center';
    ctx.fillStyle = curTheme.text;
    ctx.font = '600 38px "Cinzel", "Times New Roman", serif';
    ctx.fillText(displayCaption, W / 2, footerStartY + 50, W - 100);

    const dateStr = customDate || new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();

    const metaStr = `${config.eventName || "REC'n'Play 2026"} • ${dateStr} • POINT OF VIEW`;
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.fillStyle = curTheme.subtext;
    ctx.letterSpacing = '2px';
    ctx.fillText(metaStr, W / 2, footerStartY + 95);

    // Faixa Inferior de Logos (Kina Tech + REC'n'Play 2026 lado a lado)
    const bandHeight = 150;
    const bandY = H - bandHeight;

    ctx.fillStyle = curTheme.footerBg;
    ctx.fillRect(0, bandY, W, bandHeight);

    ctx.strokeStyle = curTheme.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, bandY);
    ctx.lineTo(W - 30, bandY);
    ctx.stroke();

    this.drawLogosSideBySide(ctx, W, bandY, bandHeight, curTheme);

    return canvas;
  }

  drawLogosSideBySide(ctx, W, bandY, bandHeight, curTheme) {
    const lk = this.logos.kina;
    const lr = this.logos.recnplay;

    if (lk && lr) {
      const calcFit = (img, maxW, maxH) => {
        const ratio = Math.min(maxW / img.width, maxH / img.height);
        return [img.width * ratio, img.height * ratio];
      };

      const dimKina = calcFit(lk, 240, 75);
      const dimRec = calcFit(lr, 260, 55);
      const sepGap = 45;

      const totalWidth = dimKina[0] + sepGap + dimRec[0];
      const startX = (W - totalWidth) / 2;
      const centerY = bandY + bandHeight / 2;

      // Logo Kina Tech
      ctx.drawImage(lk, startX, centerY - dimKina[1] / 2, dimKina[0], dimKina[1]);

      // Divisor vertical
      ctx.strokeStyle = curTheme.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX + dimKina[0] + sepGap / 2, centerY - 25);
      ctx.lineTo(startX + dimKina[0] + sepGap / 2, centerY + 25);
      ctx.stroke();

      // Logo REC'n'Play 2026
      ctx.drawImage(lr, startX + dimKina[0] + sepGap, centerY - dimRec[1] / 2, dimRec[0], dimRec[1]);
    } else if (lk || lr) {
      const img = lk || lr;
      const maxW = 340, maxH = 65;
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const dw = img.width * ratio, dh = img.height * ratio;
      ctx.drawImage(img, (W - dw) / 2, bandY + (bandHeight - dh) / 2, dw, dh);
    } else {
      ctx.textAlign = 'center';
      ctx.font = '700 24px "Inter", sans-serif';
      ctx.fillStyle = curTheme.text;
      ctx.fillText('KINA TECH  ×  REC\'n\'PLAY 2026', W / 2, bandY + bandHeight / 2 + 8);
    }
  }

  drawSubtleNoise(ctx, width, height) {
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 120;
    noiseCanvas.height = 120;
    const nctx = noiseCanvas.getContext('2d');
    const imgData = nctx.createImageData(120, 120);
    const buf = imgData.data;

    for (let i = 0; i < buf.length; i += 4) {
      const val = Math.random() * 255;
      buf[i] = val;
      buf[i + 1] = val;
      buf[i + 2] = val;
      buf[i + 3] = 10;
    }
    nctx.putImageData(imgData, 0, 0);

    ctx.save();
    ctx.fillStyle = ctx.createPattern(noiseCanvas, 'repeat');
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

window.StripRenderer = StripRenderer;
