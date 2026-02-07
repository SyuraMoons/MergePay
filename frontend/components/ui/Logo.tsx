export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="40" height="40" rx="12" fill="url(#mergepay_logo_gradient)" />
    <path
      d="M12 20.5L18.5 27L28 13"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0"
    />
    <path
      d="M13 15V25C13 25 15.5 27 18 25V18L20 20L22 18V25C24.5 27 27 25 27 25V15"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="mergepay_logo_gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F4673B" />
        <stop offset="1" stopColor="#FF8A65" />
      </linearGradient>
    </defs>
  </svg>
);

export const LogoText = ({ className = "h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="22" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="24" fill="#111827">
      Merge<tspan fill="#F4673B">Pay</tspan>
    </text>
  </svg>
);
