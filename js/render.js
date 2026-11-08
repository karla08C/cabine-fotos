(function(global){
  var api = global.CabineFotos = global.CabineFotos || {};

  api.render = api.render || {};

  api.render.fit = function(src){
    var canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 720;

    var ctx = canvas.getContext('2d');
    var width = src.videoWidth || src.width;
    var height = src.videoHeight || src.height;
    var scale = Math.max(960 / width, 720 / height);
    var drawWidth = 960 / scale;
    var drawHeight = 720 / scale;

    return {
      canvas: canvas,
      ctx: ctx,
      draw: function(mirror){
        if(mirror){
          ctx.translate(960, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(src, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight, 0, 0, 960, 720);
        return canvas;
      }
    };
  };

  api.render.createThumbUrl = function(canvas){
    try{return canvas.toDataURL('image/jpeg', 0.85);}catch(e){return '';}
  };

  api.render.buildFinal = function(options){
    return new Promise(function(resolve, reject){
      try{
        var shots = options.shots || [];
        var filtro = options.filtro || '';
        var tema = options.tema || 'light';
        var caption = options.caption || 'Meu momento no evento';
        var W = 720, P = 48, PW = 624, PH = 468, G = 30, BAND = 170, CAP = 120 + BAND, H = P + 3 * PH + 2 * G + 34 + CAP;
        var dark = tema === 'dark';
        var canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        var ctx = canvas.getContext('2d');

        ctx.fillStyle = dark ? '#141112' : '#fbfaf7';
        ctx.fillRect(0, 0, W, H);

        if(document.fonts && document.fonts.load){
          try{
            document.fonts.load('600 50px "Cormorant Garamond"');
            document.fonts.load('700 24px "Space Grotesk"');
          }catch(e){}
        }

        var supportFilter = 'filter' in CanvasRenderingContext2D.prototype;

        for(var i = 0; i < 3; i++){
          var y = P + i * (PH + G);
          ctx.save();
          ctx.beginPath();
          ctx.rect(P, y, PW, PH);
          ctx.clip();
          ctx.filter = filtro === 'sepia' ? 'sepia(.55) contrast(1.05) saturate(1.1)' : filtro === 'bw' ? 'grayscale(1) contrast(1.1)' : 'none';
          ctx.drawImage(shots[i], 0, 0, 960, 720, P, y, PW, PH);
          ctx.restore();

          if(!supportFilter && filtro){
            var imgData = ctx.getImageData(P, y, PW, PH);
            var data = imgData.data;
            for(var j = 0; j < data.length; j += 4){
              var r = data[j], g = data[j + 1], b = data[j + 2];
              if(filtro === 'bw'){
                var level = (.299 * r + .587 * g + .114 * b - 128) * 1.1 + 128;
                data[j] = level; data[j + 1] = level; data[j + 2] = level;
              } else {
                var nr = r + ((.393 * r + .769 * g + .189 * b) - r) * .55;
                var ng = g + ((.349 * r + .686 * g + .168 * b) - g) * .55;
                var nb = b + ((.272 * r + .534 * g + .131 * b) - b) * .55;
                data[j] = nr; data[j + 1] = ng; data[j + 2] = nb;
              }
            }
            ctx.putImageData(imgData, P, y);
          }
        }

        var baseY = P + 3 * PH + 2 * G + 34;
        ctx.textAlign = 'center';
        ctx.fillStyle = dark ? '#f2f0f0' : '#222';
        ctx.font = '600 50px "Cormorant Garamond", Georgia, serif';
        ctx.fillText(caption, W / 2, baseY + 80, PW);

        ctx.fillStyle = '#0f0d0e';
        ctx.fillRect(0, H - BAND, W, BAND);

        var logoK = options.logoK || 'assets/logo-kina-tech.png';
        var logoR = options.logoR || 'assets/logo-recnplay-2026.png';

        var loadImage = function(src){
          return new Promise(function(resolve){
            var img = new Image();
            img.onload = function(){resolve(img);};
            img.onerror = function(){resolve(null);};
            img.src = src;
          });
        };

        Promise.all([loadImage(logoK), loadImage(logoR)]).then(function(logos){
          var lk = logos[0], lr = logos[1];
          if(lk && lr){
            var fig = function(image, bw, bh){
              var q = Math.min(bw / image.width, bh / image.height);
              return [image.width * q, image.height * q];
            };
            var fa = fig(lk, 250, 100), fc = fig(lr, 300, 56), gp = 40, sx = (W - (fa[0] + gp + fc[0])) / 2, cy = H - BAND / 2;
            ctx.drawImage(lk, sx, cy - fa[1] / 2, fa[0], fa[1]);
            ctx.fillStyle = '#3a3536';
            ctx.fillRect(sx + fa[0] + gp / 2 - 1, cy - 32, 2, 64);
            ctx.drawImage(lr, sx + fa[0] + gp, cy - fc[1] / 2, fc[0], fc[1]);
          }

          if(canvas.toBlob){
            canvas.toBlob(function(blob){
              resolve(blob);
            }, 'image/png');
          } else {
            resolve(null);
          }
        }).catch(function(){
          reject(new Error('Erro ao montar a tira.'));
        });
      }catch(e){
        reject(e);
      }
    });
  };
})(window);
