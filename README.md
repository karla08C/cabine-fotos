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

## QR code e email

O QR code e o email precisam de um link público para a foto. Isso exige um lugar
para hospedar a imagem. Implemente `window.KINA_UPLOAD` em `js/config.js`
(Cloudinary, Supabase Storage, S3, Google Drive ou um endpoint próprio).
O email abre o aplicativo de email do aparelho com o link no corpo da mensagem;
o envio automático exigiria um servidor.

## Próximos passos

- Hospedar as fotos e preencher `js/config.js`
- Publicar no GitHub Pages (Settings > Pages)
- Trocar a legenda padrão e o nome do evento
