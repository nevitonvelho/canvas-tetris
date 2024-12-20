// Carregando os arquivos de som
const pieceDropSound = new Audio('./sound/popSound.mp3'); //Som de peça colocada
const highScoreSound = new Audio('./sound/highScore.mp3'); //Som de maior pontuação
const clearLineSound = new Audio('./sound/clearLine.mp3'); //Som ao limpar uma linha
const gameOverSound = new Audio('./sound/gameOver.mp3'); //Som ao perder o jogo

// Música de fundo
const backgroundMusic = new Audio('./sound/background.mp3'); 
backgroundMusic.loop = true; // Define a música para tocar em loop
backgroundMusic.volume = 0.3; // Ajusta o volume (0.0 a 1.0)

var COLS = 10, ROWS = 20;
var board = [];
var lose;
var interval;
var intervalRender;
var current; // current moving shape
var currentX, currentY; // position of current shape
var freezed; // is current shape settled on the board?
var nextPiece; // Variavel para gerar a proxima peça
var score; // pontuação do jogador
var shapes = [
    [ 1, 1, 1, 1 ],
    [ 1, 1, 1, 0,
      1 ],
    [ 1, 1, 1, 0,
      0, 0, 1 ],
    [ 1, 1, 0, 0,
      1, 1 ],
    [ 1, 1, 0, 0,
      0, 1, 1 ],
    [ 0, 1, 1, 0,
      1, 1 ],
    [ 0, 1, 0, 0,
      1, 1, 1 ]
];
var colors = [
    'cyan', 'orange', 'blue', 'yellow', 'red', 'green', 'purple'
];

var isPaused = false; // Estado do jogo

// Função para alternar o estado de pausa
function togglePause() {
    if (isPaused) {
        interval = setInterval(tick, 400); 
        intervalRender = setInterval(render, 30); 
    } else {
        clearInterval(interval); 
        clearInterval(intervalRender); 
    }
    isPaused = !isPaused; 
}

// Adiciona botão de pausa à interface
var pauseButton = document.createElement('button');
pauseButton.innerText = 'Pausar';
pauseButton.className = 'pause-button';
document.body.appendChild(pauseButton);
pauseButton.addEventListener('click', togglePause);


function generateRandomPiece() {
    var id = Math.floor(Math.random() * shapes.length);
    var shape = shapes[id];
    return { shape: shape, id: id };
}

function newShape() {
    if (!nextPiece) {
        nextPiece = generateRandomPiece();
    }

    var id = nextPiece.id;
    var shape = nextPiece.shape;

    current = [];
    for (var y = 0; y < 4; ++y) {
        current[y] = [];
        for (var x = 0; x < 4; ++x) {
            var i = 4 * y + x;
            current[y][x] = shape[i] ? id + 1 : 0;
        }
    }

    nextPiece = generateRandomPiece();
    drawNextPiece();

    // Configura a posição inicial
    freezed = false;
    currentX = 4;
    currentY = 0;

    // Verifica se a peça inicial colide imediatamente (jogo perdido)
    if (!valid(0, 0)) {
        lose = true; // Sinaliza que o jogo foi perdido
        clearAllIntervals(); // Interrompe os loops
        gameOverSound.play(); // Som de game over
        document.getElementById('gameOverMessage').style.display = 'block';
        document.getElementById('playbutton').disabled = false;
    }
}


function drawNextPiece() {
    const canvas = document.getElementById('nextPieceCanvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    var shape = nextPiece.shape;
    var id = nextPiece.id;

    context.fillStyle = colors[id];
    for (var y = 0; y < 4; ++y) {
        for (var x = 0; x < 4; ++x) {
            var i = 4 * y + x;
            if (shape[i]) {
                context.fillRect(x * 20, y * 20, 20, 20);
            }
        }
    }
}

function init() {
    for (var y = 0; y < ROWS; ++y) {
        board[y] = [];
        for (var x = 0; x < COLS; ++x) {
            board[y][x] = 0;
        }
    }
    score = 0;
    updateScore();
}

function tick() {
    if (lose) return; // Não continua se o jogo foi perdido

    if (valid(0, 1)) {
        currentY++;
    } else {
        freeze();
        clearLines();
        if (lose) {
            gameOverSound.play();
            clearAllIntervals();
            document.getElementById('gameOverMessage').style.display = 'block';
            document.getElementById('playbutton').disabled = false;
            document.getElementById('finalScore').innerText = score;
            return;
        }
        newShape();
    }
}


// stop shape at its position and fix it to board
function freeze() {
    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( current[ y ][ x ] ) {
                board[ y + currentY ][ x + currentX ] = current[ y ][ x ];
            }
        }
    }
    pieceDropSound.play(); // Reproduz o som quando a peça é colocada em sua posição final
    freezed = true;
}

// returns rotates the rotated shape 'current' perpendicularly anticlockwise
function rotate( current ) {
    var newCurrent = [];
    for ( var y = 0; y < 4; ++y ) {
        newCurrent[ y ] = [];
        for ( var x = 0; x < 4; ++x ) {
            newCurrent[ y ][ x ] = current[ 3 - x ][ y ];
        }
    }

    return newCurrent;
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (isRowFilled(y)) {
            clearAndMoveLines(y);
            y++; // Reavalia a mesma linha após mover as superiores
            linesCleared++;
        }
    }

    if (linesCleared > 0) {
        score += linesCleared * 100; // Incrementa a pontuação baseada nas linhas limpas
        clearLineSound.play(); // Som ao limpar linhas
        updateScore();
    }
}


