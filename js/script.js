// --- Tema e Navegação ---
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');
const body = document.body;

function setTheme(themeName) {
    body.className = themeName;
    if (themeName === 'theme-dark') {
        themeIcon.classList.replace('ph-moon', 'ph-sun');
    } else {
        themeIcon.classList.replace('ph-sun', 'ph-moon');
    }
    localStorage.setItem('requisitos-theme', themeName);
}

const savedTheme = localStorage.getItem('requisitos-theme') || 'theme-light';
setTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    const isDark = body.classList.contains('theme-dark');
    setTheme(isDark ? 'theme-light' : 'theme-dark');
});

// Configuração Abas
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.content-section');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        sections.forEach(s => s.classList.add('hidden-section'));

        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        document.getElementById(btn.dataset.target).classList.remove('hidden-section');
    });
});


// --- FLASHCARDS LOGIC ---
let flashcardsData = [];
let currentFlashcardIndex = 0;
const flashcardEl = document.getElementById('current-flashcard');
const fcFrontText = document.getElementById('fc-front-text');
const fcBackText = document.getElementById('fc-back-text');
const fcCurrentNum = document.getElementById('fc-current-num');
const fcTotalNum = document.getElementById('fc-total-num');

async function loadFlashcards() {
    try {
        const res = await fetch('data/flashcards.json');
        if (!res.ok) throw new Error("Erro via fetch");
        flashcardsData = await res.json();

        document.getElementById('fc-loading').classList.add('hidden');
        document.getElementById('fc-container').classList.remove('hidden');
        document.getElementById('fc-actions').classList.remove('hidden');

        fcTotalNum.innerText = flashcardsData.length;
        updateFlashcard();
    } catch (err) {
        document.getElementById('fc-loading').classList.add('hidden');
        document.getElementById('fc-error').classList.remove('hidden');
    }
}

function updateFlashcard() {
    flashcardEl.classList.remove('flipped');

    // aguarda a animação virar para revelar
    setTimeout(() => {
        const item = flashcardsData[currentFlashcardIndex];
        fcFrontText.innerText = item.front;
        fcBackText.innerText = item.back;
        fcCurrentNum.innerText = currentFlashcardIndex + 1;
    }, 250);
}

flashcardEl.addEventListener('click', () => {
    flashcardEl.classList.toggle('flipped');
});

flashcardEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flashcardEl.classList.toggle('flipped');
    }
});

document.getElementById('fc-prev').addEventListener('click', () => {
    if (currentFlashcardIndex > 0) {
        currentFlashcardIndex--;
        updateFlashcard();
    }
});

document.getElementById('fc-next').addEventListener('click', () => {
    if (currentFlashcardIndex < flashcardsData.length - 1) {
        currentFlashcardIndex++;
        updateFlashcard();
    }
});


// --- JOGO DE CLASSIFICAÇÃO (DRAG AND DROP) LOGIC ---
let allLevelsData = {};
const levelsOrder = ['easy', 'medium', 'hard', 'expert', 'master'];
const levelNames = {
    'easy': 'Fácil 🌱',
    'medium': 'Intermediário 🚀',
    'hard': 'Avançado 🔥',
    'expert': 'Especialista 💠',
    'master': 'Mestre dos Requisitos 👑'
};

let currentLevelIndex = 0;
let score = 0;
let correctCountInLevel = 0;
let totalItemsInLevel = 0;

const itemsContainer = document.getElementById('items-container');
const dropZones = document.querySelectorAll('.drop-zone');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.querySelector('#level-display span');
const levelFeedback = document.getElementById('game-feedback');
const restartBtn = document.getElementById('restart-btn');
const nextLevelBtn = document.getElementById('next-level-btn');

async function loadClassification() {
    try {
        const response = await fetch('data/questions.json');
        if (!response.ok) throw new Error("Erro");
        allLevelsData = await response.json();
        itemsContainer.innerHTML = '';
        initLevel(0);
    } catch (error) {
        itemsContainer.innerHTML = `<p class="loading-message error-msg">Erro ao carregar perguntas. Devido à segurança CORS, execute o aplicativo através de um Servidor Local (ex: Live Server).</p>`;
    }
}

