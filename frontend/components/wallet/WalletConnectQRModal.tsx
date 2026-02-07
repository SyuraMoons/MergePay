'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { WalletConnectConnector } from 'wagmi/connectors';

interface WalletConnectQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectQRModal({ isOpen, onClose }: WalletConnectQRModalProps) {
  const [qrUri, setQrUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connectors, connectAsync } = useConnect();
  const { isConnected } = useAccount();
  const hasStartedConnection = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close modal when connected
  useEffect(() => {
    if (isConnected && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isOpen, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const getWalletConnectUri = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setQrUri('');

    try {
      const wcConnector = connectors.find(
        (c): c is WalletConnectConnector => c.id === 'walletConnect'
      );

      if (!wcConnector) {
        throw new Error('WalletConnect connector not found');
      }

      console.log('Setting up WalletConnect URI listener...');

      // Get the provider and set up the URI listener BEFORE connecting
      const provider = await (wcConnector as any).getProvider();

      // Listen for the URI event
      const uriHandler = (uri: string) => {
        console.log('WalletConnect URI received:', uri);
        setQrUri(uri);
        setIsLoading(false);
      };

      // Register the event handler BEFORE initiating connection
      provider.on('display_uri', uriHandler);

      // Store cleanup function
      const cleanup = () => {
        try {
          provider.off('display_uri', uriHandler);
        } catch (e) {
          // Ignore cleanup errors
        }
      };
      cleanupRef.current = cleanup;

      // Check if already has a session
      if ((wcConnector as any).provider?.signer?.session?.uri) {
        const existingUri = (wcConnector as any).provider.signer.session.uri;
        console.log('Using existing WalletConnect session:', existingUri);
        setQrUri(existingUri);
        setIsLoading(false);
        return;
      }

      // Now initiate the connection - this will trigger display_uri event
      console.log('Initiating WalletConnect connection...');
      await connectAsync({ connector: wcConnector });

      // Set a timeout in case URI doesn't come
      const timeout = setTimeout(() => {
        if (!qrUri) {
          console.warn('WalletConnect URI timeout');
          setError('QR code generation timed out. Please try again.');
          setIsLoading(false);
        }
      }, 15000); // 15 second timeout

      // Update cleanup to include timeout
      cleanupRef.current = () => {
        clearTimeout(timeout);
        cleanup();
      };

    } catch (err) {
      console.error('Failed to get WalletConnect URI:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      setIsLoading(false);
    }
  }, [connectors, connectAsync, qrUri]);

  useEffect(() => {
    if (isOpen && !hasStartedConnection.current && !isConnected) {
      hasStartedConnection.current = true;
      getWalletConnectUri();
    }
    // Reset when modal closes
    if (!isOpen) {
      hasStartedConnection.current = false;
      setQrUri('');
      setError(null);
      setIsLoading(true);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    }
  }, [isOpen, isConnected, getWalletConnectUri]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm modal-backdrop animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wc-qr-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 id="wc-qr-title" className="text-lg font-semibold text-gray-900">
            Scan with WalletConnect
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="w-12 h-12 text-[#3B99FC] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600">Generating QR code...</p>
              <p className="mt-2 text-sm text-gray-400">This may take a few seconds</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">Connection Error</p>
              <p className="text-gray-500 text-sm mt-1 text-center px-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  getWalletConnectUri();
                }}
                className="mt-4 px-6 py-2 bg-[#3B99FC] text-white rounded-lg hover:bg-[#3B99FC]/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : isConnected ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">Connected!</p>
              <p className="text-gray-500 text-sm mt-1">Closing modal...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* QR Code */}
              {qrUri ? (
                <>
                  <div className="relative">
                    <div className="w-64 h-64 bg-white rounded-xl border-2 border-gray-200 flex items-center justify-center p-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUri)}`}
                        alt="WalletConnect QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* WalletConnect Logo */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-2 shadow-lg">
                      <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
                        <path d="M10.5 17.5C14.6421 13.3579 21.3579 13.3579 25.5 17.5L26.55 18.55C22.8485 14.8485 16.5515 14.8485 12.85 18.55L10.5 17.5Z" fill="#3B99FC"/>
                        <path d="M14.5 21.5C16.8333 19.1667 19.6667 19.1667 22 21.5L23.05 22.55C20.7167 20.2167 17.8833 20.2167 15.55 22.55L14.5 21.5Z" fill="#3B99FC"/>
                        <path d="M18.5 25.5C19.3333 24.6667 20.1667 24.6667 21 25.5L22 26.5C21.1667 25.6667 20.3333 25.6667 19.5 26.5L18.5 25.5Z" fill="#3B99FC"/>
                      </svg>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-gray-700 font-medium mb-2">Scan with your mobile wallet</p>
                    <p className="text-gray-500 text-sm">
                      Use WalletConnect-enabled apps like MetaMask, Trust Wallet, or Rainbow
                    </p>
                  </div>

                  {/* Connection Status */}
                  <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>Waiting for connection...</span>
                  </div>
                </>
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center">
                  <p className="text-gray-500 text-center px-4">No QR code available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Don't have a WalletConnect-compatible wallet?
            <a
              href="https://walletconnect.com/explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3B99FC] hover:underline ml-1"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
