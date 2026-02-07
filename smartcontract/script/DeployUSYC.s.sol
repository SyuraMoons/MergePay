// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/USYCYieldManager.sol";
import "../src/MergeTreasury.sol";

/**
 * @title DeployUSYC
 * @notice Deployment script for USYC integration on Arc Testnet
 * @dev Run with: forge script script/DeployUSYC.s.sol --rpc-url $ARC_RPC_URL --broadcast --verify
 */
contract DeployUSYC is Script {
    // ========== Arc Testnet Contract Addresses ==========
    // TODO: Update these with actual Arc Testnet addresses from Circle docs

    address constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    address constant ARC_USYC = 0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C;
    address constant ARC_USYC_TELLER =
        0x9fdF14c5B14173D74C08Af27AebFf39240dC105A;
    address constant ARC_ADDRESS_BOOK =
        0x0000000d81083B16EA76dfab46B0315B0eDBF3d0;

    // Existing MergeTreasury address (if already deployed)
    address constant MERGE_TREASURY =
        0xC3E886F59c544775D2cB0B465E7d3351c462239c;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying USYC integration with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy USYCYieldManager
        console.log("\n=== Deploying USYCYieldManager ===");
        require(ARC_USYC_TELLER != address(0), "USYC Teller address not set");
        require(ARC_USDC != address(0), "USDC address not set");
        require(ARC_USYC != address(0), "USYC address not set");
        require(MERGE_TREASURY != address(0), "MergeTreasury address not set");

        USYCYieldManager yieldManager = new USYCYieldManager(
            ARC_USYC_TELLER,
            ARC_USDC,
            ARC_USYC,
            MERGE_TREASURY
        );

        console.log("USYCYieldManager deployed at:", address(yieldManager));

        // Step 2: Configure MergeTreasury to use USYCYieldManager
        console.log("\n=== Configuring MergeTreasury ===");
        MergeTreasury treasury = MergeTreasury(MERGE_TREASURY);

        // Set USYC Yield Manager
        treasury.setUSYCYieldManager(address(yieldManager));
        console.log("USYCYieldManager set in MergeTreasury");

        // Set Address Book for withdrawal restrictions
        treasury.setAddressBook(ARC_ADDRESS_BOOK);
        console.log("Address Book module set in MergeTreasury");

        vm.stopBroadcast();

        // ========== Deployment Summary ==========
        console.log("\n=== Deployment Summary ===");
        console.log("USYCYieldManager:", address(yieldManager));
        console.log("MergeTreasury:", MERGE_TREASURY);
        console.log("USYC Teller:", ARC_USYC_TELLER);
        console.log("USDC:", ARC_USDC);
        console.log("USYC:", ARC_USYC);
        console.log("Address Book:", ARC_ADDRESS_BOOK);

        console.log("\n=== Next Steps ===");
        console.log("1. Verify contracts on Arc explorer");
        console.log("2. Configure treasury policies with useUSYC=true");
        console.log("3. Add approved withdrawal addresses to Address Book");
        console.log(
            "4. Test deposit -> policy execution -> USYC conversion flow"
        );
    }
}

/**
 * @title DeployUSYCStandalone
 * @notice Standalone deployment if MergeTreasury is not yet deployed
 */
contract DeployUSYCStandalone is Script {
    address constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    address constant ARC_USYC = 0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C;
    address constant ARC_USYC_TELLER =
        0x9fdF14c5B14173D74C08Af27AebFf39240dC105A;
    address constant ARC_CCTP_TRANSMITTER =
        0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275;
    address constant ARC_ADDRESS_BOOK =
        0x0000000d81083B16EA76dfab46B0315B0eDBF3d0;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying full stack with deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy MergeTreasury
        console.log("\n=== Deploying MergeTreasury ===");
        MergeTreasury treasury = new MergeTreasury(
            ARC_USDC,
            ARC_CCTP_TRANSMITTER
        );
        console.log("MergeTreasury deployed at:", address(treasury));

        // Step 2: Deploy USYCYieldManager
        console.log("\n=== Deploying USYCYieldManager ===");
        USYCYieldManager yieldManager = new USYCYieldManager(
            ARC_USYC_TELLER,
            ARC_USDC,
            ARC_USYC,
            address(treasury)
        );
        console.log("USYCYieldManager deployed at:", address(yieldManager));

        // Step 3: Configure MergeTreasury
        console.log("\n=== Configuring MergeTreasury ===");
        treasury.setUSYCYieldManager(address(yieldManager));
        treasury.setAddressBook(ARC_ADDRESS_BOOK);
        console.log("Configuration complete");

        vm.stopBroadcast();

        // Deployment Summary
        console.log("\n=== Deployment Summary ===");
        console.log("MergeTreasury:", address(treasury));
        console.log("USYCYieldManager:", address(yieldManager));
        console.log("Ready for integration testing");
    }
}
