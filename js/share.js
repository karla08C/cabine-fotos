(function(global){
  var api = global.CabineFotos = global.CabineFotos || {};

  api.share = api.share || {};

  api.share.link = async function(blob){
    if(typeof window.KINA_UPLOAD === 'function'){
      if(!blob) throw new Error('a imagem ainda não está pronta');
      return window.KINA_UPLOAD(blob);
    }

    if(typeof claude === 'undefined' || !claude.use){
      throw new Error('o recurso de envio não está disponível nesta página');
    }

    var a = await claude.use('assets');
    if(!a){
      throw new Error('sem permissão para enviar a foto. Abra a cabine na conta que edita este artefato');
    }

    if(!blob){
      throw new Error('a imagem ainda não está pronta');
    }

    var r = await a.upload(new File([blob], 'tira-kina-tech.png', { type: 'image/png' }));
    var url = r.url;
    if(!/^https?:/i.test(url)){
      url = new URL(url, /^https?:/i.test(location.href) ? location.href : 'https://claude.ai/').href;
    }
    return url;
  };

  api.share.qr = function(url){
    if(typeof qrcode === 'undefined') return null;
    var q = qrcode(0, 'M');
    q.addData(url);
    q.make();
    return q.createDataURL(6, 2);
  };
})(window);
