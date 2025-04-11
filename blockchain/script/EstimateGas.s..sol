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

        console.log("Contrato implantado no endereco:", address(instance));
        console.log("Gas usado para implantar o contrato:", gasUsed);

        vm.stopBroadcast();
    }
}