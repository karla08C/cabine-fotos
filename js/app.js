(function(){
  var $=function(i){return document.getElementById(i)};
  var video=$('video'),stream=null,mode='cam',busy=false,shots=[],filtro='',tema='light',blob=null,resultUrl=null;
  var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
  function show(id){document.querySelectorAll('.screen').forEach(function(s){s.classList.toggle('on',s.id===id)});window.scrollTo(0,0);}
  function stop(){if(stream){stream.getTracks().forEach(function(t){t.stop()});stream=null;}}
  function clearResultUrl(){if(resultUrl){URL.revokeObjectURL(resultUrl);resultUrl=null;}}
  function resetShare(){linkP=null;$('qrbox').hidden=true;$('mailrow').hidden=true;$('smsg').textContent='';}
  function reset(){resetShare();clearResultUrl();stop();shots=[];busy=false;thumbs();$('out').removeAttribute('src');show('s-inicio');}
  function createThumbUrl(canvas){
    try{return canvas.toDataURL('image/jpeg',.85);}catch(e){return '';}
  }
  function thumbs(){
    var t=$('thumbs');t.innerHTML='';
    for(var i=0;i<3;i++){var d=document.createElement('div');
      if(shots[i]){var im=document.createElement('img');im.src=shots[i].__thumbUrl||createThumbUrl(shots[i]);im.alt='Foto '+(i+1);shots[i].__thumbUrl=im.src;d.appendChild(im);}else d.textContent=i+1;
      t.appendChild(d);}
  }
  function fcss(){return filtro==='sepia'?'sepia(.55) contrast(1.05) saturate(1.1)':filtro==='bw'?'grayscale(1) contrast(1.1)':'none';}
  function prev(){video.style.filter=fcss();$('thumbs').style.filter=fcss();}

  $('comecar').onclick=function(){show('s-modo');};
  $('voltar').onclick=function(){stop();show('s-modo');};
  $('fim').onclick=reset;$('re-ini').onclick=reset;
  
  async function startCam(){
    mode='cam';shots=[];thumbs();
    $('view').style.display='block';$('go').textContent='Tirar 3 fotos';$('dica').style.display='block';
    show('s-montar');$('go').disabled=true;
    try{
      if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw 0;
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});
      video.srcObject=stream;await video.play();$('go').disabled=false;
    }catch(e){show('s-errcam');}
  }
  $('modo-cam').onclick=startCam;$('re-cam').onclick=startCam;
  function openGal(){$('file').value='';$('file').click();}
  $('modo-gal').onclick=openGal;$('re-gal').onclick=openGal;

  function fit(src){
    var c=document.createElement('canvas');c.width=960;c.height=720;
    var x=c.getContext('2d'),w=src.videoWidth||src.width,h=src.videoHeight||src.height;
    var s=Math.max(960/w,720/h),sw=960/s,sh=720/s;
    return {c:c,x:x,draw:function(mirror){if(mirror){x.translate(960,0);x.scale(-1,1);}x.drawImage(src,(w-sw)/2,(h-sh)/2,sw,sh,0,0,960,720);return c;}};
  }
  function fileToCanvas(file){
    return new Promise(function(resolve,reject){
      var url=URL.createObjectURL(file),img=new Image();
      img.onload=function(){
        try{URL.revokeObjectURL(url);}catch(e){}
        var w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,maxEdge=1600,scale=Math.min(1,maxEdge/Math.max(w,h));
        var c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(w*scale));
        c.height=Math.max(1,Math.round(h*scale));
        var x=c.getContext('2d');
        x.drawImage(img,0,0,c.width,c.height);
        resolve(c);
      };
      img.onerror=function(){try{URL.revokeObjectURL(url);}catch(e){};reject(new Error('Erro ao ler a imagem.'));};
      img.src=url;
    });
  }
  $('file').onchange=function(){
    var fs=Array.prototype.slice.call($('file').files,0,3);
    if(fs.length<3){$('aviso').textContent='Selecione 3 fotos de uma vez para montar a tira.';return;}$('aviso').textContent='';
    Promise.all(fs.map(fileToCanvas))
    .then(function(cs){
      mode='gal';shots=cs;thumbs();$('view').style.display='none';
      $('go').textContent='Montar tira';$('dica').style.display='none';$('go').disabled=false;show('s-montar');prev();
    }).catch(function(){show('s-err');});
  };

  document.querySelectorAll('#chipsF .chip').forEach(function(b){b.onclick=function(){
    filtro=b.dataset.f;document.querySelectorAll('#chipsF .chip').forEach(function(x){x.setAttribute('aria-pressed',x===b)});prev();};});
  document.querySelectorAll('#chipsT .chip').forEach(function(b){b.onclick=function(){
    tema=b.dataset.t;document.querySelectorAll('#chipsT .chip').forEach(function(x){x.setAttribute('aria-pressed',x===b)});};});

  async function sequence(){
    if(busy)return;busy=true;$('go').disabled=true;shots=[];thumbs();
    for(var i=0;i<3;i++){
      for(var n=3;n>0;n--){$('count').textContent=n;await sleep(1000);}
      $('count').textContent='';
      var f=$('flash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go');
      shots[i]=fit(video).draw(true);thumbs();prev();
      if(i<2)await sleep(900);
    }
    busy=false;stop();build();
  }
  $('go').onclick=function(){if(mode==='cam')sequence();else build();};
  document.addEventListener('keydown',function(e){
    if(e.code==='Space'&&$('s-montar').classList.contains('on')&&mode==='cam'&&stream&&!busy&&e.target.tagName!=='INPUT'){e.preventDefault();sequence();}
  });

  var LK='assets/logo-kina-tech.png',LR='assets/logo-recnplay-2026.png';
  function li(u){return new Promise(function(r){var i=new Image();i.onload=function(){r(i)};i.onerror=function(){r(null)};i.src=u;});}
  var SUP='filter' in CanvasRenderingContext2D.prototype;
  function soft(x,px,py,w,h){
    if(!filtro)return;var d=x.getImageData(px,py,w,h),a=d.data;
    for(var i=0;i<a.length;i+=4){var r=a[i],g=a[i+1],b=a[i+2],nr,ng,nb;
      if(filtro==='bw'){var l=(.299*r+.587*g+.114*b-128)*1.1+128;nr=ng=nb=l;}
      else{nr=r+((.393*r+.769*g+.189*b)-r)*.55;ng=g+((.349*r+.686*g+.168*b)-g)*.55;nb=b+((.272*r+.534*g+.131*b)-b)*.55;}
      a[i]=nr;a[i+1]=ng;a[i+2]=nb;}
    x.putImageData(d,px,py);
  }
  async function build(){
    resetShare();show('s-proc');await sleep(1200);
    try{
      var W=720,P=48,PW=624,PH=468,G=30,BAND=170,CAP=120+BAND,H=P+3*PH+2*G+34+CAP;
      var dark=tema==='dark',c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');
      x.fillStyle=dark?'#141112':'#fbfaf7';x.fillRect(0,0,W,H);
      if(document.fonts&&document.fonts.load){try{await document.fonts.load('600 50px "Cormorant Garamond"');await document.fonts.load('700 24px "Space Grotesk"');}catch(e){}}
      var lk=await li(LK),lr=await li(LR);
      for(var i=0;i<3;i++){
        var y=P+i*(PH+G);x.save();x.beginPath();x.rect(P,y,PW,PH);x.clip();
        x.filter=fcss();x.drawImage(shots[i],0,0,960,720,P,y,PW,PH);x.restore();if(!SUP)soft(x,P,y,PW,PH);
      }
      var b=P+3*PH+2*G+34;x.textAlign='center';
      x.fillStyle=dark?'#f2f0f0':'#222';x.font='600 50px "Cormorant Garamond", Georgia, serif';
      x.fillText($('cap').value,W/2,b+80,PW);
      x.fillStyle='#0f0d0e';x.fillRect(0,H-BAND,W,BAND);
      if(lk&&lr){
        var fb=function(im,bw,bh){var q=Math.min(bw/im.width,bh/im.height);return [im.width*q,im.height*q];};
        var fa=fb(lk,250,100),fc=fb(lr,300,56),gp=40,sx=(W-(fa[0]+gp+fc[0]))/2,cy=H-BAND/2;
        x.drawImage(lk,sx,cy-fa[1]/2,fa[0],fa[1]);
        x.fillStyle='#3a3536';x.fillRect(sx+fa[0]+gp/2-1,cy-32,2,64);
        x.drawImage(lr,sx+fa[0]+gp,cy-fc[1]/2,fc[0],fc[1]);
      }
      var createResult=function(imgBlob){
        blob=imgBlob;
        if(resultUrl){URL.revokeObjectURL(resultUrl);resultUrl=null;}
        if(imgBlob && typeof URL !== 'undefined' && URL.createObjectURL){
          resultUrl=URL.createObjectURL(imgBlob);
          $('out').src=resultUrl;
        } else {
          $('out').src=c.toDataURL('image/png');
        }
      };
      if(c.toBlob){
        c.toBlob(function(bl){
          createResult(bl);
          $('share').hidden=!(navigator.canShare&&bl&&navigator.canShare({files:[new File([bl],'tira-kina-tech.png',{type:'image/png'})]}));
          show('s-pronto');
        },'image/png');
      } else {
        createResult(null);
        $('share').hidden=true;
        show('s-pronto');
      }
    }catch(e){show('s-err');}
  }
  var linkP=null;
  function say(t){$('smsg').textContent=t;}
  function link(){
    if(linkP)return linkP;
    linkP=(async function(){
      if(typeof window.KINA_UPLOAD==='function'){if(!blob)throw new Error('a imagem ainda não está pronta');return window.KINA_UPLOAD(blob);}
      if(typeof claude==='undefined'||!claude.use)throw new Error('o recurso de envio não está disponível nesta página');
      var a=await claude.use('assets');
      if(!a)throw new Error('sem permissão para enviar a foto. Abra a cabine na conta que edita este artefato');
      if(!blob)throw new Error('a imagem ainda não está pronta');
      var r=await a.upload(new File([blob],'tira-kina-tech.png',{type:'image/png'}));
      var u=r.url;
      if(!/^https?:/i.test(u))u=new URL(u,/^https?:/i.test(location.href)?location.href:'https://claude.ai/').href;
      return u;
    })();
    linkP.catch(function(){linkP=null;});
    return linkP;
  }
  $('qrbtn').onclick=async function(){
    $('mailrow').hidden=true;
    if(typeof qrcode==='undefined'){say('Não foi possível carregar o gerador de QR code.');return;}
    say('Gerando o link...');
    try{
      var u=await link(),q=qrcode(0,'M');q.addData(u);q.make();
      $('qr').innerHTML='<img alt="QR code para abrir suas fotos no celular" src="'+q.createDataURL(6,2)+'">';
      $('lnk').value=u;$('qrbox').hidden=false;say('');
    }catch(e){say('Não foi possível gerar o link: '+((e&&(e.message||e.code))||'erro desconhecido')+'. Salve a imagem pelos passos acima.');}
  };
  $('cplink').onclick=function(){
    var l=$('lnk');l.select();
    try{navigator.clipboard.writeText(l.value).then(function(){say('Link copiado.');},function(){document.execCommand('copy');say('Link copiado.');});}
    catch(e){try{document.execCommand('copy');say('Link copiado.');}catch(x){say('Selecione o link e copie manualmente.');}}
  };
  $('mailbtn').onclick=function(){$('qrbox').hidden=true;$('mailrow').hidden=false;$('mail').focus();};
  $('mailgo').onclick=async function(){
    var m=$('mail');if(!m.value||!m.checkValidity()){say('Digite um email válido.');return;}
    say('Gerando o link...');
    try{
      var u=await link(),a=document.createElement('a');
      a.href='mailto:'+encodeURIComponent(m.value).replace('%40','@')+'?subject='+encodeURIComponent('Suas fotos da cabine Kina Tech')+'&body='+encodeURIComponent('Olá! Aqui estão suas fotos: '+u);
      a.textContent='Abrir no aplicativo de email';
      $('smsg').textContent='Link pronto: '+u+'  ';$('smsg').appendChild(a);
    }catch(e){say('Não foi possível gerar o link: '+((e&&(e.message||e.code))||'erro desconhecido')+'. Salve a imagem pelos passos acima.');}
  };
  $('re-gerar').onclick=build;
  $('refazer').onclick=function(){if(mode==='cam')startCam();else openGal();};
  $('share').onclick=function(){
    try{navigator.share({files:[new File([blob],'tira-kina-tech.png',{type:'image/png'})]});}catch(e){}
  };
})();
