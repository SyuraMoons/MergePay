'use client';

/**
 * USYCInfoCard - Information card about Circle USYC
 * 
 * Circle's USD Yield Coin (USYC) is a tokenized representation of 
 * investments in US Treasury securities, providing stable yield.
 * 
 * Color palette: Orange (#F4673B), White Bone (#FDF5F0), White
 */
export function USYCInfoCard() {
  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* USYC Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F4673B]/10 to-[#FF8A65]/10 flex items-center justify-center border border-[#F4673B]/20">
            <svg className="w-8 h-8 text-[#F4673B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v2m0 8v2" strokeLinecap="round" />
              <path d="M9.5 10.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 1.38-1.12 2.5-2.5 2.5" strokeLinecap="round" />
              <path d="M9.5 13.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Circle USYC</h3>
            <p className="text-sm text-gray-500">USD Yield Coin</p>
          </div>
        </div>

        {/* APY Badge */}
        <div className="px-4 py-2 bg-gradient-to-r from-[#F4673B]/10 to-[#FF8A65]/10 rounded-xl border border-[#F4673B]/20">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current APY</p>
          <p className="text-2xl font-bold text-[#F4673B]">~5.0%</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-6 leading-relaxed">
        USYC is Circle's tokenized treasury fund, backed by short-duration US Treasury securities.
        It provides stable, low-risk yield while maintaining full USDC redeemability.
      </p>

      {/* Features Grid - Orange/White only */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-[#FDF5F0] rounded-xl text-center border border-[#F4673B]/10">
          <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-white flex items-center justify-center border border-[#F4673B]/20">
            <svg className="w-5 h-5 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-xs font-bold text-gray-900">Very Low Risk</p>
          <p className="text-xs text-gray-500 mt-1">US Treasury backed</p>
        </div>

        <div className="p-4 bg-[#FDF5F0] rounded-xl text-center border border-[#F4673B]/10">
          <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-white flex items-center justify-center border border-[#F4673B]/20">
            <svg className="w-5 h-5 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-xs font-bold text-gray-900">Instant Redeem</p>
          <p className="text-xs text-gray-500 mt-1">Back to USDC anytime</p>
        </div>

        <div className="p-4 bg-[#FDF5F0] rounded-xl text-center border border-[#F4673B]/10">
          <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-white flex items-center justify-center border border-[#F4673B]/20">
            <svg className="w-5 h-5 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-xs font-bold text-gray-900">Auto-Compound</p>
          <p className="text-xs text-gray-500 mt-1">Yield accumulates</p>
        </div>
      </div>

      {/* Footer Link */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Powered by Circle</p>
        <a
          href="https://www.circle.com/usyc"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#F4673B] hover:text-[#E55A30] transition-colors flex items-center gap-1"
        >
          Learn more
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
