import binanceLogo from '@/assets/binance-logo.png';
import coinbaseLogo from '@/assets/coinbase-logo.png';
import metamaskLogo from '@/assets/metamask-logo.png';

const Step1Illustration = () => {
  return (
    <div className="relative w-full h-auto min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center justify-center bg-gradient-radial from-accent/30 via-background to-background rounded-card p-4 md:p-6 lg:p-8">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* SVG Canvas */}
      <svg className="w-full h-full max-w-full" viewBox="0 0 1100 500" fill="none" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Flow gradient for connection lines */}
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#A7D3F2', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#3CB4A3', stopOpacity: 0.9 }} />
          </linearGradient>

          {/* Particle animation gradient */}
          <linearGradient id="particleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#047DD5', stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: '#047DD5', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#047DD5', stopOpacity: 0 }} />
          </linearGradient>

          {/* Glow filter */}
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Pulse animation */}
          <animate id="pulse" attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
        </defs>

        {/* Connection flow lines */}
        <g className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {/* Line 1: Binance to exStrat */}
          <path
            d="M 120 150 Q 250 150, 380 200"
            stroke="url(#flowGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          
          {/* Line 2: Coinbase to exStrat */}
          <path
            d="M 140 250 Q 260 250, 380 230"
            stroke="url(#flowGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          
          {/* Line 3: MetaMask to exStrat */}
          <path
            d="M 120 350 Q 250 330, 380 260"
            stroke="url(#flowGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Animated particles on lines */}
          <circle r="3" fill="#047DD5" filter="url(#softGlow)">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 120 150 Q 250 150, 380 200" />
          </circle>
          <circle r="3" fill="#3CB4A3" filter="url(#softGlow)">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 140 250 Q 260 250, 380 230" />
          </circle>
          <circle r="3" fill="#047DD5" filter="url(#softGlow)">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 120 350 Q 250 330, 380 260" />
          </circle>
        </g>

        {/* Left side: Wallet/Exchange icons */}
        <g className="animate-slide-in-left">
          {/* Binance (Top) */}
          <g transform="translate(80, 130)">
            <circle cx="20" cy="20" r="24" fill="white" stroke="#E5E7EB" strokeWidth="1.5" filter="url(#softGlow)">
              <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
            </circle>
            <image href={binanceLogo} x="-1.6" y="-1.6" width="51.84" height="51.84" />
          </g>

          {/* Coinbase (Middle) */}
          <g transform="translate(100, 230)">
            <circle cx="20" cy="20" r="24" fill="white" stroke="#E5E7EB" strokeWidth="1.5" filter="url(#softGlow)">
              <animate attributeName="opacity" values="0.9;1;0.9" dur="2.3s" repeatCount="indefinite" />
            </circle>
            <image href={coinbaseLogo} x="-1.6" y="-1.6" width="51.84" height="51.84" />
          </g>

          {/* MetaMask (Bottom) */}
          <g transform="translate(80, 330)">
            <circle cx="20" cy="20" r="24" fill="white" stroke="#E5E7EB" strokeWidth="1.5" filter="url(#softGlow)">
              <animate attributeName="opacity" values="0.9;1;0.9" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <image href={metamaskLogo} x="-1.6" y="-1.6" width="51.84" height="51.84" />
          </g>

        </g>

        {/* Right side: exStrat centralized platform */}
        <g transform="translate(350, 60)" className="animate-scale-in" style={{ animationDelay: '0.5s' }}>
          {/* Main card background */}
          <rect
            x="0"
            y="0"
            width="600"
            height="350"
            rx="20"
            fill="white"
            stroke="#047DD5"
            strokeWidth="2"
            strokeOpacity="0.2"
            filter="url(#softGlow)"
          />

          {/* Glow effect around card */}
          <rect
            x="-6"
            y="-6"
            width="612"
            height="362"
            rx="24"
            fill="none"
            stroke="#047DD5"
            strokeWidth="1"
            strokeOpacity="0.1"
            filter="url(#softGlow)"
          />

          {/* Mini dashboard elements */}
          {/* Header */}
          <text x="300" y="56" fontSize="27" fontWeight="600" fill="#1A1A1A" textAnchor="middle">
            Données centralisées
          </text>

          {/* Data visualization bars */}
          <g transform="translate(37.5, 93.75)">
            {/* Bar 1 */}
            <rect x="0" y="30" width="125" height="15" rx="7.5" fill="#E5E7EB" />
            <rect x="0" y="30" width="93.75" height="15" rx="7.5" fill="#047DD5" opacity="0.6">
              <animate attributeName="width" values="62.5;93.75;62.5" dur="3s" repeatCount="indefinite" />
            </rect>

            {/* Bar 2 */}
            <rect x="0" y="57.5" width="125" height="15" rx="7.5" fill="#E5E7EB" />
            <rect x="0" y="57.5" width="108.75" height="15" rx="7.5" fill="#3CB4A3" opacity="0.6">
              <animate attributeName="width" values="83.75;108.75;83.75" dur="3.5s" repeatCount="indefinite" />
            </rect>

            {/* Bar 3 */}
            <rect x="0" y="85" width="125" height="15" rx="7.5" fill="#E5E7EB" />
            <rect x="0" y="85" width="78.75" height="15" rx="7.5" fill="#F6851B" opacity="0.6">
              <animate attributeName="width" values="52.5;78.75;52.5" dur="4s" repeatCount="indefinite" />
            </rect>
          </g>

          {/* Data pills */}
          <g transform="translate(212.5, 102.5)">
            <circle cx="15" cy="15" r="15" fill="#047DD5" opacity="0.15" />
            <circle cx="15" cy="15" r="7.5" fill="#047DD5" />
            
            <circle cx="75" cy="15" r="15" fill="#3CB4A3" opacity="0.15" />
            <circle cx="75" cy="15" r="7.5" fill="#3CB4A3" />
            
            <circle cx="131.25" cy="15" r="15" fill="#F6851B" opacity="0.15" />
            <circle cx="131.25" cy="15" r="7.5" fill="#F6851B" />
          </g>

          {/* Mini graph line */}
          <g transform="translate(212.5, 156.25)">
            <path
              d="M 0 56.25 L 37.5 47.5 L 75 52.5 L 112.5 37.5 L 150 41.25 L 187.5 27.5"
              stroke="#047DD5"
              strokeWidth="3.75"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
            <circle cx="187.5" cy="27.5" r="6.25" fill="#047DD5" />
          </g>

          {/* Stats */}
          <text x="37.5" y="262.5" fontSize="21" fill="#6B7280">Historique récupéré</text>
          <text x="37.5" y="302.5" fontSize="21" fill="#6B7280">Prix moyens calculés</text>
          <text x="425" y="262.5" fontSize="21" fontWeight="600" fill="#047DD5" textAnchor="end">✓</text>
          <text x="425" y="302.5" fontSize="21" fontWeight="600" fill="#3CB4A3" textAnchor="end">✓</text>
        </g>
      </svg>

    </div>
  );
};

export default Step1Illustration;
