// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/PongGameHistory.sol"; 

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        PongGameHistory instance = new PongGameHistory();
        console.log("Contract implemented at the address:", address(instance));
        vm.stopBroadcast();
    }
}