function initLevel(levelIdx) {
    currentLevelIndex = levelIdx;
    const levelKey = levelsOrder[currentLevelIndex];
    const levelData = allLevelsData[levelKey];

    // Pegar apenas 6 itens aleatórios por nível para não poluir a tela
    const maxItems = Math.min(6, levelData.length);
    const shuffledSubset = [...levelData].sort(() => Math.random() - 0.5).slice(0, maxItems);

    correctCountInLevel = 0;
    totalItemsInLevel = shuffledSubset.length;

    levelDisplay.innerText = levelNames[levelKey];
    scoreDisplay.innerText = score;
    levelFeedback.innerText = `Nível ${levelNames[levelKey]} carregado!`;
    levelFeedback.style.color = "var(--text-color)";

    nextLevelBtn.classList.add('hidden');
    restartBtn.classList.add('hidden');

    document.querySelectorAll('.zone-content').forEach(el => el.innerHTML = '');
    itemsContainer.innerHTML = '';

    shuffledSubset.forEach(item => {
        const el = document.createElement('div');
        el.classList.add('draggable-item');
        el.draggable = true;
        el.dataset.id = item.id;
        el.dataset.type = item.type;
        el.innerText = item.text;
        el.id = item.id;
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-grabbed', 'false');

        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragend', handleDragEnd);
        el.addEventListener('click', () => handleItemClickForAccessibility(el));
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemClickForAccessibility(el); }
        });

        itemsContainer.appendChild(el);
    });
}
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    setTimeout(() => this.style.opacity = '0.4', 0);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
    this.setAttribute('aria-grabbed', 'true');
}
function handleDragEnd() {
    this.style.opacity = '1';
    draggedItem = null;
    dropZones.forEach(zone => zone.classList.remove('drag-over'));
    this.setAttribute('aria-grabbed', 'false');
}

dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => { zone.classList.remove('drag-over'); });
    zone.addEventListener('drop', (e) => {
        e.preventDefault(); zone.classList.remove('drag-over');
        if (draggedItem) handleDrop(draggedItem, zone);
    });
});

function handleDrop(item, zone) {
    if (item.dataset.type === zone.dataset.type) {
        zone.querySelector('.zone-content').appendChild(item);
        item.draggable = false;
        item.classList.add('correct');
        score += 10;
        correctCountInLevel++;
        levelFeedback.innerText = "Mandou bem! +10 pontos 🌟";
        levelFeedback.style.color = "var(--success)";
        item.removeEventListener('dragstart', handleDragStart);
        item.style.cursor = 'default';
        updateScore();

        if (correctCountInLevel === totalItemsInLevel) {
            if (currentLevelIndex < levelsOrder.length - 1) {
                levelFeedback.innerText = `Nível concluído! 🎉`; nextLevelBtn.classList.remove('hidden');
            } else {
                levelFeedback.innerText = `Você Zerou! 🏆`; restartBtn.classList.remove('hidden');
            }
        }
    } else {
        item.classList.add('wrong');
        setTimeout(() => item.classList.remove('wrong'), 500);
        score = Math.max(0, score - 5);
        levelFeedback.innerText = "Ops! Categoria errada. -5 pontos ❌";
        levelFeedback.style.color = "var(--error)";
        updateScore();
    }
}
function updateScore() { scoreDisplay.innerText = score; }

nextLevelBtn.addEventListener('click', () => initLevel(currentLevelIndex + 1));
restartBtn.addEventListener('click', () => { score = 0; initLevel(0); });

let selectedForA11y = null;
function handleItemClickForAccessibility(item) {
    if (!item.draggable) return;
    if (selectedForA11y === item) {
        item.style.boxShadow = ''; selectedForA11y = null; return;
    }
    if (selectedForA11y) selectedForA11y.style.boxShadow = '';
    selectedForA11y = item;
    item.style.boxShadow = '0 0 0 4px var(--primary)';
    levelFeedback.innerText = `Selecionado. Clique na área destino.`;
}

