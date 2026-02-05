import { BalanceState, WebSocketMessage } from '@/types/balance';
import { mockBalances, calculateTotalBalance } from './mockData';

type EventCallback = (data: BalanceState) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Set<EventCallback> = new Set();
  private mockMode: boolean;
  private mockInterval: NodeJS.Timeout | null = null;

  constructor(url?: string, mockMode = true) {
    this.mockMode = mockMode;

    if (mockMode) {
      this.startMockMode();
    } else if (url) {
      this.connect(url);
    }
  }

  private startMockMode() {
    // Simulate initial balance
    const initialState: BalanceState = {
      totalBalance: calculateTotalBalance(mockBalances),
      chains: mockBalances,
      lastUpdated: new Date(),
      isLoading: false,
    };

    // Emit initial state
    setTimeout(() => {
      this.notifyListeners(initialState);
    }, 500);

    // Simulate balance updates every 10 seconds
    this.mockInterval = setInterval(() => {
      const updatedChains = mockBalances.map((chain) => ({
        ...chain,
        balance: chain.balance + (Math.random() - 0.5) * 2, // Random change ±1
      }));

      const updatedState: BalanceState = {
        totalBalance: calculateTotalBalance(updatedChains),
        chains: updatedChains,
        lastUpdated: new Date(),
        isLoading: false,
      };

      this.notifyListeners(updatedState);
    }, 10000);
  }

  private connect(url: string) {
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === 'balance_update' && message.data) {
            this.notifyListeners(message.data as BalanceState);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect(url);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect(url);
    }
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect(url);
      }, delay);
    }
  }

  private notifyListeners(data: BalanceState) {
    this.listeners.forEach((callback) => callback(data));
  }

  public subscribe(callback: EventCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public disconnect() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.listeners.clear();
  }
}
