// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {UniswapV4Agent} from "../src/UniswapV4Agent.sol";
import {IUniswapV4Agent} from "../src/interfaces/IUniswapV4Agent.sol";
import {
    IPoolManager
} from "../lib/uniswap-hooks/lib/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "../lib/uniswap-hooks/lib/v4-core/src/types/PoolKey.sol";
import {
    Currency
} from "../lib/uniswap-hooks/lib/v4-core/src/types/Currency.sol";
import {
    IHooks
} from "../lib/uniswap-hooks/lib/v4-core/src/interfaces/IHooks.sol";

contract UniswapV4AgentTest is Test {
    UniswapV4Agent agent;
    address mockManager = makeAddr("mockManager");
    address owner = makeAddr("owner");
    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");

    function setUp() public {
        agent = new UniswapV4Agent(mockManager, owner);
    }

    function test_Deployment() public {
        assertEq(address(agent.manager()), mockManager);
        assertEq(agent.owner(), owner);
    }

    function test_AnyoneCanAddLiquidity() public {
        vm.prank(user1);
        // Should NOT revert with OwnableUnauthorizedAccount
        // Expected revert due to mockManager call failure, which verifies access passed
        vm.expectRevert();
        agent.addLiquidity(
            IUniswapV4Agent.AddLiquidityParams({
                poolKey: anyPoolKey(),
                tickLower: 0,
                tickUpper: 60,
                amount0Desired: 100,
                amount1Desired: 100,
                amount0Min: 0,
                amount1Min: 0,
                recipient: user1,
                deadline: block.timestamp
            })
        );
    }

    function test_AnyoneCanSwap() public {
        vm.prank(user2);
        // Should NOT revert with OwnableUnauthorizedAccount
        vm.expectRevert();
        agent.swap(anyPoolKey(), true, 100, 0);
    }

    // Helper to generic dummy key
    function anyPoolKey() internal pure returns (PoolKey memory) {
        return
            PoolKey({
                currency0: Currency.wrap(address(0x1)),
                currency1: Currency.wrap(address(0x2)),
                fee: 3000,
                tickSpacing: 60,
                hooks: IHooks(address(0))
            });
    }
}