dropZones.forEach(zone => {
    zone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (selectedForA11y) { handleDrop(selectedForA11y, zone); selectedForA11y.style.boxShadow = ''; selectedForA11y = null; } }
    });
    zone.addEventListener('click', () => {
        if (selectedForA11y) { handleDrop(selectedForA11y, zone); selectedForA11y.style.boxShadow = ''; selectedForA11y = null; }
    });
});


// --- JOGO DA MEMORIA LOGIC ---
let memoryCardsData = [];
let memoryGrid = document.getElementById('memory-grid');
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let memoryMoves = 0;
let memoryMatches = 0;
const memoryMatchDisplay = document.getElementById('memory-matches');
const memoryMoveDisplay = document.getElementById('memory-moves');
const memoryFeedback = document.getElementById('memory-feedback');

async function loadMemory() {
    try {
        const res = await fetch('data/memory.json');
        if (!res.ok) throw new Error("Erro");
        const data = await res.json();

        document.getElementById('memory-loading').classList.add('hidden');
        document.getElementById('memory-grid').classList.remove('hidden');
        document.getElementById('memory-actions').classList.remove('hidden');

        // Load sem duplicar os arrays (pois o json já é feito em pares perfeitos)
        memoryCardsData = data;
        initMemoryGame();
    } catch (e) {
        document.getElementById('memory-loading').classList.add('hidden');
        document.getElementById('memory-error').classList.remove('hidden');
    }
}

function initMemoryGame() {
    memoryGrid.innerHTML = '';
    memoryMoves = 0;
    memoryMatches = 0;

    // Atualiza Placares
    memoryMoveDisplay.innerText = memoryMoves;
    memoryMatchDisplay.innerText = `0 / ${memoryCardsData.length / 2}`;
    memoryFeedback.innerText = 'Encontre os pares!';
    memoryFeedback.style.color = "var(--text-color)";

    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;

    // Shuffle Array
    const shuffledCards = [...memoryCardsData].sort(() => 0.5 - Math.random());

    shuffledCards.forEach((item, index) => {
        const d = document.createElement('div');
        d.classList.add('memory-card');
        d.dataset.id = item.id;
        d.dataset.matchId = item.matchId;
        d.tabIndex = 0;

        d.innerHTML = `
            <div class="memory-card-inner">
                <div class="memory-front"><i class="ph ph-question"></i></div>
                <div class="memory-back">${item.text}</div>
            </div>
        `;

        d.addEventListener('click', flipCard);
        d.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard.call(d); }
        });

        memoryGrid.appendChild(d);
    });
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flipped');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    memoryMoves++;
    memoryMoveDisplay.innerText = memoryMoves;

    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.matchId === secondCard.dataset.matchId;
    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    // Adiciona classe para pintar o fundo de verde
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');

    memoryMatches++;
    memoryMatchDisplay.innerText = `${memoryMatches} / ${memoryCardsData.length / 2}`;

    if (memoryMatches === memoryCardsData.length / 2) {
        memoryFeedback.innerText = `Parabéns! Você completou em ${memoryMoves} tentativas! 🎉`;
        memoryFeedback.style.color = "var(--success)";
    }

    resetBoard();
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
    }, 1200);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

document.getElementById('memory-restart').addEventListener('click', initMemoryGame);

// Load Everything
window.addEventListener('DOMContentLoaded', () => {
    loadClassification();
    loadFlashcards();
    loadMemory();
    loadLinkWords();
});

// --- LIGAÇÃO DE PALAVRAS (LINK TO WORDS) ---
let lwData = [];
let lwPlayableCount = 0;
let lwSelectedLeft = null;
let lwSelectedRight = null;
let lwMatches = 0;
const lwLinesSvg = document.getElementById('lw-lines');

