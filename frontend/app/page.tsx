'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

// Real Chain Logo SVGs - All in theme colors (orange/white/bone)
const EthereumLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <path d="M16 2l-0.1 0.3v18.2l0.1 0.1 8.4-5L16 2z" fill="#F4673B" />
    <path d="M16 2L7.6 15.6l8.4 5V2z" fill="#FF8A65" />
    <path d="M16 22.5l-0.1 0.1v6.4l0.1 0.2 8.4-11.9-8.4 5.2z" fill="#F4673B" />
    <path d="M16 29.2v-6.7l-8.4-5.2 8.4 11.9z" fill="#FF8A65" />
    <path d="M16 21.4l8.4-5-8.4-3.8v8.8z" fill="#D14A25" />
    <path d="M7.6 16.4l8.4 5v-8.8l-8.4 3.8z" fill="#F4673B" />
  </svg>
);

const BaseLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <circle cx="16" cy="16" r="14" fill="#F4673B" />
    {/* Official Base logo - lowercase 'b' with opening on right */}
    <path d="M15.5 6C9.7 6 5 10.7 5 16.5S9.7 27 15.5 27c2.9 0 5.5-1.2 7.4-3.1h-6.6c-4.1 0-7.4-3.3-7.4-7.4s3.3-7.4 7.4-7.4c2.6 0 4.8 1.3 6.1 3.3h4.1C24.5 8.6 20.4 6 15.5 6z" fill="white" />
  </svg>
);

const ArbitrumLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <circle cx="16" cy="16" r="14" fill="#F4673B" />
    <path d="M16.7 10.4l5.8 9.7-2.5 1.5-4.8-8.1 1.5-3.1zm-1.4 0l-5.8 9.7 2.5 1.5 4.8-8.1-1.5-3.1z" fill="white" />
    <path d="M16 5l-9 15.6 3 1.8L16 11.8l6 10.6 3-1.8L16 5z" fill="white" opacity="0.6" />
  </svg>
);

const PolygonLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <path d="M21.2 12.4c-0.4-0.2-0.9-0.2-1.3 0l-3.1 1.8-2.1 1.2-3.1 1.8c-0.4 0.2-0.9 0.2-1.3 0l-2.4-1.4c-0.4-0.2-0.7-0.7-0.7-1.2v-2.7c0-0.5 0.2-0.9 0.7-1.2l2.4-1.4c0.4-0.2 0.9-0.2 1.3 0l2.4 1.4c0.4 0.2 0.7 0.7 0.7 1.2v1.8l2.1-1.2v-1.8c0-0.5-0.2-0.9-0.7-1.2l-4.5-2.6c-0.4-0.2-0.9-0.2-1.3 0l-4.6 2.7c-0.4 0.2-0.7 0.7-0.7 1.2v5.2c0 0.5 0.2 0.9 0.7 1.2l4.5 2.6c0.4 0.2 0.9 0.2 1.3 0l3.1-1.8 2.1-1.2 3.1-1.8c0.4-0.2 0.9-0.2 1.3 0l2.4 1.4c0.4 0.2 0.7 0.7 0.7 1.2v2.7c0 0.5-0.2 0.9-0.7 1.2l-2.4 1.4c-0.4 0.2-0.9 0.2-1.3 0l-2.4-1.4c-0.4-0.2-0.7-0.7-0.7-1.2v-1.8l-2.1 1.2v1.8c0 0.5 0.2 0.9 0.7 1.2l4.5 2.6c0.4 0.2 0.9 0.2 1.3 0l4.5-2.6c0.4-0.2 0.7-0.7 0.7-1.2v-5.2c0-0.5-0.2-0.9-0.7-1.2l-4.6-2.5z" fill="#F4673B" />
  </svg>
);

const OptimismLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <circle cx="16" cy="16" r="14" fill="#F4673B" />
    <path d="M11.3 20.5c-2.4 0-4.3-1.9-4.3-4.5s1.9-4.5 4.3-4.5c2.4 0 4.3 1.9 4.3 4.5s-1.9 4.5-4.3 4.5zm0-2.2c1.1 0 1.9-0.9 1.9-2.3s-0.8-2.3-1.9-2.3c-1.1 0-1.9 0.9-1.9 2.3s0.8 2.3 1.9 2.3z" fill="white" />
    <path d="M17.5 20.3v-8.6h3.8c2 0 3.4 1.2 3.4 3.1s-1.4 3.1-3.4 3.1h-1.4v2.4h-2.4zm2.4-4.6h1.1c0.7 0 1.2-0.4 1.2-1s-0.5-1-1.2-1h-1.1v2z" fill="white" />
  </svg>
);

