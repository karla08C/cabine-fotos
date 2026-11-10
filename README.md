# Cabine de Fotos Kina Tech — REC'n'Play 2026

Cabine de fotos interativa e responsiva desenvolvida para a **Kina Tech** no evento **REC'n'Play 2026**, combinando uma estética editorial de alta tecnologia inspirada em referências visuais contemporâneas (*Point of View / Reading Stones*) com processamento em tempo real de filtros artísticos e anime.

---

## Destaques Visuais e Interativos

1. **Transição em Cortina Vermelha**:
   - Transição cinematográfica entre telas (`curtain wipe`) com elevação suave que revela a próxima etapa.

2. **Tipografia com Títulos Animados**:
   - Palavras dos títulos sobem uma a uma em cascata com máscaras de corte limpas, criando dinamismo a cada tela.

3. **Faixa em Movimento (Ticker Marquee)**:
   - Faixa contínua no rodapé da tela inicial: `✦ KINA TECH ✦ REC’N’PLAY 2026 ✦ REGISTRE ESSE MOMENTO ✦`.

4. **Holofote e Cursor Magnético (Desktop)**:
   - Efeito de iluminação vermelha suave seguindo o ponteiro do mouse, anel orbital dinâmico e atração magnética sutil sobre os botões. Desativado automaticamente em telas sensíveis ao toque (smartphones e tablets).

5. **Identidade Visual Kina Tech**:
   - Logo oficial com fundo totalmente transparente (sem caixas ou halos escuros).
   - Tipografia limpa, minimalista e sem emojis para um visual moderno e corporativo.
   - Botão secundário de envio de fotos discreto e compacto.

6. **Filtros Fotográficos e Anime**:
   - **Sem filtro**: captura natural de alta nitidez.
   - **Sépia**: tom nostrófico e quente.
   - **P&B**: alto contraste clássico.
   - **Anime Cel**: posterização gráfica com contornos de tinta preta (*cel shading*).
   - **Ghibli**: paleta suave, aquarelada e iluminada.
   - **Shinkai**: saturação profunda, céu azul vívido e iluminação cinematográfica.
   - **Mangá**: estética gráfica em preto e branco com meio-tom (*screentone*).
   - **Kawaii**: realce suave de iluminação com blush e brilho cintilante.

7. **Lupa Óptica & Entrega da Foto**:
   - Lupa de aumento interativa (*Reading Stone Loupe*) para inspeção tátil dos detalhes da foto.
   - Download direto da tira em alta resolução (.png).
   - Gerador de QR Code instantâneo para salvar a foto no smartphone.
   - Envio facilitado por email e compartilhamento nativo.

---

## Como Executar

Por requisitos de segurança do navegador para acesso à câmera WebRTC:

```bash
# Na pasta do projeto:
python -m http.server 8000
```

Abra no navegador: `http://localhost:8000`

---

## Estrutura do Projeto

- `index.html`: Estrutura semântica das telas (Início, Captura, Montagem/Filtros, Processamento, Resultado Final).
- `css/style.css`: Folha de estilos completa (efeitos de cortina, holofote, animações de texto, responsividade e layout editorial).
- `js/app.js`: Lógica unificada da câmera, transições, shaders de filtros em canvas, animações de texto, física magnética do cursor, QR code e download.
- `assets/logo-kina-tech.png`: Logo Kina Tech com transparência alfa pura.
- `assets/recnplay.png`: Logo oficial REC'n'Play 2026.