async function loadLinkWords() {
    try {
        const res = await fetch('data/linkwords.json');
        if (!res.ok) throw new Error("Erro");
        lwData = await res.json();

        document.getElementById('lw-loading').classList.add('hidden');
        document.getElementById('lw-container').classList.remove('hidden');
        document.getElementById('lw-actions').classList.remove('hidden');
        initLinkWords();
    } catch (e) {
        document.getElementById('lw-loading').classList.add('hidden');
        document.getElementById('lw-error').classList.remove('hidden');
    }
}

function initLinkWords() {
    lwMatches = 0;

    document.getElementById('lw-feedback').innerText = '';
    lwLinesSvg.innerHTML = '';
    lwSelectedLeft = null;
    lwSelectedRight = null;

    const colLeft = document.getElementById('lw-col-left');
    const colRight = document.getElementById('lw-col-right');
    colLeft.innerHTML = '';
    colRight.innerHTML = '';

    // Seleciona um subset aleatório de 5 pares (replayability sem poluir)
    let playableData = [...lwData].sort(() => 0.5 - Math.random()).slice(0, 5);
    lwPlayableCount = playableData.length;
    document.getElementById('lw-score').innerText = `0 / ${lwPlayableCount}`;

    let leftArray = [...playableData].sort(() => 0.5 - Math.random());
    let rightArray = [...playableData].sort(() => 0.5 - Math.random());

    leftArray.forEach(item => {
        const div = document.createElement('div');
        div.className = 'lw-node';
        div.innerText = item.left;
        div.dataset.matchId = item.id;
        div.dataset.side = 'left';
        div.tabIndex = 0;
        div.onclick = () => handleLwNodeClick(div);
        div.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLwNodeClick(div); } };
        colLeft.appendChild(div);
    });

    rightArray.forEach(item => {
        const div = document.createElement('div');
        div.className = 'lw-node';
        div.innerText = item.right;
        div.dataset.matchId = item.id;
        div.dataset.side = 'right';
        div.tabIndex = 0;
        div.onclick = () => handleLwNodeClick(div);
        div.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLwNodeClick(div); } };
        colRight.appendChild(div);
    });
}

function handleLwNodeClick(node) {
    if (node.classList.contains('matched')) return;

    if (node.classList.contains('selected')) {
        node.classList.remove('selected');
        if (node.dataset.side === 'left') lwSelectedLeft = null;
        else lwSelectedRight = null;
        return;
    }

    if (node.dataset.side === 'left') {
        if (lwSelectedLeft) lwSelectedLeft.classList.remove('selected');
        lwSelectedLeft = node;
    } else {
        if (lwSelectedRight) lwSelectedRight.classList.remove('selected');
        lwSelectedRight = node;
    }
    node.classList.add('selected');

    if (lwSelectedLeft && lwSelectedRight) {
        checkLwMatch();
    }
}

function checkLwMatch() {
    const isMatch = lwSelectedLeft.dataset.matchId === lwSelectedRight.dataset.matchId;

    if (isMatch) {
        drawLwLine(lwSelectedLeft, lwSelectedRight);
        lwSelectedLeft.classList.remove('selected');
        lwSelectedRight.classList.remove('selected');
        lwSelectedLeft.classList.add('matched');
        lwSelectedRight.classList.add('matched');

        lwMatches++;
        document.getElementById('lw-score').innerText = `${lwMatches} / ${lwPlayableCount}`;

        if (lwMatches === lwPlayableCount) {
            document.getElementById('lw-feedback').innerText = "Excelente! Você conectou tudo perfeitamente! 🎉";
            document.getElementById('lw-feedback').style.color = "var(--success)";
        }
    } else {
        const leftNode = lwSelectedLeft;
        const rightNode = lwSelectedRight;
        leftNode.classList.add('wrong');
        rightNode.classList.add('wrong');

        // Libera os cursores globais na mesma hora pra evitar bloqueio
        lwSelectedLeft = null;
        lwSelectedRight = null;

        setTimeout(() => {
            leftNode.classList.remove('wrong', 'selected');
            rightNode.classList.remove('wrong', 'selected');
        }, 500);
    }

    if (isMatch) {
        lwSelectedLeft = null;
        lwSelectedRight = null;
    }
}

