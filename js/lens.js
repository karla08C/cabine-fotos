/**
 * Efeito Óptico "Reading Stone" (Point of View Loupe)
 */
class ReadingStoneLens {
  constructor(containerId, targetImageId) {
    this.container = document.getElementById(containerId);
    this.targetImg = document.getElementById(targetImageId);
    this.lens = null;
    this.canvas = null;
    this.ctx = null;
    this.sourceCanvas = null;
    this.active = false;
    this.zoom = 2.4;
    this.lensRadius = 75;
    this.enabled = true;
    
    this.init();
  }

  init() {
    if (!this.container || !this.targetImg) return;

    this.lens = document.createElement('div');
    this.lens.className = 'reading-stone-loupe';
    this.lens.style.display = 'none';

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.lensRadius * 2;
    this.canvas.height = this.lensRadius * 2;
    this.ctx = this.canvas.getContext('2d');
    this.lens.appendChild(this.canvas);

    const glare = document.createElement('div');
    glare.className = 'lens-glare-effect';
    this.lens.appendChild(glare);

    const badge = document.createElement('div');
    badge.className = 'lens-badge';
    badge.textContent = '2.4× LENS';
    this.lens.appendChild(badge);

    this.container.appendChild(this.lens);
    this.bindEvents();
  }

  setSource(sourceCanvas) {
    this.sourceCanvas = sourceCanvas;
  }

  bindEvents() {
    const handleMove = (e) => {
      if (!this.enabled || !this.sourceCanvas || !this.targetImg.src) return;

      const rect = this.targetImg.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        this.hide();
        return;
      }

      this.show();

      const nx = (clientX - rect.left) / rect.width;
      const ny = (clientY - rect.top) / rect.height;

      const containerRect = this.container.getBoundingClientRect();
      const lensX = clientX - containerRect.left;
      const lensY = clientY - containerRect.top;

      this.lens.style.left = `${lensX}px`;
      this.lens.style.top = `${lensY}px`;

      this.renderMagnification(nx, ny);
    };

    const handleLeave = () => {
      this.hide();
    };

    this.targetImg.addEventListener('mousemove', handleMove);
    this.targetImg.addEventListener('touchmove', handleMove, { passive: true });
    this.targetImg.addEventListener('mouseleave', handleLeave);
    this.targetImg.addEventListener('touchend', handleLeave);
  }

  renderMagnification(nx, ny) {
    if (!this.sourceCanvas || !this.ctx) return;

    const sw = this.sourceCanvas.width;
    const sh = this.sourceCanvas.height;

    const sourceX = nx * sw;
    const sourceY = ny * sh;

    const r = this.lensRadius;
    const d = r * 2;
    const cropW = d / this.zoom;
    const cropH = d / this.zoom;

    this.ctx.clearRect(0, 0, d, d);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(r, r, r - 2, 0, Math.PI * 2);
    this.ctx.clip();

    this.ctx.globalAlpha = 0.98;
    this.ctx.drawImage(
      this.sourceCanvas,
      sourceX - cropW / 2 - 1.5,
      sourceY - cropH / 2,
      cropW,
      cropH,
      0,
      0,
      d,
      d
    );

    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(
      this.sourceCanvas,
      sourceX - cropW / 2 + 1.5,
      sourceY - cropH / 2,
      cropW,
      cropH,
      0,
      0,
      d,
      d
    );

    const grad = this.ctx.createRadialGradient(r * 0.7, r * 0.7, 5, r, r, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
    grad.addColorStop(1, 'rgba(10, 15, 25, 0.45)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, d, d);

    this.ctx.restore();
  }

  show() {
    if (!this.active) {
      this.lens.style.display = 'block';
      this.active = true;
    }
  }

  hide() {
    if (this.active) {
      this.lens.style.display = 'none';
      this.active = false;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.hide();
    return this.enabled;
  }
}

window.ReadingStoneLens = ReadingStoneLens;
