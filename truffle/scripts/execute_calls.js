const PongGameHistory = artifacts.require("PongGameHistory");

module.exports = async function(callback) {
    try {
        const instance = await PongGameHistory.deployed();

        // Capturar argumentos da linha de comando
        const args = process.argv.slice(4); // Os primeiros 4 argumentos são reservados pelo Node e Truffle
        const option = args[0];
        const id = args[1];

        if (!option || !id) {
            console.error("Por favor, forneça a opção ('p' para player ou 't' para tournament) e o ID como argumentos.");
            callback(new Error("Argumentos insuficientes"));
            return;
        }

        if (option === 'p') {
            // Chamar getGamesByPlayer
            const gamesByPlayer = await instance.getGamesByPlayer(id);
            console.log(`Jogos do jogador ${id}:`, gamesByPlayer);
        } else if (option === 't') {
            // Chamar getGamesByTournament
            const gamesByTournament = await instance.getGamesByTournament(id);
            console.log(`Jogos do torneio ${id}:`, gamesByTournament);
        } else {
            console.error("Opção inválida. Use 'p' para player ou 't' para tournament.");
            callback(new Error("Opção inválida"));
            return;
        }

        callback();
    } catch (error) {
        console.error(error);
        callback(error);
    }
};