function drawLwLine(el1, el2) {
    const container = document.getElementById('lw-container');
    const containerRect = container.getBoundingClientRect();
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    let x1 = rect1.right - containerRect.left;
    let y1 = rect1.top + (rect1.height / 2) - containerRect.top;

    let x2 = rect2.left - containerRect.left;
    let y2 = rect2.top + (rect2.height / 2) - containerRect.top;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('class', 'lw-line correct');

    lwLinesSvg.appendChild(line);
}

document.getElementById('lw-restart').addEventListener('click', initLinkWords);

window.addEventListener('resize', () => {
    if (lwMatches > 0) {
        lwLinesSvg.innerHTML = '';
        const leftNodes = document.querySelectorAll('#lw-col-left .matched');
        const rightNodes = document.querySelectorAll('#lw-col-right .matched');
        leftNodes.forEach(ln => {
            let id = ln.dataset.matchId;
            let rn = Array.from(rightNodes).find(r => r.dataset.matchId === id);
            if (rn) drawLwLine(ln, rn);
        });
    }
});

// --- CLAW MACHINE 2D MAKER QUIZ ---
let clawCanvas, clawCtx;

let clawMissions = [
    { q: "O sistema deve permitir login via Google OAuth2.", ans: "rf" },
    { q: "As senhas dos clientes devem ser todas criptografadas.", ans: "rnf" },
    { q: "O botão do Carrinho de Compras visual deve adicionar produtos à lista.", ans: "rf" },
    { q: "A cor do rodapé deve ser visível para daltônicos (Usabilidade).", ans: "rnf" },
    { q: "A emissão do Extrato PDF não pode consumir mais de 100MB de RAM.", ans: "rnf" },
    { q: "Deverá haver um botão para cancelar a assinatura de serviços mensais.", ans: "rf" },
    { q: "O sistema não poderá falhar (Crash) caso picos de acessos aconteçam de madrugada.", ans: "rnf" },
    { q: "O painel do gestor deve conseguir listar todos os clientes cadastrados do banco.", ans: "rf" }
];
let currentClawMissionIndex = 0;
let clawGameScore = 0;

function loadNextClawMission() {
    currentClawMissionIndex = Math.floor(Math.random() * clawMissions.length);
    const missionText = document.getElementById('claw-mission-text');
    if (missionText) {
        missionText.innerHTML = `<strong>${clawMissions[currentClawMissionIndex].q}</strong><br><span style="font-size: 13px; opacity: 0.75; margin-top:5px; display:block;">🕹️ Pesque o Bloco Azul [RF] ou a Esfera Laranja [RNF] correspondente!</span>`;
    }
}

let prizes = [];
let clawState = {
    x: 0,
    y: 50,
    targetX: 0,
    state: 'idle',
    grabbedPrize: null
};

let lastTime = performance.now();
let clawAnimationFrame;

