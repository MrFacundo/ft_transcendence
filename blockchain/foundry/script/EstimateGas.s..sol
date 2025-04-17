// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/PongGameHistory.sol";

contract EstimateGasScript is Script {
    function run() external {

        vm.startBroadcast();

        uint256 gasStart = gasleft();
        PongGameHistory instance = new PongGameHistory();
        uint256 gasUsed = gasStart - gasleft();

        console.log("Contract implemented at the address", address(instance));
        console.log("Gas used to implement the contract:", gasUsed);

        vm.stopBroadcast();
    }
}