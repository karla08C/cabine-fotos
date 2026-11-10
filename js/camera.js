/**
 * Módulo de Câmera da Cabine de Fotos
 */
class CameraManager {
  constructor(videoElement, flashElement) {
    this.video = videoElement;
    this.flash = flashElement;
    this.stream = null;
    this.facingMode = 'user';
    this.isMirrored = true;
    this.hasMultipleCameras = false;
  }

  async checkDevices() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      this.hasMultipleCameras = videoDevices.length > 1;
    } catch (e) {
      this.hasMultipleCameras = false;
    }
  }

  async start(facingMode = null) {
    if (facingMode) {
      this.facingMode = facingMode;
    }
    this.isMirrored = (this.facingMode === 'user');
    this.updateMirroring();

    this.stop();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Navegador não suporta acesso à câmera.');
    }

    const config = window.CABINE_CONFIG || {};
    const idealW = (config.camera && config.camera.idealWidth) || 1920;
    const idealH = (config.camera && config.camera.idealHeight) || 1440;

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: this.facingMode },
        width: { ideal: idealW },
        height: { ideal: idealH }
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();
      await this.checkDevices();
      return true;
    } catch (err) {
      console.error('Erro ao iniciar câmera:', err);
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        this.video.srcObject = this.stream;
        await this.video.play();
        return true;
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  switchCamera() {
    this.facingMode = (this.facingMode === 'user') ? 'environment' : 'user';
    return this.start(this.facingMode);
  }

  toggleMirror() {
    this.isMirrored = !this.isMirrored;
    this.updateMirroring();
    return this.isMirrored;
  }

  updateMirroring() {
    if (!this.video) return;
    this.video.style.transform = this.isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
  }

  triggerFlash() {
    if (!this.flash) return;
    this.flash.classList.remove('active');
    void this.flash.offsetWidth;
    this.flash.classList.add('active');
  }

  captureFrame(targetWidth = 1200, targetHeight = 900) {
    if (!this.video || this.video.readyState < 2) {
      throw new Error('Câmera não está pronta para captura.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    const vw = this.video.videoWidth || targetWidth;
    const vh = this.video.videoHeight || targetHeight;

    const scale = Math.max(targetWidth / vw, targetHeight / vh);
    const sw = targetWidth / scale;
    const sh = targetHeight / scale;
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;

    ctx.save();
    if (this.isMirrored) {
      ctx.translate(targetWidth, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(this.video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
    ctx.restore();

    this.triggerFlash();
    if (window.soundEngine) {
      window.soundEngine.playShutter();
      window.soundEngine.playFlash();
    }

    return canvas;
  }
}

window.CameraManager = CameraManager;
