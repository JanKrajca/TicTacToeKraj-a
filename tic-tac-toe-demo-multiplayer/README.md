# In short: How to do web multiplayer

1. **Small server:** At the simplest level, a simple server that can forward moves between two players is sufficient.
2. **Communication:** Clients (browsers) communicate with the server
   via [WebSocket](https://developer.mozilla.org/cs/docs/Web/API/WebSockets_API) to send/listen to moves in real time.
3. **Two-player game:** One "creates" the game, the other connects. Each can see the other's moves.

## Instalace

1. Clone repo
2. Install dependencies - `npm install`

## Start serveru

1. `node server.js`
2. Zapnout [index.html](index.html) ve 2 oknech prohlížeče
