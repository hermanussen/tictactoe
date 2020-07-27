const GIFEncoder = require('gifencoder');
const { registerFont, createCanvas } = require('canvas')
const fs = require('fs');
const width = 100;
const height = 100;
const calculateGames = require('./calculateGames');

let games = calculateGames.getGames();

// Ensure that the font is available
registerFont("TerminusBold.ttf", { family: 'Terminus' });

// Helper function for following progress on Promise.all
function allProgress(proms, progress_cb) {
    let d = 0;
    progress_cb(0);
    for (const p of proms) {
        p.then(()=> {    
            d++;
            progress_cb( d );
        });
    }

    return Promise.all(proms);
}

let renderGameGif = function (game) {
    return new Promise(function(resolve, reject) {
        setTimeout(() => {
            const encoder = new GIFEncoder(width, height);

            // Ensure that the dist directory exists
            const gamePath = `dist/${game.code.join('/')}`;
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
            ctx.font = '22px Terminus';
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
    
            //console.log(`Rendered gif for ${game.code.join('')}`);
            resolve();
        }, 1000);
    });
};

const gamesTotal = games.length;
const gamesWonX = games.filter(g => g.winner === 1).length;
const gamesWonO = games.filter(g => g.winner === 0).length;
const gamesDraw = gamesTotal - gamesWonX - gamesWonO;

console.log(`Total games: ${gamesTotal}. Won by X: ${gamesWonX} (${Math.round(gamesWonX / gamesTotal * 100)}%). Won by O: ${gamesWonO} (${Math.round(gamesWonO / gamesTotal * 100)}%). Games drawn: ${gamesDraw} (${Math.round(gamesDraw / gamesTotal * 100)}%)`);

console.log("Rendering all gifs...");
let gPromises = games.map((g) => renderGameGif(g)); // .slice(0, 200)
allProgress(
    gPromises,
    (p) => {
        if(p % 100 === 0) {
            console.log(`${Math.floor(p)} of ${gPromises.length} (${Math.floor(p / gPromises.length * 100)}%) gif rendering finished`);
        }
    })
    .then(() => {
        console.log("Finished rendering gifs...");
    });