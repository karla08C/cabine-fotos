# Cabine de fotos Kina Tech

Cabine de fotos para eventos: a pessoa tira 3 fotos na hora (ou escolhe da galeria),
escolhe filtro e tema da tira, e recebe uma tira vertical com legenda e as logos
da Kina Tech e da REC'n'Play 2026.

## Como rodar

A câmera só funciona em `https` ou `localhost`, e a imagem final só é gerada se
os arquivos vierem de um servidor (não abra o `index.html` com duplo clique).

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Estrutura

- `index.html`: telas do fluxo (início, modo, montagem, processamento, pronto, erros)
- `css/style.css`: estilos
- `js/app.js`: câmera, contagem, geração da tira em canvas, QR code e email
- `js/config.js`: função de envio da foto (`window.KINA_UPLOAD`)
- `js/vendor/qrcode.js`: qrcode-generator 1.4.4 (MIT)
- `assets/`: logos usadas no rodapé da tira

## Fluxo da aplicação

1. A pessoa entra na cabine e escolhe entre câmera ou galeria.
2. Seleciona 3 fotos (ou tira 3 na hora com a câmera).
3. Ajusta filtro e tema da tira.
4. Adiciona uma legenda.
5. A aplicação monta uma composição vertical em canvas.
6. O usuário pode salvar a imagem, gerar QR code ou enviar por email.

## QR code e email

O QR code e o email precisam de um link público para a foto. Isso exige um lugar
para hospedar a imagem. Implemente `window.KINA_UPLOAD` em `js/config.js`
(Cloudinary, Supabase Storage, S3, Google Drive ou um endpoint próprio).

```javascript
window.KINA_UPLOAD = async function (blob) {
  const form = new FormData();
  form.append('file', blob, 'tira-kina-tech.png');

  const res = await fetch('https://SEU-ENDPOINT/upload', {
    method: 'POST',
    body: form
  });

  if (!res.ok) throw new Error('falha no envio (' + res.status + ')');

  const data = await res.json();
  return data.url;
};
```

O email abre o aplicativo de email do aparelho com o link no corpo da mensagem;
o envio automático exigiria um servidor.

## Otimizações aplicadas

Este projeto foi ajustado para trabalhar de forma mais eficiente, especialmente em
smartphones e dispositivos com menos memória:

- miniaturas reutilizam a imagem gerada em vez de converter repetidamente em JPEG
- a imagem final é salva em `Blob` e exibida via `URL.createObjectURL()` para reduzir
  uso de memória e processamento desnecessário
- imagens da galeria são redimensionadas antes do processamento para reduzir o peso de
  memória em telas com fotos grandes
- objetos temporários e URLs geradas são limpos ao reiniciar o processo para evitar
  vazamentos e acúmulo de uso de RAM

## Próximos passos

- Hospedar as fotos e preencher `js/config.js`
- Publicar no GitHub Pages (Settings > Pages)
- Trocar a legenda padrão e o nome do evento
- Validar o fluxo em iPhones e Androids com diferentes tamanhos de tela
- Adicionar testes básicos de regressão e verificar o comportamento em navegadores
  mais antigos

## Observações de produção

- O app depende de `navigator.mediaDevices.getUserMedia()` para tirar fotos pela câmera.
- Quando o navegador bloquear a câmera, o fluxo oferece a alternativa de usar a galeria.
- O processo de montagem da tira usa `canvas`, o que evita depender de um backend para
  combinar as imagens no cliente.
- Para um uso mais robusto em produção, vale considerar hospedagem de arquivos e um
  endpoint para upload e geração de links públicos.
