/**
 * Módulo de Compartilhamento, QR Code, Download e Envio por Email
 */
class ShareManager {
  constructor() {
    this.currentBlob = null;
    this.currentCanvas = null;
    this.publicUrl = null;
    this.isUploading = false;
  }

  setResult(canvas, blob) {
    this.currentCanvas = canvas;
    this.currentBlob = blob;
    this.publicUrl = null;
  }

  download(filename = null) {
    if (!this.currentBlob && !this.currentCanvas) {
      throw new Error('Nenhuma foto pronta para download.');
    }

    const name = filename || `cabine-fotos-anime-${Date.now()}.png`;

    if (this.currentBlob) {
      const url = URL.createObjectURL(this.currentBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } else {
      const dataUrl = this.currentCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  async shareNative() {
    if (!navigator.share || !this.currentBlob) {
      return false;
    }

    try {
      const file = new File([this.currentBlob], 'minha-tira-anime.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Minha foto da Cabine Point of View",
          text: "Confira minha foto com filtro de anime tirada na cabine!",
          files: [file]
        });
        return true;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Erro ao compartilhar via sistema nativo:', err);
      }
    }
    return false;
  }

  async getPublicUrl(onProgress = null) {
    if (this.publicUrl) return this.publicUrl;

    if (!this.currentBlob) {
      throw new Error('A imagem ainda não foi gerada.');
    }

    this.isUploading = true;
    if (onProgress) onProgress('Preparando imagem...');

    try {
      if (typeof window.KINA_UPLOAD === 'function') {
        if (onProgress) onProgress('Enviando para o servidor seguro...');
        this.publicUrl = await window.KINA_UPLOAD(this.currentBlob);
        return this.publicUrl;
      }
      throw new Error('Função de upload não configurada.');
    } finally {
      this.isUploading = false;
    }
  }

  async generateQRCode(qrContainerElement, onStatus = null) {
    if (!qrContainerElement) return;

    try {
      if (onStatus) onStatus('Conectando ao servidor para gerar QR code...');
      const url = await this.getPublicUrl(onStatus);

      const qrDataUrl = window.QRCode.generate(url, {
        size: 260,
        margin: 3,
        darkColor: '#0a0c10',
        lightColor: '#ffffff',
        dotRadius: 0.3
      });

      qrContainerElement.innerHTML = `
        <div class="qr-preview-wrapper">
          <img src="${qrDataUrl}" alt="QR Code para baixar suas fotos" class="qr-image" />
          <div class="qr-glow"></div>
        </div>
      `;

      if (onStatus) onStatus('');
      return url;
    } catch (err) {
      console.error('Falha ao gerar QR code:', err);
      if (onStatus) onStatus(`Erro ao gerar QR code: ${err.message || 'Verifique sua conexão.'}`);
      throw err;
    }
  }

  async prepareEmail(emailAddress, onStatus = null) {
    if (!emailAddress || !emailAddress.includes('@')) {
      throw new Error('Por favor, informe um endereço de email válido.');
    }

    if (onStatus) onStatus('Gerando link para envio por email...');
    const url = await this.getPublicUrl(onStatus);

    const subject = encodeURIComponent("Suas fotos da Cabine Point of View | Edição Anime");
    const body = encodeURIComponent(
      `Olá!\n\nAqui está o link para você visualizar e baixar sua tira de fotos com efeito anime em alta qualidade:\n\n${url}\n\nObrigado por registrar esse momento conosco!\nCabine Óptica • Point of View`
    );

    const mailtoUrl = `mailto:${encodeURIComponent(emailAddress)}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;

    if (onStatus) onStatus('Seu aplicativo de email foi aberto com o link anexado!');
    return { url, mailtoUrl };
  }

  async copyLinkToClipboard(onStatus = null) {
    try {
      const url = await this.getPublicUrl(onStatus);
      await navigator.clipboard.writeText(url);
      if (onStatus) onStatus('Link copiado para a área de transferência!');
      return true;
    } catch (err) {
      try {
        const input = document.createElement('input');
        input.value = this.publicUrl || '';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        if (onStatus) onStatus('Link copiado!');
        return true;
      } catch (copyErr) {
        if (onStatus) onStatus('Não foi possível copiar automaticamente.');
        return false;
      }
    }
  }
}

window.ShareManager = ShareManager;
