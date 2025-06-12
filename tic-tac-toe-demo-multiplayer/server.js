// Načteme knihovnu WebSocket pro Node.js
const WebSocket = require('ws');

// Vytvoříme WebSocket server na portu 8080
const webSocketServer = new WebSocket.Server({ port: 8080 });

// Pole, kde budeme držet připojené hráče (max 2)
let players = [];

// Info do konzole, že server startuje
console.info("Server started\n--------------\n");

// Při novém připojení klienta
webSocketServer.on('connection', webSocket => {
    // Pokud je už připojeno 2 hráčů, další nepřipustíme
    if (players.length >= 2) {
        console.log("More than 2 users not allowed!"); // Info do konzole
        webSocket.close(); // Zavřeme připojení
        return; // Ukončíme handler
    }

    // Přidáme nového hráče do pole a vypíšeme info do konzole
    console.log(`User ${players.length + 1} connected`);
    players.push(webSocket);

    // Když jsou připojeni 2 hráči, začneme hru
    if (players.length === 2) {
        console.log("\nBoth users connected\nGame starting\n--------------------");

        // Pošleme prvnímu hráči zprávu, že je X a začíná
        players[0].send('start:X');

        // Pošleme druhému hráči zprávu, že je O a čeká
        players[1].send('start:O');
    }

    // Když přijde zpráva od hráče
    webSocket.on('message', message => {
        // Převod zprávy na string
        const msg = message.toString();

        // Vypíšeme zprávu do konzole
        console.log(`WS message: ${msg}`);

        // Pokud zpráva je požadavek na restart hry
        if (msg === 'requestRestart') {
            // Pošleme všem ostatním hráčům, že někdo chce restart
            players.forEach(client => {
                if (client !== webSocket && client.readyState === WebSocket.OPEN) {
                    client.send('requestRestart');
                }
            });
            return; // Ukončíme další zpracování
        }

        // Pokud je potvrzení restartu
        if (msg === 'confirmRestart') {
            // Pošleme všem hráčům potvrzení restartu
            players.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('confirmRestart');
                }
            });
            return; // Ukončíme další zpracování
        }

        // Pokud je zamítnutí restartu
        if (msg === 'denyRestart') {
            // Pošleme tomu, kdo požádal o restart, že byl zamítnut
            players.forEach(client => {
                if (client !== webSocket && client.readyState === WebSocket.OPEN) {
                    client.send('denyRestart');
                }
            });
            return; // Ukončíme další zpracování
        }

        // Všechny ostatní zprávy (tahy) přepošleme druhému hráči
        players.forEach(client => {
            if (client !== webSocket && client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        });
    });

    // Když se hráč odpojí
    webSocket.on('close', () => {
        console.log("User disconnected"); // Info do konzole
        // Odstraníme odpojeného hráče z pole players
        players = players.filter(client => client !== webSocket);
    });
});