// Integration Icons with theme colors
const CircleLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <circle cx="16" cy="16" r="14" fill="#F4673B" />
    <circle cx="16" cy="16" r="8" fill="white" />
    <circle cx="16" cy="16" r="4" fill="#F4673B" />
  </svg>
);

const UniswapLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <path d="M11.5 8.4c-0.3-0.1-0.3-0.1-0.2-0.1 0.3 0 1 0.2 1.5 0.4 1.3 0.6 2.4 1.8 3.4 3.9l0.3 0.6 0.5-0.3c2.1-1.1 4.5-1.4 6.6-0.8 0.6 0.2 1.4 0.5 1.6 0.7 0.1 0.1 0.1 0.2 0.1 0.4 0 0.4-0.2 0.7-0.6 1-0.2 0.2-0.3 0.2-0.8 0.2-0.9 0-1.5-0.3-2-0.9-0.1-0.2-0.3-0.3-0.4-0.3-0.1 0-0.5 0.2-0.8 0.5-0.6 0.5-0.7 0.7-0.3 1.1 0.5 0.5 1.5 0.9 2.4 0.9 0.4 0 0.5 0 0.7 0.2l0.2 0.2v2.5c0 1.6-0.1 2.6-0.1 2.8-0.2 0.6-0.5 1.1-1 1.4-0.3 0.2-0.8 0.4-1 0.4-0.2 0-0.2 0-0.2-0.5 0-0.8-0.2-1.1-0.8-1.4-0.3-0.2-0.9-0.3-1.3-0.3h-0.3v0.5c0 0.5 0 0.5 0.2 0.6 0.7 0.4 0.9 0.7 0.9 1.4 0 0.5-0.1 0.8-0.5 1.2-0.3 0.4-0.7 0.5-1.2 0.5-0.9 0-1.6-0.6-1.8-1.4-0.1-0.4 0-0.9 0.2-1.3 0.1-0.2 0.1-0.3 0.1-0.4 0-0.1-0.1-0.2-0.4-0.4-0.8-0.5-1.5-1.4-1.8-2.4-0.2-0.6-0.2-0.7-0.2-1.7 0-0.9 0-1.1 0.1-1.4 0.4-1.3 1.2-2.2 2.4-2.7 0.4-0.2 0.8-0.3 1.4-0.3 0.8 0 1.6 0.2 2.2 0.6l0.4 0.2 0.2-0.3c0.3-0.5 0.5-1.2 0.5-1.6 0-0.2-0.1-0.2-0.4-0.4-0.9-0.4-2.1-0.6-2.9-0.4-1.6 0.3-2.8 1.3-3.1 2.6-0.1 0.4-0.1 0.4-0.2 0.1-0.5-1.1-1.4-2.4-2.3-3.2-0.8-0.7-1.8-1.2-2.4-1.3z" fill="#F4673B" />
  </svg>
);

// Arc Network logo
const ArcLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <circle cx="16" cy="16" r="14" fill="#F4673B" />
    {/* Arc shape - stylized 'A' */}
    <path d="M16 6L6 26h4l2-4h8l2 4h4L16 6zm0 8l2.5 5h-5L16 14z" fill="white" />
  </svg>
);

const WalletConnectLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <rect x="2" y="2" width="28" height="28" rx="6" fill="#F4673B" />
    <path d="M9.5 12.5c3.6-3.5 9.4-3.5 13 0l0.4 0.4c0.2 0.2 0.2 0.4 0 0.6l-1.4 1.4c-0.1 0.1-0.2 0.1-0.3 0l-0.6-0.6c-2.5-2.4-6.5-2.4-9 0l-0.6 0.6c-0.1 0.1-0.2 0.1-0.3 0l-1.4-1.4c-0.2-0.2-0.2-0.4 0-0.6l0.2-0.4zm16.1 3l1.3 1.3c0.2 0.2 0.2 0.4 0 0.6l-5.6 5.5c-0.2 0.2-0.5 0.2-0.7 0l-4-3.9c-0.1-0.1-0.2-0.1-0.2 0l-4 3.9c-0.2 0.2-0.5 0.2-0.7 0l-5.6-5.5c-0.2-0.2-0.2-0.4 0-0.6l1.3-1.3c0.2-0.2 0.5-0.2 0.7 0l4 3.9c0.1 0.1 0.2 0.1 0.2 0l4-3.9c0.2-0.2 0.5-0.2 0.7 0l4 3.9c0.1 0.1 0.2 0.1 0.2 0l4-3.9c0.2-0.2 0.5-0.2 0.7 0z" fill="white" />
  </svg>
);

const TelegramLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <circle cx="16" cy="16" r="14" fill="#F4673B" />
    <path d="M22.8 10.3l-2.8 13.1c-0.2 0.9-0.8 1.1-1.5 0.7l-4.3-3.2-2.1 2c-0.2 0.2-0.4 0.4-0.9 0.4l0.3-4.4 8-7.2c0.3-0.3-0.1-0.5-0.5-0.2l-9.9 6.2-4.3-1.3c-0.9-0.3-0.9-0.9 0.2-1.4l16.7-6.4c0.8-0.3 1.5 0.2 1.2 1.3z" fill="white" />
  </svg>
);

// Simple clean hero illustration - no weird animations
const MergeAnimation = () => (
  <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center">
    {/* Background glow */}
    <div className="absolute inset-0 bg-gradient-radial from-[#F4673B]/10 via-transparent to-transparent rounded-full" />

    {/* Center icon */}
    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#F4673B] to-[#FF8A65] flex items-center justify-center shadow-xl shadow-[#F4673B]/20">
      <span className="text-white text-5xl font-bold">$</span>
    </div>

    {/* Decorative rings */}
    <div className="absolute w-48 h-48 rounded-full border-2 border-[#F4673B]/20" />
    <div className="absolute w-64 h-64 rounded-full border border-[#F4673B]/10" />
  </div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="glass-card p-6 group hover:border-[#F4673B]/20 transition-all duration-300">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F4673B]/10 to-[#FF8A65]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
  </div>
);

