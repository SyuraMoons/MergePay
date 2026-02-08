// app/api/endpoints/route.ts
import { NextResponse } from "next/server";

// Point to our local backend server
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "test-api-key";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, ...params } = body ?? {};

        if (!action) {
            return NextResponse.json({ error: "Missing action" }, { status: 400 });
        }

        let backendUrl = "";
        let method = "POST";
        let payload: any = {};

        switch (action) {
            case "createDeviceToken": {
                // Backend: POST /api/circle/users/social/token
                backendUrl = `${BACKEND_BASE_URL}/api/circle/users/social/token`;
                payload = { deviceId: params.deviceId };
                break;
            }

            case "initializeUser": {
                // Backend: POST /api/circle/wallets/create-with-pin
                // Need to adapt params. Frontend sends `userToken`.
                // Backend expects: { userToken, blockchains, accountType }
                // We'll set defaults for blockchains and accountType if not present.
                backendUrl = `${BACKEND_BASE_URL}/api/circle/wallets/create-with-pin`;
                payload = {
                    userToken: params.userToken,
                    blockchains: ["ARC-TESTNET"], // Consistent with previous implementation
                    accountType: "SCA"
                };
                break;
            }

            case "listWallets": {
                // Backend: POST /api/circle/wallets/list
                // Backend expects: { userToken }
                backendUrl = `${BACKEND_BASE_URL}/api/circle/wallets/list`;
                payload = { userToken: params.userToken };
                break;
            }

            case "getTokenBalance": {
                // Backend: POST /api/circle/wallets/balance
                // Backend expects: { userToken, walletId }
                backendUrl = `${BACKEND_BASE_URL}/api/circle/wallets/balance`;
                payload = {
                    userToken: params.userToken,
                    walletId: params.walletId
                };
                break;
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 },
                );
        }

        // Call our backend
        console.log(`Forwarding to backend: ${method} ${backendUrl}`);
        const response = await fetch(backendUrl, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_KEY // Add API Key for backend auth
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Backend error:", data);
            return NextResponse.json(data, { status: response.status });
        }

        // The frontend expects specific data structures. 
        // We need to map backend responses to what frontend expects if they differ.
        // Backend returns standard { success: true, data: ... } wrapper.
        // Frontend mostly expects the `data` part directly or `data.data`.

        // Backend wrapper: { success: true, data: {...} }
        // Let's return `data.data` to match previous behavior where we returned `data.data` from Circle response.

        return NextResponse.json(data.data, { status: 200 });

    } catch (error) {
        console.log("Error in /api/endpoints:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}