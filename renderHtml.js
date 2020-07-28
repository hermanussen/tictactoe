const fs = require('graceful-fs');
const mustache = require('mustache');
const calculateGames = require('./calculateGames');

let games = calculateGames.getGames();

// Copy images to dist folder
const imgDistPath = 'dist/img';
if (!fs.existsSync(imgDistPath)){
    fs.mkdirSync(imgDistPath, { recursive: true });
}
fs.copyFile('img/_.png', 'dist/img/_.png', () => {});
fs.copyFile('img/o.png', 'dist/img/o.png', () => {});
fs.copyFile('img/x.png', 'dist/img/x.png', () => {});

// Load template for rendering html files
const template = fs.readFileSync('index.mustache', 'utf8');

const renderedReadmeCodes = [];

const renderedInMemory = [];

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
                    [ { fill: '_', link: `${readmePathRel}/1/` }, { fill: '_', link: `${readmePathRel}/2/` }, { fill: '_', link: `${readmePathRel}/3/` } ],
                    [ { fill: '_', link: `${readmePathRel}/4/` }, { fill: '_', link: `${readmePathRel}/5/` }, { fill: '_', link: `${readmePathRel}/6/` } ],
                    [ { fill: '_', link: `${readmePathRel}/7/` }, { fill: '_', link: `${readmePathRel}/8/` }, { fill: '_', link: `${readmePathRel}/9/` } ]
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
            const draw = gamesFromHereDraw > 0 ? 1 : 0;

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
                    draw: draw,
                    squares: squares
                };

            if(model.winner) {
                model.replayImage = `/${gameCodeArr.join('/')}/game.gif`;
            }

            const rendered = mustache.render(template, model);

            renderedInMemory.push({
                    fileName: outputFileName,
                    html: rendered
                });
        }
    }
}

const gamesTotal = games.length;

for(let i = 0; i < gamesTotal; i++) {
    //if(i > 500) break;
    if(i % 100 === 0) {
        console.log(`Rendering readme for game ${i + 1} of ${gamesTotal} (${Math.round(i / gamesTotal * 100)}%)... ${games[i].codeStr}`);
    }
    renderReadme(games[i]);
}

for(let i = 0; i < renderedInMemory.length; i++) {
    if(i % 100 === 0) {
        console.log(`Writing file for game ${i + 1} of ${renderedInMemory.length} (${Math.round(i / renderedInMemory.length * 100)}%)... ${renderedInMemory[i].fileName}`);
    }
    fs.writeFileSync(
        renderedInMemory[i].fileName,
        renderedInMemory[i].html);
}