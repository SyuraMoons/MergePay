// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {UniswapV4Agent} from "../src/UniswapV4Agent.sol";

contract DeployUniswapV4Agent is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolManager = vm.envAddress("POOL_MANAGER");

        // Base Sepolia PoolManager might behave differently, verify if it is standard V4
        // address poolManager = 0x498581fF718922c3f8e6A244956aF099B2652b2b; // Standard V4 Testnet address often used

        vm.startBroadcast(deployerPrivateKey);

        UniswapV4Agent agent = new UniswapV4Agent(
            poolManager,
            vm.addr(deployerPrivateKey)
        );

        vm.stopBroadcast();
    }
}