function initClawMachine2D() {
    clawCanvas = document.getElementById('clawCanvas');
    if (!clawCanvas) return;
    clawCtx = clawCanvas.getContext('2d');

    resizeClawCanvas();
    window.addEventListener('resize', resizeClawCanvas);

    if (prizes.length === 0) {
        for (let i = 0; i < 14; i++) {
            const isRF = Math.random() > 0.5;
            prizes.push({
                x: Math.random() * (clawCanvas.width - 80) + 40,
                y: clawCanvas.height - 40 - Math.random() * 60,
                w: 48,
                h: 48,
                type: isRF ? 'rf' : 'rnf',
                color: isRF ? '#3b82f6' : '#f97316'
            });
        }
        clawState.x = clawCanvas.width / 2;
        clawState.y = 50;
    }

    // Iniciar Jogo e Placar
    clawGameScore = 0;
    const scoreDisplay = document.getElementById('claw-score-display');
    if (scoreDisplay) scoreDisplay.innerText = clawGameScore;
    loadNextClawMission();

    let inputState = { left: false, right: false };

    const leftBtn = document.getElementById('claw-left-btn');
    const rightBtn = document.getElementById('claw-right-btn');
    const dropBtn = document.getElementById('claw-drop-btn');

    // Mouse Down
    leftBtn.addEventListener('mousedown', () => inputState.left = true);
    leftBtn.addEventListener('mouseup', () => inputState.left = false);
    leftBtn.addEventListener('mouseleave', () => inputState.left = false);

    rightBtn.addEventListener('mousedown', () => inputState.right = true);
    rightBtn.addEventListener('mouseup', () => inputState.right = false);
    rightBtn.addEventListener('mouseleave', () => inputState.right = false);

    // Touch
    leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); inputState.left = true; });
    leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); inputState.left = false; });

    rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); inputState.right = true; });
    rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); inputState.right = false; });

    // Botão de Pegar
    const attemptDrop = () => {
        if (clawState.state === 'idle' && document.getElementById('claw-modal').classList.contains('hidden')) {
            clawState.state = 'dropping';
            // Animation feel for the big red button
            dropBtn.style.transform = 'scale(0.9)';
            setTimeout(() => dropBtn.style.transform = 'none', 100);
        }
    };

    dropBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        attemptDrop();
    });

    // Teclado Direcional + Barra de Espaço
    window.addEventListener('keydown', (e) => {
        const section3d = document.getElementById('section-3d');
        if (section3d && section3d.classList.contains('hidden-section')) return;
        if (e.key === 'ArrowLeft' || e.key === 'A' || e.key === 'a') inputState.left = true;
        if (e.key === 'ArrowRight' || e.key === 'D' || e.key === 'd') inputState.right = true;
        if (e.key === ' ' || e.key === 'Enter') attemptDrop();
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'A' || e.key === 'a') inputState.left = false;
        if (e.key === 'ArrowRight' || e.key === 'D' || e.key === 'd') inputState.right = false;
    });

    clawState.inputState = inputState;

    const closeBtn = document.getElementById('claw-close-btn');
    closeBtn.replaceWith(closeBtn.cloneNode(true));
    document.getElementById('claw-close-btn').addEventListener('click', () => {
        document.getElementById('claw-modal').classList.add('hidden');
        if (clawState.grabbedPrize) {
            clawState.grabbedPrize.y = clawCanvas.height - 40 - Math.random() * 60;
            clawState.grabbedPrize.x = Math.random() * (clawCanvas.width - 80) + 40;
            prizes.push(clawState.grabbedPrize);
            clawState.grabbedPrize = null;
        }
        clawState.state = 'idle';
    });

    if (!clawAnimationFrame) {
        lastTime = performance.now();
        clawLoop(lastTime);
    }
}

function resizeClawCanvas() {
    if (!clawCanvas) return;
    clawCanvas.width = clawCanvas.clientWidth;
    clawCanvas.height = clawCanvas.clientHeight;
}

function clawLoop(time) {
    clawAnimationFrame = requestAnimationFrame(clawLoop);
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    const section3d = document.getElementById('section-3d');
    if (section3d && section3d.classList.contains('hidden-section')) return;

    updateClaw(Math.min(dt, 0.1));
    drawClawMachine();
}

