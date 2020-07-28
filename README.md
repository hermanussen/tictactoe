# Tic Tac Toe

![renderHtml](https://github.com/hermanussen/tictactoe/workflows/renderHtml/badge.svg) ![renderGifs](https://github.com/hermanussen/tictactoe/workflows/renderGifs/badge.svg)

## What is it?

- This is a node application that renders all possible games of Tic Tac Toe as static HTML pages, as well as a node application that renders animated gifs for all possible games.
- For every move, you can see the odds of the outcomes (based on random play).
- At the end of each game, you can see an animated gif that shows the game as a replay.

## How does it work?

GitHub actions are setup to run the node applications that render all the pages and images. The result is then uploaded to a Azure storage account that acts as a static website.

## Why?

I wanted to see how far I could take this and have a little fun with the technology (Node, GitHub actions, Azure, ...). You can see the result here: https://robinhstorage.z6.web.core.windows.net/

## Can I run this locally?

Sure. Just run `node ./renderHtml.js` and `node ./renderGifs.js`. Or use the Docker setup by running `docker-compose up --build` (runs a nginx webserver with the result). Please note that it will take very long to run these applications.