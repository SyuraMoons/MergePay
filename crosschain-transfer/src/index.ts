#!/usr/bin/env node
/**
 * CLI Entry Point for Cross-Chain USDC Transfer using Circle CCTP
 *
 * Usage:
 *   npm start                    # Show wallet status
 *   npm start transfer <amount>  # Transfer USDC from Sepolia to Arc
 *   npm start resume <txHash>    # Resume interrupted transfer
 *
 * Environment variables (in .env):
 *   PRIVATE_KEY           - Your wallet private key
 *   RECIPIENT_ADDRESS     - Destination address on Arc (optional, defaults to sender)
 *   SEPOLIA_RPC_URL       - Optional custom RPC for Sepolia
 */

import { TransferOrchestrator } from './services/orchestrator.js';

/**
 * CLI commands
 */
enum Command {
  Status = 'status',
  Transfer = 'transfer',
  Resume = 'resume',
  GatewayDeposit = 'gateway-deposit',
  GatewayBalance = 'gateway-balance',
  GatewayTransfer = 'gateway-transfer',
  // Policy-based treasury automation
  PolicyConfigure = 'policy-configure',
  PolicyStatus = 'policy-status',
  PolicyExecute = 'policy-execute',
  PolicyCheck = 'policy-check',
  PoolsInfo = 'pools-info',
  Help = 'help',
}

/**
 * Parse CLI arguments
 */
function parseArgs(): { command: Command; args: string[] } {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    return { command: Command.Status, args: [] };
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case 'transfer':
    case 'send':
    case 'tx':
      return { command: Command.Transfer, args: args.slice(1) };
    case 'resume':
    case 'continue':
      return { command: Command.Resume, args: args.slice(1) };
    case 'gateway-deposit':
    case 'gw-deposit':
      return { command: Command.GatewayDeposit, args: args.slice(1) };
    case 'gateway-balance':
    case 'gw-balance':
      return { command: Command.GatewayBalance, args: args.slice(1) };
    case 'gateway-transfer':
    case 'gw-transfer':
      return { command: Command.GatewayTransfer, args: args.slice(1) };
    case 'policy-configure':
    case 'pc':
      return { command: Command.PolicyConfigure, args: args.slice(1) };
    case 'policy-status':
    case 'ps':
      return { command: Command.PolicyStatus, args: args.slice(1) };
    case 'policy-execute':
    case 'pe':
      return { command: Command.PolicyExecute, args: args.slice(1) };
    case 'policy-check':
    case 'pcheck':
      return { command: Command.PolicyCheck, args: args.slice(1) };
    case 'pools-info':
    case 'pools':
      return { command: Command.PoolsInfo, args: args.slice(1) };
    case 'help':
    case '--help':
    case '-h':
      return { command: Command.Help, args: [] };
    default:
      // Try to parse as transfer amount
      const amount = parseFloat(command);
      if (!isNaN(amount) && amount > 0) {
        return { command: Command.Transfer, args: [command] };
      }
      return { command: Command.Status, args: [] };
  }
}

/**
 * Validate environment
 */