function updateClaw(dt) {
    const speed = 300;
    const dropSpeed = 500;

    if (clawState.state === 'idle') {
        if (clawState.inputState.left) {
            clawState.x -= speed * dt;
        }
        if (clawState.inputState.right) {
            clawState.x += speed * dt;
        }
        // Limit X boundaries
        clawState.x = Math.max(25, Math.min(clawCanvas.width - 25, clawState.x));
    }
    else if (clawState.state === 'dropping') {
        clawState.y += dropSpeed * dt;

        let grabbedIdx = -1;
        let highestCollisionY = 9999;

        // Detecção contínua ao descer (Raycast) em cima das caixas
        for (let i = 0; i < prizes.length; i++) {
            const p = prizes[i];
            const topDaCaixa = p.y - p.h / 2;

            // X com margem gorda (30px) e Y colidindo
            if (Math.abs(p.x - clawState.x) < 32 && (clawState.y + 20) >= topDaCaixa) {
                // Prioriza pegar sempre o que estiver mais alto na lona (Top-most)
                if (topDaCaixa < highestCollisionY) {
                    highestCollisionY = topDaCaixa;
                    grabbedIdx = i;
                }
            }
        }

        if (grabbedIdx !== -1) {
            // Interrompe a descida bloqueando a garra na borda do item + "agarrada"
            clawState.y = highestCollisionY - 10;
            clawState.state = 'grabbing';
            clawState.grabbedPrize = prizes.splice(grabbedIdx, 1)[0];
        }
        else if (clawState.y >= clawCanvas.height - 50) {
            // Tocou o chão e não pegou nada
            clawState.y = clawCanvas.height - 50;
            clawState.state = 'grabbing';
        }
    }
    else if (clawState.state === 'grabbing') {
        clawState.state = 'lifting';
    }
    else if (clawState.state === 'lifting') {
        clawState.y -= dropSpeed * dt;
        if (clawState.grabbedPrize) {
            clawState.grabbedPrize.x = clawState.x;
            clawState.grabbedPrize.y = clawState.y + 25;
        }

        if (clawState.y <= 50) {
            clawState.y = 50;
            if (clawState.grabbedPrize) {
                clawState.state = 'modal';

                const mission = clawMissions[currentClawMissionIndex];
                const grabbedType = clawState.grabbedPrize.type;
                const isCorrect = (grabbedType === mission.ans);

                let modalHtml = "";
                if (isCorrect) {
                    clawGameScore += 10;
                    document.getElementById('claw-score-display').innerText = clawGameScore;
                    modalHtml = `<h3 style="color: var(--success); margin-bottom: 10px;">Acertou em cheio! +10 🌟</h3>
                                 <p>Isso mesmo! O cesto capturou uma forma <strong>${grabbedType === 'rf' ? 'Funcional' : 'Não Funcional'}</strong> que corresponde perfeitamente ao comportamento exigido na missão!</p>`;
                    loadNextClawMission();
                } else {
                    clawGameScore = Math.max(0, clawGameScore - 5);
                    document.getElementById('claw-score-display').innerText = clawGameScore;
                    let targetNameHTML = mission.ans === 'rf' ? '<span style="color:#3b82f6; font-weight:bold;">Funcional (Cubo Azul)</span>' : '<span style="color:#f97316; font-weight:bold;">Não Funcional (Esfera Laranja)</span>';
                    modalHtml = `<h3 style="color: var(--error); margin-bottom: 10px;">Poxa, Quase! -5 💥</h3>
                                 <p>Você pegou um recipiente da categoria incorreta! Lembre-se, a resposta certa para a pergunta central seria a categoria de requerimentos do tipo <strong>${targetNameHTML}</strong>.</p>`;
                }

                document.getElementById('claw-modal-text').innerHTML = modalHtml;
                document.getElementById('claw-modal').classList.remove('hidden');
            } else {
                clawState.state = 'idle';
            }
        }
    }
}

