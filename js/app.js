(function(){
  var $ = function(i){ return document.getElementById(i); };
  var video = $('video'), stream = null, mode = 'cam', busy = false, shots = [], filtro = '', tema = 'light', blob = null;
  var sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var facingMode = 'user';
  var curtain = $('curtain'), isTransitioning = false;

  // --- ANIMAÇÃO DE TÍTULOS (Palavras subindo uma a uma) ---
  function splitTitles(){
    document.querySelectorAll('.split-title').forEach(function(title){
      if (title.dataset.split) return;
      title.dataset.split = 'true';
      var words = title.textContent.trim().split(/\s+/);
      title.innerHTML = words.map(function(word, idx){
        return '<span class="word-wrap"><span class="word-inner" style="transition-delay:' + (idx * 0.08) + 's">' + word + '</span></span>';
      }).join(' ');
    });
  }

  function triggerTitleAnimation(screenEl){
    if (!screenEl) return;
    var inners = screenEl.querySelectorAll('.word-inner');
    inners.forEach(function(el){
      el.style.transform = 'translateY(120%)';
      el.style.opacity = '0';
    });
    void screenEl.offsetWidth;
    inners.forEach(function(el){
      el.style.transform = '';
      el.style.opacity = '';
    });
  }

  // --- NAVEGAÇÃO ENTRE TELAS COM CORTINA VERMELHA ---
  function show(id){
    if (isTransitioning) return;
    var targetScreen = $(id);
    if (!curtain || window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      document.querySelectorAll('.screen').forEach(function(s){ s.classList.toggle('on', s.id === id); });
      window.scrollTo(0,0);
      triggerTitleAnimation(targetScreen);
      return;
    }

    isTransitioning = true;
    curtain.classList.remove('wipe');
    void curtain.offsetWidth;
    curtain.classList.add('wipe');

    // Troca a tela no ápice da cortina (tela 100% coberta)
    setTimeout(function(){
      document.querySelectorAll('.screen').forEach(function(s){ s.classList.toggle('on', s.id === id); });
      window.scrollTo(0,0);
      triggerTitleAnimation(targetScreen);
    }, 320);

    // Conclusão da cortina saindo por cima
    setTimeout(function(){
      isTransitioning = false;
      curtain.classList.remove('wipe');
    }, 720);
  }

  function stop(){
    if (stream){ stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; }
  }
  function resetShare(){
    linkP = null; $('qrbox').hidden = true; $('mailrow').hidden = true; $('smsg').textContent = '';
  }
  function reset(){
    resetShare(); stop(); shots = []; busy = false; thumbs(); $('out').removeAttribute('src'); show('s-inicio');
  }
  function thumbs(){
    var t = $('thumbs'); t.innerHTML = '';
    for (var i = 0; i < 3; i++){
      var d = document.createElement('div');
      if (shots[i]){
        var im = document.createElement('img'); im.src = shots[i].toDataURL('image/jpeg', .85); im.alt = 'Foto ' + (i + 1);
        d.appendChild(im);
      } else {
        d.textContent = i + 1;
      }
      t.appendChild(d);
    }
  }

  function fcss(){
    switch(filtro){
      case 'sepia': return 'sepia(.55) contrast(1.05) saturate(1.1)';
      case 'bw': return 'grayscale(1) contrast(1.1)';
      case 'anime-cel': return 'contrast(1.4) saturate(2.1) brightness(1.05)';
      case 'anime-ghibli': return 'contrast(0.98) saturate(1.4) brightness(1.1) sepia(0.2)';
      case 'anime-shinkai': return 'contrast(1.3) saturate(2.2) hue-rotate(-8deg)';
      case 'anime-manga': return 'grayscale(1) contrast(2.3) brightness(1.15)';
      case 'anime-kawaii': return 'contrast(1.08) saturate(1.5) brightness(1.12) hue-rotate(6deg)';
      default: return 'none';
    }
  }

  function prev(){
    video.style.filter = fcss();
    $('thumbs').style.filter = fcss();
  }

  // --- BOTÕES DA TELA INICIAL ---
  $('comecar').onclick = startCam;
  if ($('btn-gal-small')) $('btn-gal-small').onclick = openGal;
  $('voltar').onclick = function(){ stop(); show('s-inicio'); };
  if ($('modo-voltar')) $('modo-voltar').onclick = function(){ show('s-inicio'); };
  $('fim').onclick = reset;
  $('re-ini').onclick = reset;

  async function startCam(){
    mode = 'cam'; shots = []; thumbs();
    $('view').style.display = 'block'; $('go').textContent = 'Tirar 3 fotos'; $('dica').style.display = 'block';
    show('s-montar'); $('go').disabled = true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw 0;
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
      $('go').disabled = false;
      prev();
    } catch(e) {
      show('s-errcam');
    }
  }

  if ($('modo-cam')) $('modo-cam').onclick = startCam;
  $('re-cam').onclick = startCam;

  if ($('cam-flip')){
    $('cam-flip').onclick = async function(){
      facingMode = facingMode === 'user' ? 'environment' : 'user';
      video.style.transform = facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
      await startCam();
    };
  }

  function openGal(){ $('file').value = ''; $('file').click(); }
  if ($('modo-gal')) $('modo-gal').onclick = openGal;
  $('re-gal').onclick = openGal;

  function fit(src){
    var c = document.createElement('canvas'); c.width = 960; c.height = 720;
    var x = c.getContext('2d'), w = src.videoWidth || src.width, h = src.videoHeight || src.height;
    var s = Math.max(960 / w, 720 / h), sw = 960 / s, sh = 720 / s;
    return {
      c: c, x: x,
      draw: function(mirror){
        if (mirror && facingMode === 'user'){ x.translate(960, 0); x.scale(-1, 1); }
        x.drawImage(src, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, 960, 720);
        return c;
      }
    };
  }

  $('file').onchange = function(){
    var fs = Array.prototype.slice.call($('file').files, 0, 3);
    if (fs.length < 3){ $('aviso').textContent = 'Selecione 3 fotos de uma vez para montar a tira.'; return; }
    $('aviso').textContent = '';
    Promise.all(fs.map(function(f){
      return new Promise(function(res, rej){
        var r = new FileReader();
        r.onload = function(){
          var im = new Image();
          im.onload = function(){ res(fit(im).draw(false)); };
          im.onerror = rej;
          im.src = r.result;
        };
        r.onerror = rej;
        r.readAsDataURL(f);
      });
    }))
    .then(function(cs){
      mode = 'gal'; shots = cs; thumbs(); $('view').style.display = 'none';
      $('go').textContent = 'Montar tira'; $('dica').style.display = 'none'; $('go').disabled = false;
      show('s-montar'); prev();
    }).catch(function(){ show('s-err'); });
  };

  document.querySelectorAll('#chipsF .chip').forEach(function(b){
    b.onclick = function(){
      filtro = b.dataset.f;
      document.querySelectorAll('#chipsF .chip').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      prev();
    };
  });

  document.querySelectorAll('#chipsT .chip').forEach(function(b){
    b.onclick = function(){
      tema = b.dataset.t;
      document.querySelectorAll('#chipsT .chip').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
    };
  });

  async function sequence(){
    if (busy) return;
    busy = true; $('go').disabled = true; shots = []; thumbs();
    for (var i = 0; i < 3; i++){
      for (var n = 3; n > 0; n--){ $('count').textContent = n; await sleep(1000); }
      $('count').textContent = '';
      var f = $('flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
      shots[i] = fit(video).draw(true); thumbs(); prev();
      if (i < 2) await sleep(900);
    }
    busy = false; stop(); build();
  }

  $('go').onclick = function(){ if (mode === 'cam') sequence(); else build(); };

  document.addEventListener('keydown', function(e){
    if (e.code === 'Space' && $('s-montar').classList.contains('on') && mode === 'cam' && stream && !busy && e.target.tagName !== 'INPUT'){
      e.preventDefault(); sequence();
    }
  });

  var LK = 'assets/logo-kina-tech.png', LR = 'assets/logo-recnplay-2026.png';
  function li(u){ return new Promise(function(r){ var i = new Image(); i.onload = function(){ r(i); }; i.onerror = function(){ r(null); }; i.src = u; }); }
  var SUP = 'filter' in CanvasRenderingContext2D.prototype;

  function soft(x, px, py, w, h){
    if (!filtro) return;
    var d = x.getImageData(px, py, w, h), a = d.data;
    for (var i = 0; i < a.length; i += 4){
      var r = a[i], g = a[i+1], b = a[i+2], nr, ng, nb;
      if (filtro === 'bw'){
        var l = (.299 * r + .587 * g + .114 * b - 128) * 1.1 + 128;
        nr = ng = nb = l;
      } else if (filtro === 'sepia'){
        nr = r + ((.393 * r + .769 * g + .189 * b) - r) * .55;
        ng = g + ((.349 * r + .686 * g + .168 * b) - g) * .55;
        nb = b + ((.272 * r + .534 * g + .131 * b) - b) * .55;
      }
      a[i] = nr; a[i+1] = ng; a[i+2] = nb;
    }
    x.putImageData(d, px, py);
  }

  function applyAnime(x, px, py, w, h, type){
    var d = x.getImageData(px, py, w, h), a = d.data;
    if (type === 'anime-cel'){
      var st = 255 / 4, lum = new Float32Array(w * h);
      for (var i = 0, p = 0; i < a.length; i += 4, p++){
        a[i] = Math.round(Math.round(a[i] / st) * st);
        a[i+1] = Math.round(Math.round(a[i+1] / st) * st);
        a[i+2] = Math.round(Math.round(a[i+2] / st) * st);
        lum[p] = 0.299 * a[i] + 0.587 * a[i+1] + 0.114 * a[i+2];
      }
      for (var y = 1; y < h - 1; y += 2){
        for (var cx = 1; cx < w - 1; cx += 2){
          var idx = y * w + cx;
          var gx = (-lum[idx - w - 1] + lum[idx - w + 1]) + (-2 * lum[idx - 1] + 2 * lum[idx + 1]) + (-lum[idx + w - 1] + lum[idx + w + 1]);
          var gy = (-lum[idx - w - 1] - 2 * lum[idx - w] - lum[idx - w + 1]) + (lum[idx + w - 1] + 2 * lum[idx + w] + lum[idx + w + 1]);
          if (Math.abs(gx) + Math.abs(gy) > 165){
            var pi = (y * w + cx) * 4;
            a[pi] = Math.max(0, a[pi] - 120); a[pi+1] = Math.max(0, a[pi+1] - 120); a[pi+2] = Math.max(0, a[pi+2] - 120);
          }
        }
      }
      x.putImageData(d, px, py);
    } else if (type === 'anime-manga'){
      for (var y = 0; y < h; y++){
        for (var cx = 0; cx < w; cx++){
          var i = (y * w + cx) * 4, g = 0.299 * a[i] + 0.587 * a[i+1] + 0.114 * a[i+2];
          var pat = ((cx + y) % 4 === 0) ? 70 : (((cx - y) % 4 === 0) ? 140 : 210);
          var v = g > pat ? 255 : (g > 80 ? 30 : 0);
          a[i] = a[i+1] = a[i+2] = v;
        }
      }
      x.putImageData(d, px, py);
    } else if (type === 'anime-ghibli'){
      x.putImageData(d, px, py); x.save(); x.globalCompositeOperation = 'soft-light';
      var gr = x.createLinearGradient(px, py, px, py + h);
      gr.addColorStop(0, 'rgba(255, 230, 180, 0.45)');
      gr.addColorStop(0.5, 'rgba(180, 240, 200, 0.2)');
      gr.addColorStop(1, 'rgba(255, 200, 160, 0.35)');
      x.fillStyle = gr; x.fillRect(px, py, w, h); x.restore();
    } else if (type === 'anime-shinkai'){
      x.putImageData(d, px, py); x.save(); x.globalCompositeOperation = 'screen';
      var gr = x.createLinearGradient(px, py, px + w * 0.7, py + h * 0.7);
      gr.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      gr.addColorStop(0.5, 'rgba(100, 200, 255, 0.15)');
      gr.addColorStop(1, 'transparent');
      x.fillStyle = gr; x.fillRect(px, py, w, h); x.restore();
    } else if (type === 'anime-kawaii'){
      x.putImageData(d, px, py); x.save();
      var b = x.createRadialGradient(px + w * 0.5, py + h * 0.55, 10, px + w * 0.5, py + h * 0.55, w * 0.4);
      b.addColorStop(0, 'rgba(255, 150, 180, 0.25)'); b.addColorStop(1, 'transparent');
      x.fillStyle = b; x.fillRect(px, py, w, h); x.restore();
    }
  }

  async function build(){
    resetShare(); show('s-proc'); await sleep(1200);
    try {
      var W = 720, P = 48, PW = 624, PH = 468, G = 30, BAND = 170, CAP = 120 + BAND, H = P + 3 * PH + 2 * G + 34 + CAP;
      var dark = tema === 'dark', cyber = tema === 'cyber', c = document.createElement('canvas');
      c.width = W; c.height = H; var x = c.getContext('2d');
      x.fillStyle = cyber ? '#05050a' : (dark ? '#141112' : '#fbfaf7');
      x.fillRect(0, 0, W, H);
      if (cyber){ x.strokeStyle = 'rgba(0, 242, 254, 0.4)'; x.lineWidth = 2; x.strokeRect(10, 10, W - 20, H - 20); }
      if (document.fonts && document.fonts.load){
        try {
          await document.fonts.load('600 50px "Cormorant Garamond"');
          await document.fonts.load('700 24px "Space Grotesk"');
        } catch(e){}
      }
      var lk = await li(LK), lr = await li(LR);
      for (var i = 0; i < 3; i++){
        var y = P + i * (PH + G); x.save(); x.beginPath(); x.rect(P, y, PW, PH); x.clip();
        x.filter = fcss(); x.drawImage(shots[i], 0, 0, 960, 720, P, y, PW, PH); x.filter = 'none';
        if (filtro && filtro.startsWith('anime-')){ applyAnime(x, P, y, PW, PH, filtro); }
        x.restore();
        if (!SUP && (filtro === 'sepia' || filtro === 'bw')) soft(x, P, y, PW, PH);
      }
      var b = P + 3 * PH + 2 * G + 34; x.textAlign = 'center';
      x.fillStyle = (dark || cyber) ? '#f2f0f0' : '#222';
      x.font = '600 50px "Cormorant Garamond", Georgia, serif';
      x.fillText($('cap').value, W / 2, b + 80, PW);
      x.fillStyle = '#0f0d0e'; x.fillRect(0, H - BAND, W, BAND);
      if (lk && lr){
        var fb = function(im, bw, bh){ var q = Math.min(bw / im.width, bh / im.height); return [im.width * q, im.height * q]; };
        var fa = fb(lk, 250, 100), fc = fb(lr, 300, 56), gp = 40, sx = (W - (fa[0] + gp + fc[0])) / 2, cy = H - BAND / 2;
        x.drawImage(lk, sx, cy - fa[1] / 2, fa[0], fa[1]);
        x.fillStyle = '#3a3536'; x.fillRect(sx + fa[0] + gp / 2 - 1, cy - 32, 2, 64);
        x.drawImage(lr, sx + fa[0] + gp, cy - fc[1] / 2, fc[0], fc[1]);
      }
      $('out').src = c.toDataURL('image/png');
      c.toBlob(function(bl){
        blob = bl;
        $('share').hidden = !(navigator.canShare && bl && navigator.canShare({ files: [new File([bl], 'tira-kina-tech.png', { type: 'image/png' })] }));
      });
      show('s-pronto');
    } catch(e){
      show('s-err');
    }
  }

  // Download direto
  $('downbtn').onclick = function(){
    if (!blob) return;
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'tira-kina-tech-' + Date.now() + '.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  var linkP = null;
  function say(t){ $('smsg').textContent = t; }
  function link(){
    if (linkP) return linkP;
    linkP = (async function(){
      if (typeof window.KINA_UPLOAD === 'function'){
        if (!blob) throw new Error('A imagem ainda não está pronta');
        return window.KINA_UPLOAD(blob);
      }
      if (typeof claude !== 'undefined' && claude.use){
        var a = await claude.use('assets');
        if (!a) throw new Error('Sem permissão para enviar a foto');
        if (!blob) throw new Error('A imagem ainda não está pronta');
        var r = await a.upload(new File([blob], 'tira-kina-tech.png', { type: 'image/png' }));
        var u = r.url;
        if (!/^https?:/i.test(u)) u = new URL(u, /^https?:/i.test(location.href) ? location.href : 'https://claude.ai/').href;
        return u;
      }
      throw new Error('Função de upload indisponível');
    })();
    linkP.catch(function(){ linkP = null; });
    return linkP;
  }

  $('qrbtn').onclick = async function(){
    $('mailrow').hidden = true;
    if (typeof qrcode === 'undefined'){ say('Não foi possível carregar o gerador de QR code.'); return; }
    say('Gerando o link...');
    try {
      var u = await link(), q = qrcode(0, 'M'); q.addData(u); q.make();
      $('qr').innerHTML = '<img alt="QR code para abrir suas fotos no celular" src="' + q.createDataURL(6, 2) + '">';
      $('lnk').value = u; $('qrbox').hidden = false; say('');
    } catch(e){
      say('Não foi possível gerar o link público. Salve a imagem usando o botão Baixar imagem.');
    }
  };

  $('cplink').onclick = function(){
    var l = $('lnk'); l.select();
    try {
      navigator.clipboard.writeText(l.value).then(function(){ say('Link copiado.'); }, function(){
        document.execCommand('copy'); say('Link copiado.');
      });
    } catch(e){
      try { document.execCommand('copy'); say('Link copiado.'); } catch(x){ say('Selecione o link e copie manualmente.'); }
    }
  };

  $('mailbtn').onclick = function(){ $('qrbox').hidden = true; $('mailrow').hidden = false; $('mail').focus(); };

  $('mailgo').onclick = async function(){
    var m = $('mail');
    if (!m.value || !m.checkValidity()){ say('Digite um email válido.'); return; }
    say('Gerando o link...');
    try {
      var u = await link(), a = document.createElement('a');
      a.href = 'mailto:' + encodeURIComponent(m.value).replace('%40', '@') +
        '?subject=' + encodeURIComponent('Suas fotos da cabine Kina Tech') +
        '&body=' + encodeURIComponent('Olá! Aqui estão suas fotos da cabine Kina Tech no REC\'n\'Play:\n' + u);
      a.textContent = 'Abrir no aplicativo de email';
      $('smsg').textContent = 'Link pronto: ' + u + '  '; $('smsg').appendChild(a);
      window.location.href = a.href;
    } catch(e){
      say('Não foi possível gerar o link. Salve a imagem usando o botão Baixar imagem.');
    }
  };

  $('re-gerar').onclick = build;
  $('refazer').onclick = function(){ if (mode === 'cam') startCam(); else openGal(); };
  $('share').onclick = function(){
    try { navigator.share({ files: [new File([blob], 'tira-kina-tech.png', { type: 'image/png' })] }); } catch(e){}
  };

  // --- MOTOR DE HOLOFOTE E CURSOR MAGNÉTICO (Apenas Computador) ---
  function initDesktopEffects(){
    var isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isDesktop) return;

    var spotlight = $('spotlight');
    var ring = $('cursor-ring');
    var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    var ringX = mouseX, ringY = mouseY;

    window.addEventListener('mousemove', function(e){
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (spotlight){
        spotlight.style.transform = 'translate(' + mouseX + 'px, ' + mouseY + 'px) translate(-50%, -50%)';
      }
    });

    // Animação suave do anel seguidor
    function loopRing(){
      ringX += (mouseX - ringX) * 0.25;
      ringY += (mouseY - ringY) * 0.25;
      if (ring){
        ring.style.transform = 'translate(' + ringX + 'px, ' + ringY + 'px) translate(-50%, -50%)';
      }
      requestAnimationFrame(loopRing);
    }
    requestAnimationFrame(loopRing);

    // Efeito de crescimento sobre botões e atração magnética
    function bindMagnetics(){
      var interactives = document.querySelectorAll('button, .card, .chip');
      interactives.forEach(function(btn){
        btn.onmouseenter = function(){
          if (ring) ring.classList.add('hovering');
        };
        btn.onmouseleave = function(){
          if (ring) ring.classList.remove('hovering');
          btn.style.transform = '';
        };
        btn.onmousemove = function(e){
          var rect = btn.getBoundingClientRect();
          var cx = rect.left + rect.width / 2;
          var cy = rect.top + rect.height / 2;
          var dx = (e.clientX - cx) * 0.24;
          var dy = (e.clientY - cy) * 0.24;
          btn.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        };
      });
    }

    bindMagnetics();
    // Re-bind caso novos elementos entrem
    var observer = new MutationObserver(bindMagnetics);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Inicialização
  splitTitles();
  initDesktopEffects();
  triggerTitleAnimation($('s-inicio'));
})();