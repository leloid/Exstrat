import btcLogo from "@/assets/bitcoin-logo.png";
import ethLogo from "@/assets/ethereum-logo.svg";
import solLogo from "@/assets/solana-logo-step3.png";
import xrpLogo from "@/assets/xrp-logo.png";

const Step3Illustration = () => {
  return (
    <div className="relative w-full mx-auto" style={{ backgroundColor: '#F9FBFE' }}>
      <svg
        viewBox="0 0 1300 720"
        className="w-full h-auto"
        style={{ backgroundColor: '#F9FBFE' }}
      >
        <defs>
          {/* Subtle shadow filter */}
          <filter id="cardShadow3" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.1"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* LEFT SIDE - BULLISH STRATEGY */}
        <g id="bullish-section">
          {/* Token icons and strategy labels for Bullish */}
          
          {/* BTC - Stratégie 1 */}
          <g transform="translate(100, 80)">
            <rect x="-50" y="-25" width="100" height="28" rx="14" fill="white" stroke="#D8D8D8" strokeWidth="1"/>
            <text x="0" y="-10" textAnchor="middle" dominantBaseline="middle" fill="#1a1a1a" fontSize="10" fontWeight="700">
              Stratégie 1 BTC
            </text>
            <image href={btcLogo} x="-20" y="15" width="40" height="40"/>
            <line x1="0" y1="55" x2="0" y2="160" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3"/>
          </g>

          {/* ETH - Stratégie 1 */}
          <g transform="translate(220, 80)">
            <rect x="-50" y="-25" width="100" height="28" rx="14" fill="white" stroke="#D8D8D8" strokeWidth="1"/>
            <text x="0" y="-10" textAnchor="middle" dominantBaseline="middle" fill="#1a1a1a" fontSize="10" fontWeight="700">
              Stratégie 1 ETH
            </text>
            <image href={ethLogo} x="-20" y="15" width="40" height="40"/>
            <line x1="0" y1="55" x2="0" y2="160" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3"/>
          </g>

          {/* SOL - Stratégie 3 */}
          <g transform="translate(340, 80)">
            <rect x="-50" y="-25" width="100" height="28" rx="14" fill="white" stroke="#D8D8D8" strokeWidth="1"/>
            <text x="0" y="-10" textAnchor="middle" dominantBaseline="middle" fill="#1a1a1a" fontSize="10" fontWeight="700">
              Stratégie 3 SOL
            </text>
            <image href={solLogo} x="-21" y="14" width="42" height="42"/>
            <line x1="0" y1="56" x2="0" y2="160" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3"/>
          </g>

          {/* XRP - Stratégie 2 */}
          <g transform="translate(460, 80)">
            <rect x="-50" y="-25" width="100" height="28" rx="14" fill="white" stroke="#D8D8D8" strokeWidth="1"/>
            <text x="0" y="-10" textAnchor="middle" dominantBaseline="middle" fill="#1a1a1a" fontSize="10" fontWeight="700">
              Stratégie 2 XRP
            </text>
            <image href={xrpLogo} x="-27.6" y="7.4" width="55.2" height="55.2"/>
            <line x1="0" y1="62.6" x2="0" y2="160" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3"/>
          </g>

          {/* Bullish Card */}
          <g transform="translate(70, 180)">
            <rect width="450" height="280" rx="16" fill="white" stroke="#E3E7EE" strokeWidth="1" filter="url(#cardShadow3)"/>
            
            {/* Blue accent bar */}
            <rect x="0" y="0" width="8" height="280" rx="16" fill="#B9D6FF"/>
            
            {/* Title */}
            <text x="30" y="40" fill="#1a1a1a" fontSize="16" fontWeight="600">
              Projection portfolio
            </text>
            <text x="30" y="62" fill="#1a1a1a" fontSize="16" fontWeight="600">
              Stratégie bull
            </text>
            
            {/* Metric 1 - Projection du portefeuille */}
            <text x="30" y="120" fill="#6B7280" fontSize="13" fontWeight="400">
              Projection du portefeuille
            </text>
            <text x="420" y="120" textAnchor="end" fill="#1a1a1a" fontSize="15" fontWeight="600">
              $91 000
            </text>
            <line x1="30" y1="130" x2="420" y2="130" stroke="#E3E7EE" strokeWidth="1"/>
            
            {/* Metric 2 - Profit net */}
            <text x="30" y="170" fill="#6B7280" fontSize="13" fontWeight="400">
              Profit net
            </text>
            <text x="420" y="170" textAnchor="end" fill="#10B981" fontSize="15" fontWeight="600">
              $56 000
            </text>
            <line x1="30" y1="180" x2="420" y2="180" stroke="#E3E7EE" strokeWidth="1"/>
            
            {/* Metric 3 - Rendement net */}
            <text x="30" y="220" fill="#6B7280" fontSize="13" fontWeight="400">
              Rendement net
            </text>
            <text x="420" y="220" textAnchor="end" fill="#10B981" fontSize="15" fontWeight="600">
              +160 %
            </text>
          </g>
        </g>

        {/* RIGHT SIDE - BEARISH STRATEGY */}
        <g id="bearish-section">
          {/* Token icons and strategy labels for Bearish */}
          
          {/* BTC - Stratégie 2 */}
          <g transform="translate(780, 80)">
            <rect x="-50" y="-25" width="100" height="28" rx="14" fill="white" stroke="#D8D8D8" strokeWidth="1"/>
            <text x="0" y="-10" textAnchor="middle" dominantBaseline="middle" fill="#1a1a1a" fontSize="10" fontWeight="700">
              Stratégie 2 BTC
            </text>
            <image href={btcLogo} x="-20" y="15" width="40" height="40"/>
            <line x1="0" y1="55" x2="0" y2="160" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3"/>
          </g>

          {/* ETH - Stratégie 1 */}
          <g transform="translate(900, 80)">
            <rect x="-50" y="-25" width="100" height="28" rx="14" fill="white" stroke="#D8D8D8" strokeWidth="1"/>
            <text x="0" y="-10" textAnchor="middle" dominantBaseline="middle" fill="#1a1a1a" fontSize="10" fontWeight="700">
              Stratégie 1 ETH
            </text>
            <image href={ethLogo} x="-20" y="15" width="40" height="40"/>
            <line x1="0" y1="55" x2="0" y2="160" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3"/>
          </g>

          {/* SOL - Stratégie 4 */}
          <g transform="translate(1020, 80)">
            <rect x="-50" y="-25" width="100" height="28" rx="14" fill="white" stroke="#D8D8D8" strokeWidth="1"/>
            <text x="0" y="-10" textAnchor="middle" dominantBaseline="middle" fill="#1a1a1a" fontSize="10" fontWeight="700">
              Stratégie 4 SOL
            </text>
            <image href={solLogo} x="-21" y="14" width="42" height="42"/>
            <line x1="0" y1="56" x2="0" y2="160" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3"/>
          </g>

          {/* XRP - Stratégie 1 */}
          <g transform="translate(1140, 80)">
            <rect x="-50" y="-25" width="100" height="28" rx="14" fill="white" stroke="#D8D8D8" strokeWidth="1"/>
            <text x="0" y="-10" textAnchor="middle" dominantBaseline="middle" fill="#1a1a1a" fontSize="10" fontWeight="700">
              Stratégie 1 XRP
            </text>
            <image href={xrpLogo} x="-27.6" y="7.4" width="55.2" height="55.2"/>
            <line x1="0" y1="62.6" x2="0" y2="160" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3"/>
          </g>

          {/* Bearish Card */}
          <g transform="translate(750, 180)">
            <rect width="450" height="280" rx="16" fill="white" stroke="#E3E7EE" strokeWidth="1" filter="url(#cardShadow3)"/>
            
            {/* Orange accent bar */}
            <rect x="0" y="0" width="8" height="280" rx="16" fill="#FFD6A5"/>
            
            {/* Title */}
            <text x="30" y="40" fill="#1a1a1a" fontSize="16" fontWeight="600">
              Projection portfolio
            </text>
            <text x="30" y="62" fill="#1a1a1a" fontSize="16" fontWeight="600">
              Stratégie bear
            </text>
            
            {/* Metric 1 - Projection du portefeuille */}
            <text x="30" y="120" fill="#6B7280" fontSize="13" fontWeight="400">
              Projection du portefeuille
            </text>
            <text x="420" y="120" textAnchor="end" fill="#1a1a1a" fontSize="15" fontWeight="600">
              $63 350
            </text>
            <line x1="30" y1="130" x2="420" y2="130" stroke="#E3E7EE" strokeWidth="1"/>
            
            {/* Metric 2 - Profit net */}
            <text x="30" y="170" fill="#6B7280" fontSize="13" fontWeight="400">
              Profit net
            </text>
            <text x="420" y="170" textAnchor="end" fill="#10B981" fontSize="15" fontWeight="600">
              $28 350
            </text>
            <line x1="30" y1="180" x2="420" y2="180" stroke="#E3E7EE" strokeWidth="1"/>
            
            {/* Metric 3 - Rendement net */}
            <text x="30" y="220" fill="#6B7280" fontSize="13" fontWeight="400">
              Rendement net
            </text>
            <text x="420" y="220" textAnchor="end" fill="#10B981" fontSize="15" fontWeight="600">
              +81 %
            </text>
          </g>
        </g>

        {/* Decorative elements at bottom for balance */}
        <g id="bottom-decoration" opacity="0.3">
          <circle cx="200" cy="580" r="40" fill="#B9D6FF" opacity="0.1"/>
          <circle cx="650" cy="600" r="50" fill="#E6D6FF" opacity="0.1"/>
          <circle cx="1100" cy="580" r="40" fill="#FFD6A5" opacity="0.1"/>
        </g>
      </svg>
    </div>
  );
};

export default Step3Illustration;
