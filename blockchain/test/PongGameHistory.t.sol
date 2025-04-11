// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/PongGameHistory.sol";

contract PongGameHistoryTest is Test {
    PongGameHistory public gameHistory;
    address public admin;

    function setUp() public {
        admin = address(this); 
        gameHistory = new PongGameHistory();
    }

    function testInitialGameCountIsZero() public view {
        uint256 count = gameHistory.getGameCount();
        assertEq(count, 0, "Initial game count should be 0");
    }

    function testAddGameIncrementsGameCount() public {
        gameHistory.addGame(
            1,                  // _id 
            block.timestamp,    // _datePlayed
            10,                 // _scorePlayer1
            5,                  // _scorePlayer2
            "finished",         // _status
            101,                // _player1Id
            202,                // _player2Id
            101,                // _winnerId
            1                   // _tournamentId
        );

        uint256 count = gameHistory.getGameCount();
        assertEq(count, 1, "Game count should be 1 after adding a game");

        (uint256 gameId,, , uint256 s1, uint256 s2, , , , uint256 winnerId,) = gameHistory.getGame(1);
        assertEq(gameId, 1, "Game ID should be 1");
        assertEq(s1, 10, "Score Player 1 should be 10");
        assertEq(s2, 5, "Score Player 2 should be 5");
        assertEq(winnerId, 101, "Winner should be player 101");
    }

    function testGetGamesByPlayerReturnsCorrectLength() public {
        gameHistory.addGame(1, block.timestamp, 5, 3, "finished", 1, 2, 1, 1);
        gameHistory.addGame(2, block.timestamp, 2, 4, "finished", 1, 3, 3, 1);

        PongGameHistory.Game[] memory games = gameHistory.getGamesByPlayer(1);
        assertEq(games.length, 2, "Player 1 should have 2 games");
    }

    function testMaxPostgresIdUpdates() public {
        gameHistory.addGame(55, block.timestamp, 0, 0, "created", 1, 2, 0, 1);
        gameHistory.addGame(99, block.timestamp, 0, 0, "created", 1, 2, 0, 1);
        assertEq(gameHistory.getMaxPostgresId(), 99, "maxPostgresId should be 99");
    }
}
