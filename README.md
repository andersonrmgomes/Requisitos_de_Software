# 🕹️ Requisitos de Software - Laboratório Gamificado

Bem-vindo ao **Laboratório de Requisitos de Software**! Este projeto é uma plataforma educacional imersiva focada no ensino e prática da Engenharia de Requisitos (diferenciação entre Requisitos Funcionais e Não-Funcionais) de uma maneira totalmente gamificada e visual.

## ✨ Características Principais

O laboratório é composto por 6 módulos de desafios interativos, desenvolvidos para testar a curva de aprendizado do usuário progressivamente:

1. **📦 Classificação (Drag & Drop)**: Arraste cartões de requisitos para colunas de Requisitos Funcionais (RF) ou Não-Funcionais (RNF) em diferentes dificuldades.
2. **📇 Flashcards**: Cartas giratórias (Flip Cards) com conceitos-chave para revisão acelerada e memorização ativa.
3. **🧠 Jogo da Memória**: Encontre os pares combinando situações cotidianas com os atributos de qualidade da norma **ISO/IEC 25010**.
4. **🔗 Ligar Palavras**: Um minigame conceitual para interligar termos (linhas SVG dinâmicas) às suas respectivas definições formais.
5. **📘 Teoria e Padrões**: Um painel de consulta rápida explicando estruturalmente os 8 pilares da norma ISO/IEC 25010.
6. **🎰 Máquina Grua 2D (Arcade Canvas)**: O trunfo do laboratório! Uma autêntica "Claw Machine" de fliperama renderizada nativamente. Você usa um joystick para mover a pinça e pescar requisitos físicos (cubos e esferas) que respondam corretamente às perguntas do placar dinâmico de missões.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído pensando extrema leveza conceitual, dispensando frameworks pesados em prol da performance direta no navegador:

*   **HTML5 Semântico**
*   **CSS3 Avançado** (Glassmorphism design, Flexbox, Grid, Animações procedurais)
*   **JavaScript Vanilla (ES6+)**
*   **HTML5 Canvas 2D API** (Motor gráfico responsável pela física de Raycast e colisões dinâmicas da Máquina Grua)
*   Arquitetura limpa de **Assíncrono (Fetch API)** buscando matrizes de dados desacopladas em `.json`.

## 🚀 Como Rodar o Projeto (Instruções)

Devido às restrições modernas de segurança dos navegadores (`CORS`), a aplicação precisa de um servidor local para carregar os arquivos JSON das perguntas e das fases.

**Se você estiver usando o VS Code:**
1. Instale a extensão **[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)**.
2. Abra a pasta mãe do projeto no VS Code.
3. Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.
4. O laboratório abrirá automaticamente no seu navegador padrão.

**Outras Alternativas (Node.js ou Python):**
*   Via Python: Abra o terminal na pasta e rode `python -m http.server 8000`.
*   Via Node.js: Rode `npx http-server`.

---

> _Desenvolvido como projeto base de estudo interativo e gamificação para a disciplina de Engenharia de Software e Requisitos._
