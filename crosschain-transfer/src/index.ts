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
║     Cross-Chain USDC Transfer (CCTP + Gateway)                ║
╚═══════════════════════════════════════════════════════════════╝

CCTP Mode (Simple point-to-point transfer, ~5-10 seconds):
  npm start                          Show wallet status
  npm start <amount>                 Transfer USDC to same address on Arc
  npm start transfer <amount>        Transfer USDC to same address on Arc
  npm start transfer <amount> <addr> Transfer USDC to specific address
  npm start resume <txHash>          Resume interrupted transfer

Gateway Mode (Unified balance, instant <500ms transfers):
  npm start gateway-deposit <amount> <chain>
      Deposit USDC to Gateway on specified chain
      Example: npm start gateway-deposit 10 sepolia

  npm start gateway-balance
      Check unified Gateway balance across chains

  npm start gateway-transfer <amount> <destination> <recipient>
      Instant transfer from unified balance
      Example: npm start gateway-transfer 5 arc 0x1234...

Environment (.env):
  PRIVATE_KEY           Your wallet private key (0x...)
  RECIPIENT_ADDRESS     Destination on Arc (optional)
  SEPOLIA_RPC_URL       Custom RPC for Sepolia (optional)

Examples:

  CCTP Transfer:
    npm start transfer 10              # Transfer 10 USDC Sepolia → Arc

  Gateway Workflow:
    npm start gateway-deposit 10 sepolia  # Deposit to Gateway
    # Wait 15-20 minutes for confirmations
    npm start gateway-balance             # Check unified balance
    npm start gateway-transfer 5 arc 0x...  # Instant transfer (<500ms)

Get Testnet USDC:
  https://faucet.circle.com/         # Circle USDC Faucet

Supported Chains (Gateway):
  sepolia, arc, base, avalanche

Explorers:
  Sepolia: https://sepolia.etherscan.io
  Arc:     https://testnet.arcscan.app

╔═══════════════════════════════════════════════════════════════╗
║  ⚠️  TESTNET ONLY - Tokens have no real value                  ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     CCTP Cross-Chain USDC Transfer: Sepolia → Arc              ║
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

  // Parse CLI arguments
  const { command, args } = parseArgs();

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
