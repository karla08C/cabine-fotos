(function(global){
  var api = global.CabineFotos = global.CabineFotos || {};

  api.camera = api.camera || {};

  api.camera.stop = function(stream){
    if(stream && stream.getTracks){
      stream.getTracks().forEach(function(track){track.stop();});
    }
  };

  api.camera.start = async function(video){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      throw new Error('Câmera não suportada pelo navegador.');
    }

    var stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false
    });

    video.srcObject = stream;
    await video.play();
    return stream;
  };
})(window);
