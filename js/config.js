// Envio da foto para gerar o link do QR code e do email.
// Defina window.KINA_UPLOAD com uma função que recebe o Blob (PNG) da tira
// e devolve (Promise) a URL pública da imagem. Exemplo com um endpoint próprio:
//
// window.KINA_UPLOAD = async function (blob) {
//   const form = new FormData();
//   form.append('file', blob, 'tira-kina-tech.png');
//   const res = await fetch('https://SEU-ENDPOINT/upload', { method: 'POST', body: form });
//   if (!res.ok) throw new Error('falha no envio (' + res.status + ')');
//   const data = await res.json();
//   return data.url; // URL pública da foto
// };
//
// Enquanto não for definida, o botão de QR code mostra uma mensagem de erro
// e a pessoa salva a imagem pelas instruções da tela.
