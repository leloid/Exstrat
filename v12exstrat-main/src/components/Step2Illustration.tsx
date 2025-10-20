import solanaLogo from "@/assets/solana-logo.png";

const Step2Illustration = () => {
  return (
    <div className="relative w-full py-12 px-6 overflow-hidden">
      {/* Blurred background layer */}
      <div 
        className="absolute inset-0 bg-[#F9FBFE]"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, black 40%, transparent 100%)'
        }}
      />
      
      {/* Container for the three strategy cards */}
      <svg
        viewBox="0 0 1300 580"
        className="relative w-full h-auto max-w-[1300px] mx-auto z-10"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Shadow filter */}
          <filter id="cardShadow2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.08" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glow filter for icons */}
          <filter id="iconGlow2">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Edge blur filter for background */}
          <filter id="edgeBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0" />
          </filter>

          {/* Gradient mask for feathered edges */}
          <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0 }} />
            <stop offset="5%" style={{ stopColor: 'white', stopOpacity: 1 }} />
            <stop offset="95%" style={{ stopColor: 'white', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0 }} />
          </linearGradient>

          <mask id="edgeMask">
            <rect x="0" y="0" width="1300" height="580" fill="url(#fadeGradient)" />
          </mask>
        </defs>

        {/* Background with feathered edges */}
        <rect x="0" y="0" width="1300" height="580" fill="#F9FBFE" mask="url(#edgeMask)" />

        {/* CARD 1 - Stratégie Fibonacci (Blue) - 3 TPs */}
        <g className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {/* Main card */}
          <rect x="50" y="50" width="370" height="480" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1" filter="url(#cardShadow2)" />
          
          {/* Title */}
          <text x="70" y="90" fill="#1A1A1A" fontSize="20" fontWeight="600" fontFamily="Roboto Flex">Stratégie Fibonacci</text>
          
          {/* TP1 */}
          <rect x="70" y="115" width="330" height="95" rx="12" fill="#F0F9FF" stroke="#BFDBFE" strokeWidth="1.5" />
          <image href={solanaLogo} x="77" y="137" width="36" height="36" />
          <circle cx="95" cy="155" r="18" fill="#3B82F6" opacity="0.15" filter="url(#iconGlow2)" />
          <text x="125" y="150" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex">TP1</text>
          <text x="340" y="150" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
          <text x="125" y="175" fill="#3B82F6" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$200</text>
          <text x="340" y="175" fill="#3B82F6" fontSize="20" fontWeight="700" fontFamily="Roboto Flex" textAnchor="end">30%</text>

          {/* TP2 */}
          <rect x="70" y="225" width="330" height="95" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          <image href={solanaLogo} x="77" y="247" width="36" height="36" />
          <circle cx="95" cy="265" r="18" fill="#3B82F6" opacity="0.15" filter="url(#iconGlow2)" />
          <text x="125" y="260" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex">TP2</text>
          <text x="340" y="260" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
          <text x="125" y="285" fill="#3B82F6" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$220</text>
          <text x="340" y="285" fill="#3B82F6" fontSize="20" fontWeight="700" fontFamily="Roboto Flex" textAnchor="end">50%</text>

          {/* TP3 */}
          <rect x="70" y="335" width="330" height="95" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          <image href={solanaLogo} x="77" y="357" width="36" height="36" />
          <circle cx="95" cy="375" r="18" fill="#3B82F6" opacity="0.15" filter="url(#iconGlow2)" />
          <text x="125" y="370" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex">TP3</text>
          <text x="340" y="370" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
          <text x="125" y="395" fill="#3B82F6" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$270</text>
          <text x="340" y="395" fill="#3B82F6" fontSize="20" fontWeight="700" fontFamily="Roboto Flex" textAnchor="end">20%</text>

          {/* Projections */}
          <rect x="70" y="448" width="160" height="60" rx="12" fill="white" stroke="#D0D5DD" strokeWidth="1" />
          <text x="90" y="473" fill="#6B7280" fontSize="12" fontFamily="Roboto Flex">Valeur projetée</text>
          <text x="90" y="498" fill="#10B981" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$28 000</text>
          
          <rect x="240" y="448" width="160" height="60" rx="12" fill="white" stroke="#D0D5DD" strokeWidth="1" />
          <text x="260" y="473" fill="#6B7280" fontSize="12" fontFamily="Roboto Flex">Rendement projeté</text>
          <text x="260" y="498" fill="#10B981" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">+62%</text>
        </g>

        {/* CARD 2 - Stratégie Momentum (Orange) - 2 TPs */}
        <g className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {/* Main card */}
          <rect x="465" y="50" width="370" height="370" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1" filter="url(#cardShadow2)" />
          
          {/* Title */}
          <text x="485" y="90" fill="#1A1A1A" fontSize="20" fontWeight="600" fontFamily="Roboto Flex">Stratégie Momentum</text>
          
          {/* TP1 */}
          <rect x="485" y="115" width="330" height="95" rx="12" fill="#FFF7ED" stroke="#FED7AA" strokeWidth="1.5" />
          <image href={solanaLogo} x="492" y="137" width="36" height="36" />
          <circle cx="510" cy="155" r="18" fill="#F97316" opacity="0.15" filter="url(#iconGlow2)" />
          <text x="540" y="150" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex">TP1</text>
          <text x="755" y="150" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
          <text x="540" y="175" fill="#F97316" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$175</text>
          <text x="755" y="175" fill="#F97316" fontSize="20" fontWeight="700" fontFamily="Roboto Flex" textAnchor="end">50%</text>

          {/* TP2 */}
          <rect x="485" y="225" width="330" height="95" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          <image href={solanaLogo} x="492" y="247" width="36" height="36" />
          <circle cx="510" cy="265" r="18" fill="#F97316" opacity="0.15" filter="url(#iconGlow2)" />
          <text x="540" y="260" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex">TP2</text>
          <text x="755" y="260" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
          <text x="540" y="285" fill="#F97316" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$240</text>
          <text x="755" y="285" fill="#F97316" fontSize="20" fontWeight="700" fontFamily="Roboto Flex" textAnchor="end">50%</text>

          {/* Projections */}
          <rect x="485" y="338" width="160" height="60" rx="12" fill="white" stroke="#D0D5DD" strokeWidth="1" />
          <text x="505" y="363" fill="#6B7280" fontSize="12" fontFamily="Roboto Flex">Valeur projetée</text>
          <text x="505" y="388" fill="#10B981" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$26 500</text>
          
          <rect x="655" y="338" width="160" height="60" rx="12" fill="white" stroke="#D0D5DD" strokeWidth="1" />
          <text x="675" y="363" fill="#6B7280" fontSize="12" fontFamily="Roboto Flex">Rendement projeté</text>
          <text x="675" y="388" fill="#10B981" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">+54%</text>
        </g>

        {/* CARD 3 - Stratégie Long Term Exit (Purple) - 4 TPs */}
        <g className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          {/* Main card */}
          <rect x="880" y="50" width="370" height="480" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1" filter="url(#cardShadow2)" />
          
          {/* Title */}
          <text x="900" y="90" fill="#1A1A1A" fontSize="20" fontWeight="600" fontFamily="Roboto Flex">Stratégie Long Term</text>
          
          {/* TP1 */}
          <rect x="900" y="115" width="330" height="70" rx="12" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="1.5" />
          <image href={solanaLogo} x="907" y="130" width="36" height="36" />
          <circle cx="925" cy="145" r="18" fill="#A855F7" opacity="0.15" filter="url(#iconGlow2)" />
          <text x="955" y="143" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex">TP1</text>
          <text x="1170" y="143" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
          <text x="955" y="165" fill="#A855F7" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$180</text>
          <text x="1170" y="165" fill="#A855F7" fontSize="20" fontWeight="700" fontFamily="Roboto Flex" textAnchor="end">10%</text>

          {/* TP2 */}
          <rect x="900" y="200" width="330" height="70" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          <image href={solanaLogo} x="907" y="215" width="36" height="36" />
          <circle cx="925" cy="230" r="18" fill="#A855F7" opacity="0.15" filter="url(#iconGlow2)" />
          <text x="955" y="228" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex">TP2</text>
          <text x="1170" y="228" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
          <text x="955" y="250" fill="#A855F7" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$220</text>
          <text x="1170" y="250" fill="#A855F7" fontSize="20" fontWeight="700" fontFamily="Roboto Flex" textAnchor="end">20%</text>

          {/* TP3 */}
          <rect x="900" y="285" width="330" height="70" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          <image href={solanaLogo} x="907" y="300" width="36" height="36" />
          <circle cx="925" cy="315" r="18" fill="#A855F7" opacity="0.15" filter="url(#iconGlow2)" />
          <text x="955" y="313" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex">TP3</text>
          <text x="1170" y="313" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
          <text x="955" y="335" fill="#A855F7" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$260</text>
          <text x="1170" y="335" fill="#A855F7" fontSize="20" fontWeight="700" fontFamily="Roboto Flex" textAnchor="end">30%</text>

          {/* TP4 */}
          <rect x="900" y="370" width="330" height="70" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1" />
          <image href={solanaLogo} x="907" y="385" width="36" height="36" />
          <circle cx="925" cy="400" r="18" fill="#A855F7" opacity="0.15" filter="url(#iconGlow2)" />
          <text x="955" y="398" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex">TP4</text>
          <text x="1170" y="398" fill="#6B7280" fontSize="14" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
          <text x="955" y="420" fill="#A855F7" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$320</text>
          <text x="1170" y="420" fill="#A855F7" fontSize="20" fontWeight="700" fontFamily="Roboto Flex" textAnchor="end">40%</text>

          {/* Projections */}
          <rect x="900" y="448" width="160" height="60" rx="12" fill="white" stroke="#D0D5DD" strokeWidth="1" />
          <text x="920" y="473" fill="#6B7280" fontSize="12" fontFamily="Roboto Flex">Valeur projetée</text>
          <text x="920" y="498" fill="#10B981" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">$31 200</text>
          
          <rect x="1070" y="448" width="160" height="60" rx="12" fill="white" stroke="#D0D5DD" strokeWidth="1" />
          <text x="1090" y="473" fill="#6B7280" fontSize="12" fontFamily="Roboto Flex">Rendement projeté</text>
          <text x="1090" y="498" fill="#10B981" fontSize="18" fontWeight="600" fontFamily="Roboto Flex">+73%</text>
        </g>
      </svg>
    </div>
  );
};

export default Step2Illustration;
