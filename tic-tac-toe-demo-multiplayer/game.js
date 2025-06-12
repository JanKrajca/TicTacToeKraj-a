// Vytvoření WebSocket připojení na server na localhost:8080
let socket = new WebSocket("ws://localhost:8080");

// Symbol, který hráč používá (X nebo O), zatím neznámý
let mySymbol = null;

// Jestli je hra aktivní a hráč může tahat
let gameActive = true;

// Aktuální hráč, který má tahat - výchozí 'X'
let currentPlayer = 'X';

// Pole 9 prvků reprezentující herní desku, všechny pozice jsou null (prázdné)
let board = Array(9).fill(null);

// Stav, zda čekáme na potvrzení restartu od soupeře
let waitingForRestartConfirm = false;

// Funkce pro multiplayer logiku, přijímá elementy pro status a pole herních políček
const multiplayer = (status, boxes) => {
    // Když se WebSocket otevře, zobrazíme status čekání na soupeře
    socket.onopen = () => {
        status.textContent = 'Waiting for opponent...';
    };

    // Když přijde zpráva ze serveru
    socket.onmessage = function (event) {
        // Uložení přijaté zprávy do proměnné data
        let data = event.data;

        // Pokud server říká, že začínáš jako X
        if (data === 'start:X') {
            mySymbol = 'X'; // Nastav symbol na X
            currentPlayer = 'X'; // Nastav, že hráč X začíná
            status.textContent = 'You are X. Your turn.'; // Informace v UI
            gameActive = true; // Hra aktivní, můžeš hrát
        }
        // Pokud server říká, že začínáš jako O
        else if (data === 'start:O') {
            mySymbol = 'O'; // Nastav symbol na O
            currentPlayer = 'X'; // Hráč X vždy začíná
            status.textContent = 'You are O. Waiting for opponent\'s move.'; // Čekáš na soupeře
            gameActive = false; // Nejsi na tahu, hra neaktivní pro tebe
        }
        // Když soupeř požádá o restart hry
        else if (data === 'requestRestart') {
            // Pro jednoduchost zobraz alert o požadavku restartu
            alert('Opponent wants to restart and switch sides. Restarting game now.');

            // Pošli soupeři potvrzení restartu
            socket.send('confirmRestart');

            // Prohoď symbol (X -> O, O -> X)
            mySymbol = dataNewSymbol(mySymbol);

            // Resetuj hru se symbolem, který máš po prohození
            resetGame(mySymbol);

            // Nastav status na nový začátek hry
            status.textContent = `New game started! You are ${mySymbol}. ${mySymbol === 'X' ? 'Your turn.' : 'Waiting for opponent\'s move.'}`;
        }
        // Když soupeř potvrdí restart hry
        else if (data === 'confirmRestart') {
            waitingForRestartConfirm = false; // Už nečekáš na potvrzení

            // Prohoď symbol, protože se role mění
            mySymbol = dataNewSymbol(mySymbol);

            // Resetuj hru podle nového symbolu
            resetGame(mySymbol);

            // Zobraz nový status s aktuálním symbolem a tím, kdo začíná
            status.textContent = `Restart confirmed. You are now ${mySymbol}. ${mySymbol === 'X' ? 'Your turn.' : 'Waiting for opponent\'s move.'}`;
        }
        // Když soupeř zamítne restart
        else if (data === 'denyRestart') {
            waitingForRestartConfirm = false; // Už nečekáš na odpověď

            // Zobraz alert, že restart byl zamítnut
            alert('Opponent denied to restart the game.');
        }
        // Pokud přišla zpráva s číslem - tah soupeře
        else if (!isNaN(data)) {
            const i = Number(data); // Převod zprávy na číslo (index políčka)

            // Pokud není políčko již obsazeno
            if (!board[i]) {
                // Ulož tah soupeře - pokud mám symbol X, soupeř je O a naopak
                board[i] = (mySymbol === 'X') ? 'O' : 'X';

                // Přidej do políčka příslušnou třídu pro vykreslení křížku nebo kolečka
                boxes[i].classList.add(board[i] === 'X' ? 'cross' : 'circle');

                // Zkontroluj, jestli někdo nevyhrál
                const winner = checkWinner();

                if (winner) {
                    // Pokud někdo vyhrál, zobraz to v statusu
                    status.textContent = `Winner: ${winner}`;
                    gameActive = false; // Hra končí, vypni tahání
                    return; // Ukonči další zpracování
                }

                // Pokud je hra remíza (všechna políčka obsazena)
                if (checkDraw()) {
                    status.textContent = 'Draw!';
                    gameActive = false; // Hra končí
                    return;
                }

                // Nyní jsi na tahu ty
                currentPlayer = mySymbol;
                gameActive = true; // Hra aktivní pro tebe

                // Aktualizuj status, že je tvůj tah
                status.textContent = `Your turn! ${mySymbol}`;
            }
        }
    };
};

