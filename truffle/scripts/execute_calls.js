const PongGameHistory = artifacts.require("PongGameHistory");

module.exports = async function(callback) {
    try {
        const instance = await PongGameHistory.deployed();

        //  Capture command-line arguments
        const args = process.argv.slice(4); // The first 4 arguments are reserved by Node and Truffle
        const option = args[0];
        const id = args[1];

        if (!option || !id) {
            console.error("Please provide the option ('p' for player or 't' for tournament) and the ID as arguments.");
            callback(new Error("Insufficient arguments"));
            return;
        }

        if (option === 'p') {
            // Chamar getGamesByPlayer
            const gamesByPlayer = await instance.getGamesByPlayer(id);
            console.log(`Player's games ${id}:`, gamesByPlayer);
        } else if (option === 't') {
            // Chamar getGamesByTournament
            const gamesByTournament = await instance.getGamesByTournament(id);
            console.log(`Tournament games ${id}:`, gamesByTournament);
        } else {
            console.error("Invalid option. Use 'p' for player or 't' for tournament.");
            callback(new Error("Invalid option"));
            return;
        }

        callback();
    } catch (error) {
        console.error(error);
        callback(error);
    }
};