function validateEnv(): { valid: boolean; error?: string } {
  if (!process.env.PRIVATE_KEY) {
    return {
      valid: false,
      error: 'PRIVATE_KEY not set in .env file',
    };
  }

  const privateKey = process.env.PRIVATE_KEY.trim();
  if (!privateKey.startsWith('0x')) {
    return {
      valid: false,
      error: 'PRIVATE_KEY must start with 0x',
    };
  }

  if (privateKey.length !== 66) {
    return {
      valid: false,
      error: 'PRIVATE_KEY must be 66 characters (0x + 64 hex chars)',
    };
  }

  return { valid: true };
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        Arc Treasury Hub - Chain Abstracted Payouts            ║
╚═══════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════
  TRACK 1: Chain Abstracted USDC Apps (Cross-Chain Transfers)
═══════════════════════════════════════════════════════════════

CCTP (5-10s transfers between Sepolia ↔ Arc):
  npm start transfer <amount> [recipient]       # Transfer USDC
  npm start resume <txHash>                     # Resume from burn TX

Gateway (Instant <500ms unified balance):
  npm start gateway-deposit <amount> <chain>    # Deposit to Gateway
  npm start gateway-balance                     # Check unified balance
  npm start gateway-transfer <amount> <chain> <recipient>

═══════════════════════════════════════════════════════════════
  TRACK 2: AI-Driven Treasury Automation
═══════════════════════════════════════════════════════════════

Policy Configuration:
  npm start policy-configure <threshold> <mode> [vaultAddress]
    Example (Auto): npm start policy-configure 1000 auto
    Example (Manual): npm start policy-configure 1000 manual 0x123...

    Modes:
      auto   - AI agent chooses between USDC/USDC or USDC/USDT pools
      manual - Sends excess to specified vault address

Policy Management:
  npm start policy-status         # View your current policy
  npm start policy-check          # Check if policy can execute
  npm start policy-execute        # Manually trigger policy execution
  npm start pools-info            # View available pools and APY

How It Works:
  1. Set threshold (e.g., 1000 USDC minimum reserve)
  2. When balance > threshold, excess is automatically managed:
     - Auto mode: AI agent compares APYs and chooses best pool
     - Manual mode: Sends to your vault address
  3. Policy executes automatically (with cooldown period)

Examples:
  # Auto mode - AI chooses best yield
  npm start policy-configure 1000 auto

  # Manual mode - cold storage
  npm start policy-configure 1000 manual 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1

  # Check current policy
  npm start policy-status

  # View pools and APY
  npm start pools-info

═══════════════════════════════════════════════════════════════

Get Testnet USDC:
  https://faucet.circle.com/         # Circle USDC Faucet

╔═══════════════════════════════════════════════════════════════╗
║  ⚠️  TESTNET ONLY - Tokens have no real value                  ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Parse CLI arguments first to determine mode
  const { command, args } = parseArgs();

  // Determine mode based on command
  const isGatewayMode = [
    Command.GatewayDeposit,
    Command.GatewayBalance,
    Command.GatewayTransfer
  ].includes(command);

  const isPolicyMode = [
    Command.PolicyConfigure,
    Command.PolicyStatus,
    Command.PolicyExecute,
    Command.PolicyCheck,
    Command.PoolsInfo
  ].includes(command);

  let headerTitle = 'CCTP Cross-Chain USDC Transfer: Sepolia → Arc';
  if (isGatewayMode) {
    headerTitle = 'Gateway Cross-Chain USDC (Instant Transfers)';
  } else if (isPolicyMode) {
    headerTitle = 'Arc Treasury Hub - AI-Driven Treasury Automation';
  }

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     ${headerTitle.padEnd(59)}║
╚═══════════════════════════════════════════════════════════════╝
`);

  // Validate environment
  const envValidation = validateEnv();
  if (!envValidation.valid) {
    console.error(`❌ Configuration Error: ${envValidation.error}\n`);
    console.log('Please set up your .env file:\n');
    console.log('  PRIVATE_KEY=0x...your_private_key...\n');
    console.log('See .env.example for reference.\n');
    process.exit(1);
  }

  const privateKey = process.env.PRIVATE_KEY!;
  const recipientAddress = process.env.RECIPIENT_ADDRESS;

  // Create orchestrator
  const orchestrator = new TransferOrchestrator();

  switch (command) {
    case Command.Help: {
      showHelp();
      break;
    }

    case Command.Status: {
      try {
        await orchestrator.printWalletStatus(privateKey);
      } catch (error) {
        console.error('\n❌ Failed to get wallet status:');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        if (error instanceof Error && error.stack) {
          console.error('\nStack trace:\n', error.stack);
        }
        process.exit(1);
      }
      break;
    }

    case Command.Transfer: {
      // Parse amount
      if (args.length === 0) {
        console.error('❌ Error: Amount required\n');
        console.log('Usage: npm start transfer <amount> [recipient]\n');
        process.exit(1);
      }

      const amount = parseFloat(args[0]);
      if (isNaN(amount) || amount <= 0) {
        console.error(`❌ Error: Invalid amount "${args[0]}"\n`);
        process.exit(1);
      }

      // Get recipient (CLI arg > env var > sender address)
      const recipient = args[1] || recipientAddress;

      if (!recipient) {
        console.error('❌ Error: Recipient address required\n');
        console.log('Set RECIPIENT_ADDRESS in .env or pass as argument:\n');
        console.log('  npm start transfer <amount> <recipient>\n');
        process.exit(1);
      }

      try {
        // Execute transfer
        const result = await orchestrator.transferSepoliaToArc(
          {
            amount,
            recipient,
            privateKey,
          },
          {
            skipConfirm: true, // Auto-confirm for CLI
          }
        );

        // Exit with appropriate code
        process.exit(result.success ? 0 : 1);
      } catch (error) {
        console.error('\n❌ Transfer failed with error:');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        if (error instanceof Error && error.stack) {
          console.error('\nStack trace:\n', error.stack);
        }
        process.exit(1);
      }
      break;
    }

    case Command.Resume: {
      if (args.length === 0) {
        console.error('❌ Error: Transaction hash required\n');
        console.log('Usage: npm start resume <burnTxHash>\n');
        process.exit(1);
      }

      const txHash = args[0];

      try {
        const result = await orchestrator.resumeFromBurn(txHash, privateKey);
        process.exit(result.success ? 0 : 1);
      } catch (error) {
        console.error('\n❌ Resume failed with error:');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        if (error instanceof Error && error.stack) {
          console.error('\nStack trace:\n', error.stack);
        }
        process.exit(1);
      }
      break;
    }

    case Command.GatewayDeposit: {
      if (args.length < 2) {
        console.error('❌ Error: Amount and chain required\n');
        console.log('Usage: npm start gateway-deposit <amount> <chain>\n');
        console.log('Chains: sepolia, arc, base, avalanche\n');
        process.exit(1);
      }

      const amount = parseFloat(args[0]);
      if (isNaN(amount) || amount <= 0) {
        console.error(`❌ Error: Invalid amount "${args[0]}"\n`);
        process.exit(1);
      }

      const chain = args[1].toLowerCase();
      if (!['sepolia', 'arc', 'base', 'avalanche'].includes(chain)) {
        console.error(`❌ Error: Invalid chain "${chain}"\n`);
        console.log('Supported chains: sepolia, arc, base, avalanche\n');
        process.exit(1);
      }

      const result = await orchestrator.depositToGateway(
        amount,
        chain as any,
        privateKey
      );

      process.exit(result.success ? 0 : 1);
      break;
    }

    case Command.GatewayBalance: {
      const chains = args.length > 0 ? args as any[] : undefined;

      const result = await orchestrator.getGatewayBalance(privateKey, chains);

      process.exit(result.success ? 0 : 1);
      break;
    }

    case Command.GatewayTransfer: {
      if (args.length < 3) {
        console.error('❌ Error: Amount, destination chain, and recipient required\n');
        console.log('Usage: npm start gateway-transfer <amount> <destination> <recipient>\n');
        console.log('Example: npm start gateway-transfer 5 arc 0x1234...\n');
        process.exit(1);
      }

      const amount = parseFloat(args[0]);
      if (isNaN(amount) || amount <= 0) {
        console.error(`❌ Error: Invalid amount "${args[0]}"\n`);
        process.exit(1);
      }

      const destination = args[1].toLowerCase();
      if (!['sepolia', 'arc', 'base', 'avalanche'].includes(destination)) {
        console.error(`❌ Error: Invalid destination chain "${destination}"\n`);
        console.log('Supported chains: sepolia, arc, base, avalanche\n');
        process.exit(1);
      }

      const recipient = args[2];

      const result = await orchestrator.transferViaGateway(
        amount,
        destination as any,
        recipient,
        privateKey
      );

      process.exit(result.success ? 0 : 1);
      break;
    }

    // ========== Policy Automation Commands ==========

    case Command.PolicyConfigure: {
      if (args.length < 2) {
        console.error('❌ Error: Threshold and mode required\n');
        console.log('Usage: npm start policy-configure <threshold> <mode> [vaultAddress]\n');
        console.log('Examples:\n');
        console.log('  Auto mode:   npm start policy-configure 1000 auto');
        console.log('  Manual mode: npm start policy-configure 1000 manual 0x123...\n');
        process.exit(1);
      }

      const threshold = parseFloat(args[0]);
      if (isNaN(threshold) || threshold <= 0) {
        console.error(`❌ Error: Invalid threshold "${args[0]}"\n`);
        process.exit(1);
      }

      const mode = args[1].toLowerCase();
      if (!['auto', 'manual'].includes(mode)) {
        console.error(`❌ Error: Invalid mode "${args[1]}". Use 'auto' or 'manual'\n`);
        process.exit(1);
      }

      const autoMode = mode === 'auto';
      const vaultAddress = args[2] as any;

      if (!autoMode && !vaultAddress) {
        console.error('❌ Error: Vault address required for manual mode\n');
        process.exit(1);
      }

      try {
        await orchestrator.configurePolicy({
          threshold,
          autoMode,
          vaultAddress,
          allowUSDCPool: true,  // Default allow both pools in auto mode
          allowUSDTPool: true,
          cooldownPeriod: 3600, // 1 hour default
          privateKey,
        });
        process.exit(0);
      } catch (error) {
        console.error('\n❌ Failed to configure policy:');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
      break;
    }

    case Command.PolicyStatus: {
      try {
        const address = orchestrator['walletService'].getAddressFromPrivateKey(privateKey);
        await orchestrator.getPolicyStatus(address);
        process.exit(0);
      } catch (error) {
        console.error('\n❌ Failed to get policy status:');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
      break;
    }

    case Command.PolicyExecute: {
      try {
        const address = orchestrator['walletService'].getAddressFromPrivateKey(privateKey);
        await orchestrator.executePolicy(address, privateKey);
        process.exit(0);
      } catch (error) {
        console.error('\n❌ Failed to execute policy:');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
      break;
    }

    case Command.PolicyCheck: {
      try {
        const address = orchestrator['walletService'].getAddressFromPrivateKey(privateKey);
        await orchestrator.checkPolicyStatus(address);
        process.exit(0);
      } catch (error) {
        console.error('\n❌ Failed to check policy:');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
      break;
    }

    case Command.PoolsInfo: {
      try {
        await orchestrator.showPoolsInfo();
        process.exit(0);
      } catch (error) {
        console.error('\n❌ Failed to get pools info:');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
      break;
    }

  }
}

// Run main function
main().catch(error => {
  console.error('\n❌ Fatal Error:', error instanceof Error ? error.message : 'Unknown error');
  if (error instanceof Error && error.stack) {
    console.error('\nStack trace:\n', error.stack);
  }
  process.exit(1);
});