// Step Card Component
const StepCard = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <div className="flex gap-4 items-start">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4673B] to-[#FF8A65] flex items-center justify-center text-white font-bold text-sm shrink-0">
      {number}
    </div>
    <div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9" />
            <span className="font-bold text-xl text-gray-900">Merge<span className="text-[#F4673B]">Pay</span></span>
          </div>
          <Link
            href="/dashboard"
            className="btn-primary text-sm px-6 py-2.5"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in-up">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Merge Your<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4673B] to-[#FF8A65]">
                  Multi-Chain Treasury
                </span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
                Aggregate balances across chains, automate yield strategies, and execute instant cross-chain transfers—all from one unified dashboard.
              </p>
              <div className="flex gap-4 pt-2">
                <Link href="/dashboard" className="btn-primary">
                  Get Started
                </Link>
                <a href="#features" className="px-6 py-3 rounded-full border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Learn More
                </a>
              </div>
            </div>
            <div className="animate-scale-in">
              <MergeAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Powerful Features</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Everything you need to manage cross-chain treasury operations efficiently.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              }
              title="Cross-Chain Transfers"
              description="Instant USDC transfers between chains via Circle CCTP. No bridges, no delays."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
              title="Treasury Policies"
              description="Set automated rules for fund management. Auto-sweep excess to yield when thresholds are hit."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              title="Yield Strategies"
              description="Earn ~5% APY on idle funds with Circle USYC, backed by US Treasury securities."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
              title="Multi-Wallet"
              description="Connect multiple wallets across chains and view unified balances in one place."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
              <div className="space-y-8">
                <StepCard
                  number={1}
                  title="Connect Your Wallets"
                  description="Link wallets from Ethereum, Base, Arbitrum, Polygon, and more. View all balances unified."
                />
                <StepCard
                  number={2}
                  title="Configure Policies"
                  description="Set balance thresholds and choose your yield strategy. USYC offers stable ~5% APY."
                />
                <StepCard
                  number={3}
                  title="Optimize Automatically"
                  description="Excess funds are auto-deposited to yield. Execute cross-chain transfers instantly."
                />
              </div>
            </div>
            <div className="glass-card p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[#FDF5F0] rounded-xl border border-[#F4673B]/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4673B] to-[#FF8A65] flex items-center justify-center">
                    <EthereumLogo />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Ethereum</p>
                    <p className="text-xs text-gray-500">1,250.00 USDC</p>
                  </div>
                  <span className="text-xs text-[#F4673B] font-semibold">+2.3%</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-[#FDF5F0] rounded-xl border border-[#F4673B]/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4673B] to-[#FF8A65] flex items-center justify-center text-white font-bold text-sm">B</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Base</p>
                    <p className="text-xs text-gray-500">820.50 USDC</p>
                  </div>
                  <span className="text-xs text-[#F4673B] font-semibold">+1.8%</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-[#FDF5F0] rounded-xl border border-[#F4673B]/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4673B] to-[#FF8A65] flex items-center justify-center text-white font-bold text-sm">P</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Polygon</p>
                    <p className="text-xs text-gray-500">430.25 USDC</p>
                  </div>
                  <span className="text-xs text-[#F4673B] font-semibold">+0.9%</span>
                </div>
                <div className="border-t border-[#F4673B]/10 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Balance</span>
                    <span className="text-xl font-bold text-gray-900">$2,500.75</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Networks - With real logos in theme colors */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Supported Networks</h2>
          <p className="text-gray-500 mb-12">Seamlessly manage assets across major EVM chains.</p>

          <div className="flex flex-wrap justify-center gap-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#FDF5F0] border border-[#F4673B]/10 flex items-center justify-center hover:scale-110 transition-transform">
                <EthereumLogo />
              </div>
              <span className="text-sm font-medium text-gray-600">Ethereum</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#FDF5F0] border border-[#F4673B]/10 flex items-center justify-center hover:scale-110 transition-transform">
                <BaseLogo />
              </div>
              <span className="text-sm font-medium text-gray-600">Base</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#FDF5F0] border border-[#F4673B]/10 flex items-center justify-center hover:scale-110 transition-transform">
                <ArbitrumLogo />
              </div>
              <span className="text-sm font-medium text-gray-600">Arbitrum</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#FDF5F0] border border-[#F4673B]/10 flex items-center justify-center hover:scale-110 transition-transform">
                <PolygonLogo />
              </div>
              <span className="text-sm font-medium text-gray-600">Polygon</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#FDF5F0] border border-[#F4673B]/10 flex items-center justify-center hover:scale-110 transition-transform">
                <OptimismLogo />
              </div>
              <span className="text-sm font-medium text-gray-600">Optimism</span>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations - With real logos in theme colors */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Powered By</h2>
          <p className="text-gray-500 mb-12">Built on trusted infrastructure for secure, reliable operations.</p>

          <div className="flex flex-wrap justify-center gap-16 items-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-[#FDF5F0] border border-[#F4673B]/10 flex items-center justify-center hover:scale-110 transition-transform">
                <CircleLogo />
              </div>
              <span className="text-sm font-medium text-gray-600">Circle</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-[#FDF5F0] border border-[#F4673B]/10 flex items-center justify-center hover:scale-110 transition-transform">
                <ArcLogo />
              </div>
              <span className="text-sm font-medium text-gray-600">Arc</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 border-t-4 border-t-[#F4673B]">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Optimize Your Treasury?</h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">
              Start aggregating balances and earning yield on your multi-chain assets today.
            </p>
            <Link href="/dashboard" className="btn-primary text-lg px-10 py-4">
              Launch App
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-gray-900">Merge<span className="text-[#F4673B]">Pay</span></span>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 MergePay. Built for the multi-chain future.
          </p>
        </div>
      </footer>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes flow {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-flow1, .animate-flow2, .animate-flow3, .animate-flow4 {
          animation: flow 1.5s linear infinite;
        }
        .animate-flow2 { animation-delay: 0.2s; }
        .animate-flow3 { animation-delay: 0.4s; }
        .animate-flow4 { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
}
