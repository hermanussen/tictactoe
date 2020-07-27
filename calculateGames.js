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
        //console.log(`Game ${game.codeStr} won by ${game.winner}`);
    }
};

let calculateNextMoves = function(games, game) {
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
            calculateNextMoves(games, newGame);
        }
    }
}

exports.getGames = () => {
    let games = [];
    let game = { code: [], codeStr: '' };
    calculateNextMoves(games, game);
    return games;
};