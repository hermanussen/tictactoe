const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
const fs = require('fs');
const width = 100;
const height = 100;

const winningLines = [
        // horizontals
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        // verticals
        [1, 4, 7],
        [2, 5, 8],
        [3, 6, 9],
        // diagonals
        [1, 5, 9],
        [3, 5, 7]
    ];

let determineWinner = function(game) {
    if(game.code.length < 3) {
        return;
    }

    let playerMove = game.code.length % 2;
    let moves = game.code.filter(function(c, f) { return f % 2 !== playerMove });

    let gameFinished = winningLines.filter(function(c) { 
            return c.every((val) => moves.includes(val));
        }).length > 0;

    if(gameFinished) {
        game.winner = playerMove;
        //console.log(`Game ${game.code.join('')} won by ${game.winner}`);
    }
};

let games = [];

let calculateNextMoves = function(game) {
    // Temporary: limit number of games so the build is not too long
    if(games.length >= 100) {
        return;
    }

    for(let m1 = 1; m1 <= 9; m1++) {
        if(game.code.filter(f => f === m1).length > 0) {
            // if the move has already been played, skip this
            continue;
        }

        let newGame = JSON.parse(JSON.stringify(game));
        newGame.code.push(m1);
        determineWinner(newGame);
        if (typeof newGame.winner !== 'undefined' || newGame.code.length >= 9) {
            games.push(newGame);
        } else {
            calculateNextMoves(newGame);
        }
    }
}

let game = { code: [] };
calculateNextMoves(game);

let renderGameGif = function (game) {
    
    const encoder = new GIFEncoder(width, height);

    // Ensure that the games directory exists
    const gamePath = `games/${game.code.join('/')}`;
    if (!fs.existsSync(gamePath)){
        fs.mkdirSync(gamePath, { recursive: true });
    }

    let outputFileName = `${gamePath}/game.gif`;
    encoder.createReadStream().pipe(fs.createWriteStream(outputFileName));

    encoder.start();
    encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
    encoder.setDelay(500);  // frame delay in ms
    encoder.setQuality(10); // image quality. 10 is default.

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.moveTo(0, height / 3 * 2);
    ctx.lineTo(width, height / 3 * 2);
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.moveTo(width / 3 * 2, 0);
    ctx.lineTo(width / 3 * 2, height);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Draw the game moves
    for(let i = 0; i < game.code.length; i++) {
        let dx = (game.code[i] - 1) % 3 * (width / 3);
        let dy = Math.floor((game.code[i] - 1) / 3) * (height / 3);
        //console.log(`Fill ${game.code[i]} at x=${dx} and y= ${dy}`);
        if(i % 2 == 0) {
            ctx.strokeStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(dx, dy);
            ctx.lineTo(dx + (width / 3), dy + (height / 3));
            ctx.moveTo(dx + (width / 3), dy);
            ctx.lineTo(dx, dy + (height / 3));
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#0000ff';
            ctx.beginPath();
            ctx.arc(dx + (width / 6), dy + (height / 6), width / 6, 0, 2 * Math.PI);
            ctx.stroke(); 
        }

        encoder.addFrame(ctx);
    }

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw who won
    ctx.font = '22px Arial, Helvetica';
    ctx.textAlign = "center";
    ctx.fillStyle = '#000000';
    if(typeof game.winner !== 'undefined') {
        // Someone won
        ctx.fillText(`${game.winner == 0 ? 'O' : 'X'} WON`, width / 2, height / 2);
    } else {
        // It's a draw
        ctx.fillText('DRAW', width / 2, height / 2);
    }

    encoder.addFrame(ctx);

    encoder.finish();
};

const gamesTotal = games.length;
const gamesWonX = games.filter(g => g.winner === 1).length;
const gamesWonO = games.filter(g => g.winner === 0).length;
const gamesDraw = gamesTotal - gamesWonX - gamesWonO;

console.log(`Total games: ${gamesTotal}. Won by X: ${gamesWonX} (${Math.round(gamesWonX / gamesTotal * 100)}%). Won by O: ${gamesWonO} (${Math.round(gamesWonO / gamesTotal * 100)}%). Games drawn: ${gamesDraw} (${Math.round(gamesDraw / gamesTotal * 100)}%)`);

for(let i = 0; i < gamesTotal; i++) {
    if(i % 10 === 0) {
        console.log(`Rendering gif for game ${i + 1} of ${gamesTotal}... ${games[i].code.join('')}`);
    }
    renderGameGif(games[i]);
}