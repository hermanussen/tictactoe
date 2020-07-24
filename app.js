const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
const fs = require('graceful-fs');
const mustache = require('mustache');
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

// Load template for rendering html files
const template = fs.readFileSync('index.mustache', 'utf8');

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
        //console.log(`Game ${game.codeStr} won by ${game.winner}`);
    }
};

let games = [];

let calculateNextMoves = function(game) {
    for(let m1 = 1; m1 <= 9; m1++) {
        if(game.code.filter(f => f === m1).length > 0) {
            // if the move has already been played, skip this
            continue;
        }

        let newGame = JSON.parse(JSON.stringify(game));
        newGame.code.push(m1);
        newGame.codeStr = newGame.code.join('');
        determineWinner(newGame);
        if (typeof newGame.winner !== 'undefined' || newGame.code.length >= 9) {
            games.push(newGame);
        } else {
            calculateNextMoves(newGame);
        }
    }
}

let game = { code: [], codeStr: '' };
calculateNextMoves(game);

let renderGameGif = function (game) {
    
    const encoder = new GIFEncoder(width, height);

    // Ensure that the dist directory exists
    const gamePath = `dist/${game.code.join('/')}`;
    if (!fs.existsSync(gamePath)){
        fs.mkdirSync(gamePath, { recursive: true });
    }

    let outputFileName = `${gamePath}/game.gif`;
    let readStream = encoder.createReadStream();
    let writeStream = fs.createWriteStream(outputFileName);
    readStream.pipe(writeStream);

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
    for(let rs in encoder.readStreams) {
        rs.close();
    }
    writeStream.close();
};

const gamesTotal = games.length;
const gamesWonX = games.filter(g => g.winner === 1).length;
const gamesWonO = games.filter(g => g.winner === 0).length;
const gamesDraw = gamesTotal - gamesWonX - gamesWonO;

console.log(`Total games: ${gamesTotal}. Won by X: ${gamesWonX} (${Math.round(gamesWonX / gamesTotal * 100)}%). Won by O: ${gamesWonO} (${Math.round(gamesWonO / gamesTotal * 100)}%). Games drawn: ${gamesDraw} (${Math.round(gamesDraw / gamesTotal * 100)}%)`);

for(let i = 0; i < gamesTotal; i++) {
    if (i > 200)
    {
        break;
    }
    if(i % 100 === 0) {
        console.log(`Rendering gif for game ${i + 1} of ${gamesTotal} (${Math.round(i / gamesTotal * 100)}%)... ${games[i].codeStr}`);
    }
    renderGameGif(games[i]);
}

const renderedReadmeCodes = [];

let renderReadme = function(game) {
    for(let j = 0; j <= game.code.length; j++) {
        let gameCodeArr = game.code.slice(0, j);
        let gameCode = gameCodeArr.join('');
        if(renderedReadmeCodes.filter(f => f === gameCode).length === 0) {
            renderedReadmeCodes.push(gameCode);

            const readmePathRel = gameCodeArr.length > 0 ? `/${gameCodeArr.join('/')}` : '';
            const readmePath = `dist${readmePathRel}`;
            if (!fs.existsSync(readmePath)){
                fs.mkdirSync(readmePath, { recursive: true });
            }

            let outputFileName = `${readmePath}/index.html`.replace('//', '/');

            let squares = [
                    [ { fill: '_', link: `${readmePathRel}/1/index.html` }, { fill: '_', link: `${readmePathRel}/2/index.html` }, { fill: '_', link: `${readmePathRel}/3/index.html` } ],
                    [ { fill: '_', link: `${readmePathRel}/4/index.html` }, { fill: '_', link: `${readmePathRel}/5/index.html` }, { fill: '_', link: `${readmePathRel}/6/index.html` } ],
                    [ { fill: '_', link: `${readmePathRel}/7/index.html` }, { fill: '_', link: `${readmePathRel}/8/index.html` }, { fill: '_', link: `${readmePathRel}/9/index.html` } ]
                ];
            for(let gc = 0; gc < gameCodeArr.length; gc++) {        
                let dx = (gameCodeArr[gc] - 1) % 3;
                let dy = Math.floor((gameCodeArr[gc] - 1) / 3);
                squares[dy][dx].fill = (gc % 2 == 0) ? 'x' : 'o';
                squares[dy][dx].link = null;
            }

            const gamesFromHere = games.filter(g => g.codeStr.startsWith(gameCode));
            const gamesFromHereTotal = gamesFromHere.length;
            const gamesFromHereWonX = gamesFromHere.filter(g => g.winner === 1).length;
            const gamesFromHereWonO = gamesFromHere.filter(g => g.winner === 0).length;
            const gamesFromHereDraw = gamesFromHereTotal - gamesFromHereWonX - gamesFromHereWonO;

            const winner = j === game.code.length ? (gameCodeArr.length % 2 == 0 ? 'O' : 'X') : undefined;

            let model = {
                    gamesTotal: gamesFromHereTotal,
                    gamesWonX: gamesFromHereWonX,
                    gamesWonXPerc: Math.round(gamesFromHereWonX / gamesFromHereTotal * 100),
                    gamesWonO: gamesFromHereWonO,
                    gamesWonOPerc: Math.round(gamesFromHereWonO / gamesFromHereTotal * 100),
                    gamesDraw: gamesFromHereDraw,
                    gamesDrawPerc: Math.round(gamesFromHereDraw / gamesFromHereTotal * 100),
                    playerTurn: gameCodeArr.length % 2 == 0 ? 'X' : 'O',
                    winner: winner,
                    squares: squares
                };

            if(model.winner) {
                model.replayImage = `/${gameCodeArr.join('/')}/game.gif`;
            }

            const rendered = mustache.render(template, model);

            fs.writeFileSync(outputFileName, rendered);
        }
    }
}

for(let i = 0; i < gamesTotal; i++) {
    if(i % 100 === 0) {
        console.log(`Rendering readme for game ${i + 1} of ${gamesTotal} (${Math.round(i / gamesTotal * 100)}%)... ${games[i].codeStr}`);
    }
    renderReadme(games[i]);
}
