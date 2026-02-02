// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MergeTreasury.sol";

contract DeployScript is Script {
    function run() external {
        // Load private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Arc Testnet USDC address (check docs for actual address)
        // Use placeholder - replace with actual Arc testnet USDC
        address usdcOnArc = vm.envAddress("USDC_ARC_ADDRESS");
        address storkOracle = vm.envAddress("STORK_ORACLE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy treasury with both USDC and Oracle addresses
        MergeTreasury treasury = new MergeTreasury(usdcOnArc, storkOracle);

        console.log("MergeTreasury deployed at:", address(treasury));
        console.log("USDC address:", usdcOnArc);
        console.log("Stork Oracle address:", storkOracle);

        vm.stopBroadcast();
    }
}
