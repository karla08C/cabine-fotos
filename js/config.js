/**
 * Configurações da Cabine de Fotos - Edição Especial "Point of View / Reading Stones"
 * Logos: Kina Tech e REC'n'Play 2026
 */
window.CABINE_CONFIG = {
  eventName: "REC'n'Play 2026",
  brandName: "Kina Tech",
  subTitle: "Cabine Óptica • Point of View",
  defaultCaption: "Meu momento no evento",
  
  // Logos exibidas no rodapé da tira
  logos: {
    enabled: true,
    kina: "assets/logo-kina-tech.png",
    recnplay: "assets/logo-recnplay-2026.png"
  },

  // Efeitos Sonoros com Web Audio API
  soundEnabled: true,

  // Contagem regressiva padrão (segundos)
  countdownDuration: 3,

  // Resolução ideal da câmera
  camera: {
    idealWidth: 1920,
    idealHeight: 1440,
    facingMode: "user"
  },

  // Provedor de Upload para geração de URL pública (usada pelo QR Code e Email)
  upload: {
    provider: 'imgbb',
    imgbbApiKey: '',
    customEndpoint: ''
  }
};

/**
 * Função de upload hook extensível para gerar URL pública para o QR Code e Email.
 */
window.KINA_UPLOAD = async function (blob) {
  const config = window.CABINE_CONFIG;
  
  if (config.upload.provider === 'imgbb' && config.upload.imgbbApiKey) {
    const formData = new FormData();
    formData.append('image', blob, 'tira-point-of-view.png');
    formData.append('key', config.upload.imgbbApiKey);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Falha no upload ImgBB (${response.status})`);
    }

    const data = await response.json();
    if (data && data.data && data.data.url) {
      return data.data.url;
    }
    throw new Error('Resposta inválida do serviço de upload.');
  }

  if (config.upload.customEndpoint) {
    const form = new FormData();
    form.append('file', blob, 'tira-point-of-view.png');

    const res = await fetch(config.upload.customEndpoint, {
      method: 'POST',
      body: form
    });

    if (!res.ok) {
      throw new Error(`Falha no envio para o servidor (${res.status})`);
    }

    const data = await res.json();
    return data.url || data.link || data.secure_url;
  }

  try {
    const form = new FormData();
    form.append('file', blob, 'tira-fotos.png');
    
    const tmpRes = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: form
    });
    
    if (tmpRes.ok) {
      const json = await tmpRes.json();
      if (json && json.data && json.data.url) {
        return json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      }
    }
  } catch (err) {
    console.warn('Upload público indisponível, gerando link com suporte local:', err);
  }

  return URL.createObjectURL(blob);
};