function drawClawMachine() {
    clawCtx.clearRect(0, 0, clawCanvas.width, clawCanvas.height);

    clawCtx.beginPath();
    clawCtx.moveTo(clawState.x, 0);
    clawCtx.lineTo(clawState.x, clawState.y);
    clawCtx.lineWidth = 4;
    clawCtx.strokeStyle = '#94a3b8';
    clawCtx.stroke();

    clawCtx.fillStyle = '#475569';
    clawCtx.fillRect(clawState.x - 20, clawState.y, 40, 12);

    clawCtx.beginPath();
    let spread = 25;
    if (clawState.state === 'dropping' || clawState.state === 'idle') spread = 35;
    if (clawState.state === 'lifting' || clawState.state === 'modal') spread = 18;

    clawCtx.moveTo(clawState.x - 20, clawState.y + 12);
    clawCtx.lineTo(clawState.x - spread, clawState.y + 35);
    clawCtx.lineTo(clawState.x - spread + 15, clawState.y + 35);

    clawCtx.moveTo(clawState.x + 20, clawState.y + 12);
    clawCtx.lineTo(clawState.x + spread, clawState.y + 35);
    clawCtx.lineTo(clawState.x + spread - 15, clawState.y + 35);

    clawCtx.lineWidth = 4;
    clawCtx.strokeStyle = '#64748b';
    clawCtx.stroke();

    const allItems = [...prizes];
    if (clawState.grabbedPrize) allItems.push(clawState.grabbedPrize);

    allItems.forEach(p => {
        // Sombra Projetada
        clawCtx.shadowColor = 'rgba(0,0,0,0.4)';
        clawCtx.shadowBlur = 10;
        clawCtx.shadowOffsetY = 4;

        if (p.type === 'rf') {
            // Gradiente do Cubo (RF)
            const grad = clawCtx.createLinearGradient(p.x - p.w / 2, p.y - p.h / 2, p.x + p.w / 2, p.y + p.h / 2);
            grad.addColorStop(0, '#60a5fa');
            grad.addColorStop(1, '#1e3a8a');
            clawCtx.fillStyle = grad;

            // Caixa com cantos arredondados
            clawCtx.beginPath();
            clawCtx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 8);
            clawCtx.fill();

            // Brilho superior tipo "Vidro" (Gloss effect)
            clawCtx.shadowColor = 'transparent';
            clawCtx.beginPath();
            clawCtx.roundRect(p.x - p.w / 2 + 2, p.y - p.h / 2 + 2, p.w - 4, p.h / 2, 6);
            const glassGrad = clawCtx.createLinearGradient(p.x, p.y - p.h / 2, p.x, p.y);
            glassGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
            glassGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
            clawCtx.fillStyle = glassGrad;
            clawCtx.fill();

            // Texto em Alto-relevo
            clawCtx.shadowColor = 'rgba(0,0,0,0.6)';
            clawCtx.shadowBlur = 4;
            clawCtx.shadowOffsetY = 2;
            clawCtx.fillStyle = 'white';
            clawCtx.font = '900 18px "Outfit", sans-serif';
            clawCtx.textAlign = 'center';
            clawCtx.textBaseline = 'middle';
            clawCtx.fillText("RF", p.x, p.y);

        } else {
            // Gradiente Radial da Esfera (RNF) simulando 3D puro
            const grad = clawCtx.createRadialGradient(p.x - p.w / 6, p.y - p.h / 6, p.w / 8, p.x, p.y, p.w / 2);
            grad.addColorStop(0, '#fdba74');
            grad.addColorStop(0.3, '#f97316');
            grad.addColorStop(1, '#9a3412');
            clawCtx.fillStyle = grad;

            // Esfera
            clawCtx.beginPath();
            clawCtx.arc(p.x, p.y, p.w / 2, 0, Math.PI * 2);
            clawCtx.fill();

            // Brilho especular (Specular Highlight ring)
            clawCtx.shadowColor = 'transparent';
            clawCtx.beginPath();
            clawCtx.arc(p.x - p.w / 8, p.y - p.h / 8, p.w / 3, 0, Math.PI * 2);
            const glassGrad2 = clawCtx.createRadialGradient(p.x - p.w / 8, p.y - p.h / 8, 1, p.x - p.w / 8, p.y - p.h / 8, p.w / 3);
            glassGrad2.addColorStop(0, 'rgba(255,255,255,0.5)');
            glassGrad2.addColorStop(1, 'rgba(255,255,255,0.0)');
            clawCtx.fillStyle = glassGrad2;
            clawCtx.fill();

            // Texto em Alto-relevo
            clawCtx.shadowColor = 'rgba(0,0,0,0.6)';
            clawCtx.shadowBlur = 4;
            clawCtx.shadowOffsetY = 2;
            clawCtx.fillStyle = 'white';
            clawCtx.font = '900 16px "Outfit", sans-serif';
            clawCtx.textAlign = 'center';
            clawCtx.textBaseline = 'middle';
            clawCtx.fillText("RNF", p.x, p.y);
        }
    });
}

document.getElementById('btn-tab-3d').addEventListener('click', () => {
    setTimeout(initClawMachine2D, 50);
});