function clearAndMoveLines(lineIndex) {
    // Remove a linha completa
    for (let x = 0; x < COLS; x++) {
      board[lineIndex][x] = 0;
    }
    
    // Move todas as linhas acima para baixo
    for (let y = lineIndex; y > 0; y--) {
      for (let x = 0; x < COLS; x++) {
        board[y][x] = board[y - 1][x];
      }
    }
    
    // Preenche a linha de topo com zeros
    for (let x = 0; x < COLS; x++) {
      board[0][x] = 0;
    }
  }
  

function isRowFilled(y) {
    for (let x = 0; x < COLS; x++) {
        if (board[y][x] === 0) {
            return false; // Linha não está completa
        }
    }
    return true; // Linha está completa
}





// Verifica se a linha está preenchida
function isRowFilled(y) {
    for (let x = 0; x < COLS; x++) {
        if (board[y][x] === 0) {
            return false; // Linha não está completa
        }
    }
    return true; // Linha está completa
}



function moveLeft() {
    if (valid(-1)) {
        --currentX;
    }
}

function moveDown() {
    if (valid(0, 1)) {
        ++currentY;
    }
}

function keyPress(key) {
    switch (key) {
        case 'left':
            moveLeft();
            break;
        case 'right':
            if (valid(1)) {
                ++currentX;
            }
            break;
        case 'down':
            moveDown();
            break;
        case 'rotate':
            var rotated = rotate(current);
            if (valid(0, 0, rotated)) {
                current = rotated;
            }
            break;
        case 'drop':
            while (valid(0, 1)) {
                ++currentY;
            }
            tick();
            break;
    }
}


// checks if the resulting position of current shape will be feasible
function valid(offsetX = 0, offsetY = 0, newCurrent = current) {
    const newX = currentX + offsetX;
    const newY = currentY + offsetY;

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (newCurrent[y][x]) {
                if (
                    typeof board[newY + y] === 'undefined' || // Fora dos limites verticais
                    typeof board[newY + y][newX + x] === 'undefined' || // Fora dos limites horizontais
                    board[newY + y][newX + x] || // Posição já ocupada
                    newX + x < 0 || // Fora do lado esquerdo
                    newX + x >= COLS || // Fora do lado direito
                    newY + y >= ROWS // Fora da parte inferior
                ) {
                    // Perda ocorre quando não é possível descer e a peça está no topo
                    if (offsetY === 1 && freezed) {
                        lose = true;
                        return false;
                    }
                    return false;
                }
            }
        }
    }
    return true;
}


function playButtonClicked() {
    document.getElementById('gameOverMessage').style.display = 'none';//
    newGame();//
    document.getElementById("playbutton").disabled = true;//
}

function newGame() {
    clearAllIntervals();
    intervalRender = setInterval( render, 30 );
    init();
    newShape();
    lose = false;
    interval = setInterval( tick, 400 );
    backgroundMusic.play(); // Inicia a música de fundo
}

function clearAllIntervals(){
    clearInterval( interval );
    clearInterval( intervalRender );
    backgroundMusic.pause(); // Pausa a música de fundo
    backgroundMusic.currentTime = 0; // Reinicia a música ao início
}

function updateScore() {
    document.getElementById('score').innerText = score;
}

function loadHighScore() {
    let savedHighScore = localStorage.getItem('highscore');
    if (savedHighScore !== null) {
        highscore = parseInt(savedHighScore);
    } else {
        highscore = 0;
    }
    document.getElementById('highscore').innerText = highscore;
}

function saveHighScore() {
    localStorage.setItem('highscore', highscore);
}

function updateHighScore() {
    if (score > highscore) {
        highscore = score;
        document.getElementById('highscore').innerText = highscore;
        saveHighScore();
        
        // Atrasa o som de maior pontuação em 1 segundo (1000ms) para que não toque ao mesmo tempo que o som de game over
        setTimeout(() => {
            highScoreSound.play();
        }, 1000);
    } else {
        document.getElementById('highscore').innerText = highscore;
    }
}

window.onload = function() {
    loadHighScore();
}

function toggleTutorial() {
    var tutorialMessage = document.getElementById('tutorialMessage');
    var displayStyle = tutorialMessage.style.display;
    if (displayStyle === 'none') {
        tutorialMessage.style.display = 'block';
        document.getElementById('playbutton').disabled = true;
    } else {
        tutorialMessage.style.display = 'none';
        document.getElementById('playbutton').disabled = false;
    }
};

//Controla a execução da música de fundo
function toggleMusic() {
    const button = document.getElementById('toggleMusic');
    if (backgroundMusic.paused) {
        backgroundMusic.play();
        button.innerText = 'Música: Ligada';
    } else {
        backgroundMusic.pause();
        button.innerText = 'Música: Desligada';
    }
}