// Funkce pro prohození symbolu - pokud jsi byl X, budeš O, a naopak
const dataNewSymbol = (oldSymbol) => oldSymbol === 'X' ? 'O' : 'X';

// Funkce na reset hry: nastaví proměnné a vyčistí UI
const resetGame = (newSymbol) => {
    currentPlayer = 'X'; // Vždy začíná X
    gameActive = (newSymbol === 'X'); // Aktivuj hru jen pokud jsi X (začínáš)
    board = Array(9).fill(null); // Vyčisti pole hry (vše null)
    mySymbol = newSymbol; // Aktualizuj svůj symbol

    // Vyber všechny políčka a smaž jejich symboly
    const boxes = document.getElementsByClassName('box');
    for (const box of boxes) {
        box.classList.remove('circle', 'cross');
    }
};

// Funkce na kontrolu výhry - vrátí symbol vítěze nebo null
const checkWinner = () => {
    // Všechny možné vítězné kombinace indexů políček
    const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // řádky
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // sloupce
        [0, 4, 8], [2, 4, 6]             // diagonály
    ];

    // Pro každou vítěznou kombinaci zkontroluj, jestli jsou stejné symboly
    for (const combo of winCombos) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Vrátí vítězný symbol
        }
    }
    return null; // Žádný vítěz
};

// Funkce na kontrolu remízy (všechna políčka obsazena)
const checkDraw = () => board.every(cell => cell !== null);

// Kód, který se spustí po načtení dokumentu
document.addEventListener('DOMContentLoaded', () => {
    const status = document.querySelector('.status'); // Element pro stav hry
    const reset = document.querySelector('.reset');   // Tlačítko nová hra
    const boxes = document.getElementsByClassName('box'); // Pole políček

    multiplayer(status, boxes); // Spustí multiplayer logiku

    // Přidej posluchač kliknutí na každé políčko
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].addEventListener('click', () => {
            // Pokud hra není aktivní, políčko je obsazené nebo nejsi na tahu, nic nedělej
            if (!gameActive || board[i] || mySymbol !== currentPlayer) return;

            // Ulož svůj tah do pole
            board[i] = currentPlayer;

            // Přidej třídu pro vykreslení symbolu na políčko
            boxes[i].classList.add(currentPlayer === 'X' ? 'cross' : 'circle');

            // Pošli tah soupeři přes WebSocket
            socket.send(i);

            // Zkontroluj, jestli někdo nevyhrál
            const winner = checkWinner();
            if (winner) {
                status.textContent = `Winner: ${winner}`; // Zobraz vítěze
                gameActive = false; // Hra končí
                return;
            }

            // Zkontroluj remízu
            if (checkDraw()) {
                status.textContent = 'Draw!'; // Zobraz remízu
                gameActive = false; // Hra končí
                return;
            }

            // Po tvém tahu čekáš na soupeře
            status.textContent = `Waiting for opponent's move...`;
            gameActive = false; // Zakáže tahání pro tebe do doby, než soupeř hraje
        });
    }

    // Posluchač na tlačítko nová hra
    reset.addEventListener('click', () => {
        // Pokud už čekáš na potvrzení restartu, ukaž info a nic nedělej
        if (waitingForRestartConfirm) {
            alert('Waiting for opponent confirmation...');
            return;
        }

        // Nastav stav, že čekáš na potvrzení restartu
        waitingForRestartConfirm = true;

        // Pošli soupeři požadavek na restart hry
        socket.send('requestRestart');

        // Změň status na čekání potvrzení restartu
        status.textContent = 'Waiting for opponent to confirm restart...';
    });
});

//npx serve .