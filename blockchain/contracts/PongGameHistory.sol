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

    mapping(uint256 => Game) private games; // Mapping of games by ID
    mapping(uint256 => uint256[]) private tournamentGames; // Games by tournament
    mapping(uint256 => mapping(uint256 => bool)) private playerGameExists; // Check if game exists for player
    mapping(uint256 => uint256[]) private playerGames; // Games by player
    uint256 private gameCount;
	uint256 private maxPostgresId;

    event GameAdded(uint256 indexed gameId, uint256 id, uint256 tournamentId, uint256 player1Id, uint256 player2Id, uint256 winnerId);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only the administrator can add games");
        _;
    }

    constructor() {
        admin = msg.sender; // Sets the deployer as the administrator
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

		if (_id > maxPostgresId) {
        maxPostgresId = _id;
		}

        tournamentGames[_tournamentId].push(gameCount);

        if (!playerGameExists[_player1Id][gameCount]) {
            playerGames[_player1Id].push(gameCount);
            playerGameExists[_player1Id][gameCount] = true;
        }

        if (!playerGameExists[_player2Id][gameCount]) {
            playerGames[_player2Id].push(gameCount);
            playerGameExists[_player2Id][gameCount] = true;
        }

        if (_winnerId != 0 && !playerGameExists[_winnerId][gameCount]) {
            playerGames[_winnerId].push(gameCount);
            playerGameExists[_winnerId][gameCount] = true;
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

    function getGamesByPlayer(uint256 _playerId) public view returns (Game[] memory) {
        uint256[] memory gameIds = playerGames[_playerId];
        Game[] memory playerGamesList = new Game[](gameIds.length);
        for (uint256 i = 0; i < gameIds.length; i++) {
            playerGamesList[i] = games[gameIds[i]];
        }
        return playerGamesList;
    }

    function getGamesByTournament(uint256 _tournamentId) public view returns (Game[] memory) {
        uint256[] memory gameIds = tournamentGames[_tournamentId];
        Game[] memory tournamentGamesList = new Game[](gameIds.length);
        for (uint256 i = 0; i < gameIds.length; i++) {
            tournamentGamesList[i] = games[gameIds[i]];
        }
        return tournamentGamesList;
    }

    function getPlayerGames(uint256 _playerId) public view returns (uint256[] memory) {
        return playerGames[_playerId];
    }

    function getGameCount() public view returns (uint256) {
        return gameCount;
    }
	
	function getMaxPostgresId() public view returns (uint256) {
    return maxPostgresId;
	}
}