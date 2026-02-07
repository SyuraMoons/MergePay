// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MergeTreasury.sol";

contract DeployScript is Script {
    function run() external {
        // Load private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Arc Testnet addresses
        address usdcOnArc = vm.envAddress("USDC_ARC_ADDRESS");
        address storkOracle = vm.envAddress("STORK_ORACLE_ADDRESS");
        address cctpMessageTransmitter = vm.envAddress(
            "CCTP_MESSAGE_TRANSMITTER_ADDRESS"
        );

        vm.startBroadcast(deployerPrivateKey);

        // Deploy treasury with USDC and CCTP MessageTransmitter addresses
        MergeTreasury treasury = new MergeTreasury(
            usdcOnArc,
            cctpMessageTransmitter
        );

        console.log("MergeTreasury deployed at:", address(treasury));
        console.log("USDC address:", usdcOnArc);
        console.log("CCTP MessageTransmitter address:", cctpMessageTransmitter);

        vm.stopBroadcast();
    }
}
