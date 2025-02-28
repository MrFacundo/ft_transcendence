// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PongGameHistory {
    address public admin;

    struct Game {
        uint256 gameId;
		uint256 id;
        string channelGroupName;
        uint256 datePlayed;
        uint256 scorePlayer1;
        uint256 scorePlayer2;
        uint256 matchDate;
        string status;
        uint256 player1Id;
        uint256 player2Id;
        uint256 winnerId;
        uint256 tournamentId;
    }

    mapping(uint256 => Game) private games; // Mapeamento de jogos por ID
    mapping(uint256 => uint256[]) private tournamentGames; // Jogos por torneio
    mapping(uint256 => uint256[]) private playerGames; // Jogos por jogador
    uint256 private gameCount;

    event GameAdded(uint256 indexed gameId, uint256 id, uint256 tournamentId, uint256 player1Id, uint256 player2Id, uint256 winnerId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Apenas o administrador pode adicionar jogos");
        _;
    }

    constructor() {
        admin = msg.sender; // Define o deployer como administrador
    }

    function addGame(
		uint256 _id,
        string memory _channelGroupName,
        uint256 _datePlayed,
        uint256 _scorePlayer1,
        uint256 _scorePlayer2,
        uint256 _matchDate,
        string memory _status,
        uint256 _player1Id,
        uint256 _player2Id,
        uint256 _winnerId,
        uint256 _tournamentId
    ) public onlyAdmin {
        gameCount++;

        games[gameCount] = Game(
			gameCount,
            _id,
            _channelGroupName,
            _datePlayed,
            _scorePlayer1,
            _scorePlayer2,
            _matchDate,
            _status,
            _player1Id,
            _player2Id,
            _winnerId,
            _tournamentId
        );

        tournamentGames[_tournamentId].push(gameCount);
        playerGames[_player1Id].push(gameCount);
        playerGames[_player2Id].push(gameCount);
        if (_winnerId != 0) {
            playerGames[_winnerId].push(gameCount);
        }

        emit GameAdded(gameCount, _id, _tournamentId, _player1Id, _player2Id, _winnerId);
    }

    function getGame(uint256 _gameId) public view returns (
        uint256 gameId,
		uint256 id,
        string memory channelGroupName,
        uint256 datePlayed,
        uint256 scorePlayer1,
        uint256 scorePlayer2,
        uint256 matchDate,
        string memory status,
        uint256 player1Id,
        uint256 player2Id,
        uint256 winnerId,
        uint256 tournamentId
    ) {
        Game memory game = games[_gameId];
        return (
            game.gameId,
			game.id,
            game.channelGroupName,
            game.datePlayed,
            game.scorePlayer1,
            game.scorePlayer2,
            game.matchDate,
            game.status,
            game.player1Id,
            game.player2Id,
            game.winnerId,
            game.tournamentId
        );
    }
	
	function getGameCount() public view returns (uint256) {
        return gameCount;
    }
}