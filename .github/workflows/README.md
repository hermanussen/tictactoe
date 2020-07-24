# Tic Tac Toe

## What is it?

- This is a node application that renders all possible games of Tic Tac Toe as static HTML pages.
- For every move, you can see the odds of the outcomes (based on random play).
- At the end of each game, you can see an animated gif that shows the game as a replay.

## How does it work?

A GitHub action is setup to run the node application that renders all the pages and images. The result is then uploaded to a Azure storage account that acts as a static website.

## Why?

I wanted to see how far I could take this and have a little fun with the technology (Node, GitHub actions, Azure, ...). You can see the result here: https://robinhstorage.z6.web.core.windows.net/