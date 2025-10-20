import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import ethereumLogo from '@/assets/ethereum-logo.svg';
import exstratWordmark from '@/assets/exstrat-wordmark.svg';
import { useState } from "react";
import BetaSignupModal from "./BetaSignupModal";
const Hero = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return <section className="relative min-h-screen flex items-center justify-center pt-24 md:pt-32 pb-16 md:pb-24 px-[4vw] md:px-[5vw] overflow-hidden" style={{
    backgroundColor: '#F9FBFE'
  }}>

      <div className="mx-auto max-w-[1600px] w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left side - Text content */}
          <div className="space-y-6 md:space-y-8 animate-fade-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[#1A1A1A]">
              Préparez votre bullrun et visualisez vos gains{" "}
              <span className="inline-flex items-baseline" aria-label="exStrat">
                
              </span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-[#333333] leading-relaxed max-w-full lg:max-w-[600px]">
              exStrat est le premier outil crypto qui permet aux investisseurs de{" "}
              <span className="font-semibold text-foreground">
                créer, comparer et simuler leurs stratégies de prise de profit
              </span>{" "}
              afin d'optimiser leurs sorties et d'éviter les décisions impulsives.
            </p>

            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-primary">
                  Le projet vous intéresse ?
                </p>
                <p className="text-lg font-semibold text-[#1A1A1A]">
                  Rejoignez la liste des bêta-testeurs.
                </p>
              </div>

              <Button onClick={() => setIsModalOpen(true)} size="lg" className="text-base font-bold h-auto px-10 py-5 rounded-xl shadow-[0px_4px_20px_rgba(4,125,213,0.25)] hover:bg-secondary hover:shadow-[0px_8px_30px_rgba(246,133,27,0.35)] hover:scale-105 transition-all duration-300 animate-fade-up" style={{
              animationDelay: '200ms'
            }}>
                Rejoindre la bêta
              </Button>

              <p className="text-sm text-[#666666] max-w-[500px] animate-fade-in" style={{
              animationDelay: '400ms'
            }}>
                La liste est limitée à 50 places. Devenez l'un des premiers à construire exStrat avec nous.
              </p>
            </div>
          </div>

          {/* Right side - Illustration principale */}
          <div className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] animate-slide-in-right">
            <svg className="w-full h-full max-w-full" viewBox="0 0 700 700" fill="none" preserveAspectRatio="xMidYMid meet">
              <defs>
                {/* Main gradient for growth curve */}
                <linearGradient id="heroGrowthGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" style={{
                  stopColor: '#047DD5',
                  stopOpacity: 1
                }} />
                  <stop offset="50%" style={{
                  stopColor: '#3CB4A3',
                  stopOpacity: 1
                }} />
                  <stop offset="100%" style={{
                  stopColor: '#2ECC71',
                  stopOpacity: 1
                }} />
                </linearGradient>

                {/* Glow filter */}
                <filter id="heroGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Card shadow filter */}
                <filter id="cardShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                  <feOffset dx="0" dy="2" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.05" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Secondary curves gradients */}
                <linearGradient id="secondaryCurve1" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" style={{
                  stopColor: '#D1D5DB',
                  stopOpacity: 0.3
                }} />
                  <stop offset="100%" style={{
                  stopColor: '#9CA3AF',
                  stopOpacity: 0.3
                }} />
                </linearGradient>

                <linearGradient id="secondaryCurve2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" style={{
                  stopColor: '#3CB4A3',
                  stopOpacity: 0.2
                }} />
                  <stop offset="100%" style={{
                  stopColor: '#3CB4A3',
                  stopOpacity: 0.2
                }} />
                </linearGradient>

                <linearGradient id="secondaryCurve3" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" style={{
                  stopColor: '#F6851B',
                  stopOpacity: 0.2
                }} />
                  <stop offset="100%" style={{
                  stopColor: '#F6851B',
                  stopOpacity: 0.2
                }} />
                </linearGradient>

                {/* Flow gradient */}
                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{
                  stopColor: '#047DD5',
                  stopOpacity: 0.6
                }} />
                  <stop offset="100%" style={{
                  stopColor: '#047DD5',
                  stopOpacity: 0.2
                }} />
                </linearGradient>

                {/* Card gradient background */}
                <linearGradient id="cardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{
                  stopColor: '#FFFFFF',
                  stopOpacity: 1
                }} />
                  <stop offset="100%" style={{
                  stopColor: '#EAF4FA',
                  stopOpacity: 0.3
                }} />
                </linearGradient>

                {/* TP connection gradients */}
                <linearGradient id="tpConnectionGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{
                  stopColor: '#047DD5',
                  stopOpacity: 0.3
                }} />
                  <stop offset="100%" style={{
                  stopColor: '#047DD5',
                  stopOpacity: 0.6
                }} />
                </linearGradient>

                <linearGradient id="tpConnectionGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{
                  stopColor: '#3CB4A3',
                  stopOpacity: 0.3
                }} />
                  <stop offset="100%" style={{
                  stopColor: '#3CB4A3',
                  stopOpacity: 0.6
                }} />
                </linearGradient>

                <linearGradient id="tpConnectionGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{
                  stopColor: '#2ECC71',
                  stopOpacity: 0.3
                }} />
                  <stop offset="100%" style={{
                  stopColor: '#2ECC71',
                  stopOpacity: 0.6
                }} />
                </linearGradient>

                <linearGradient id="tpConnectionGradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{
                  stopColor: '#2ECC71',
                  stopOpacity: 0.3
                }} />
                  <stop offset="100%" style={{
                  stopColor: '#2ECC71',
                  stopOpacity: 0.6
                }} />
                </linearGradient>
              </defs>

              {/* Stratégie ETH 1 Card (Top Left) - Scaled to 92% */}
              <g className="animate-fade-in" style={{
              animationDelay: '0.2s'
            }}>
                {/* Card background */}
                <rect x="18.4" y="18.4" width="296.24" height="303.6" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1" opacity="0.95" filter="url(#cardShadow)" />
                
                {/* Card title */}
                <text x="36.8" y="50.6" fill="#1A1A1A" fontSize="14.72" fontWeight="600" fontFamily="Roboto Flex">
                  Stratégie ETH 1
                </text>

                {/* TP1 Row */}
                <g className="animate-fade-in" style={{
                animationDelay: '0.4s'
              }}>
                  <rect x="36.8" y="64.4" width="253.92" height="52.9" rx="8" fill="#F9FAFB" stroke="#047DD5" strokeWidth="2" opacity="0.8" />
                  <image href={ethereumLogo} x="50.14" y="82.57" width="16.56" height="16.56" />
                  <text x="79.58" y="84.87" fill="#333333" fontSize="11.64" fontFamily="Roboto Flex">TP1</text>
                  <text x="79.58" y="100.14" fill="#047DD5" fontSize="13.75" fontWeight="600" fontFamily="Roboto Flex">2 500 $</text>
                  <text x="253.92" y="84.87" fill="#6B7280" fontSize="11.64" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
                  <text x="253.92" y="100.14" fill="#6B7280" fontSize="12.7" fontFamily="Roboto Flex" textAnchor="end">25%</text>
                </g>

                {/* TP2 Row */}
                <g className="animate-fade-in" style={{
                animationDelay: '0.5s'
              }}>
                  <rect x="36.8" y="126.5" width="253.92" height="52.9" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1" />
                  <image href={ethereumLogo} x="50.14" y="144.67" width="16.56" height="16.56" />
                  <text x="79.58" y="146.97" fill="#333333" fontSize="11.64" fontFamily="Roboto Flex">TP2</text>
                  <text x="79.58" y="162.24" fill="#3CB4A3" fontSize="13.75" fontWeight="600" fontFamily="Roboto Flex">3 400 $</text>
                  <text x="253.92" y="146.97" fill="#6B7280" fontSize="11.64" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
                  <text x="253.92" y="162.24" fill="#6B7280" fontSize="12.7" fontFamily="Roboto Flex" textAnchor="end">30%</text>
                </g>

                {/* TP3 Row */}
                <g className="animate-fade-in" style={{
                animationDelay: '0.6s'
              }}>
                  <rect x="36.8" y="188.6" width="253.92" height="52.9" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1" />
                  <image href={ethereumLogo} x="50.14" y="206.77" width="16.56" height="16.56" />
                  <text x="79.58" y="209.07" fill="#333333" fontSize="11.64" fontFamily="Roboto Flex">TP3</text>
                  <text x="79.58" y="224.34" fill="#2ECC71" fontSize="13.75" fontWeight="600" fontFamily="Roboto Flex">4 800 $</text>
                  <text x="253.92" y="209.07" fill="#6B7280" fontSize="11.64" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
                  <text x="253.92" y="224.34" fill="#6B7280" fontSize="12.7" fontFamily="Roboto Flex" textAnchor="end">25%</text>
                </g>

                {/* TP4 Row */}
                <g className="animate-fade-in" style={{
                animationDelay: '0.7s'
              }}>
                  <rect x="36.8" y="250.7" width="253.92" height="52.9" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1" />
                  <image href={ethereumLogo} x="50.14" y="268.87" width="16.56" height="16.56" />
                  <text x="79.58" y="271.17" fill="#333333" fontSize="11.64" fontFamily="Roboto Flex">TP4</text>
                  <text x="79.58" y="286.44" fill="#2ECC71" fontSize="13.75" fontWeight="600" fontFamily="Roboto Flex">6 000 $</text>
                  <text x="253.92" y="271.17" fill="#6B7280" fontSize="11.64" fontFamily="Roboto Flex" textAnchor="end">Vendre</text>
                  <text x="253.92" y="286.44" fill="#6B7280" fontSize="12.7" fontFamily="Roboto Flex" textAnchor="end">20%</text>
                </g>
              </g>

              {/* Connection lines from Stratégie ETH 1 to TPs on curve - More visible */}
              <line x1="290.72" y1="90.85" x2="300" y2="460" stroke="url(#tpConnectionGradient1)" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" className="animate-fade-in" style={{
              animationDelay: '0.7s'
            }} />
              <line x1="290.72" y1="152.95" x2="420" y2="380" stroke="url(#tpConnectionGradient2)" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" className="animate-fade-in" style={{
              animationDelay: '0.8s'
            }} />
              <line x1="290.72" y1="215.05" x2="540" y2="300" stroke="url(#tpConnectionGradient3)" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" className="animate-fade-in" style={{
              animationDelay: '0.9s'
            }} />
              <line x1="290.72" y1="277.15" x2="650" y2="220" stroke="url(#tpConnectionGradient4)" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" className="animate-fade-in" style={{
              animationDelay: '1s'
            }} />


              {/* Secondary background curves (scenarios) */}
              <path d="M 100 600 Q 200 500, 300 450 T 500 350 T 650 280" stroke="url(#secondaryCurve1)" strokeWidth="3" fill="none" strokeLinecap="round" className="animate-fade-in" style={{
              animationDelay: '0.2s',
              animationDuration: '1.5s'
            }} />
              <path d="M 100 580 Q 190 480, 280 420 T 480 300 T 630 200" stroke="url(#secondaryCurve2)" strokeWidth="3" fill="none" strokeLinecap="round" className="animate-fade-in" style={{
              animationDelay: '0.3s',
              animationDuration: '1.5s'
            }} />
              <path d="M 100 590 Q 210 490, 310 440 T 520 330 T 660 240" stroke="url(#secondaryCurve3)" strokeWidth="3" fill="none" strokeLinecap="round" className="animate-fade-in" style={{
              animationDelay: '0.4s',
              animationDuration: '1.5s'
            }} />

              {/* Main growth curve */}
              <path d="M 100 620 Q 200 520, 300 460 T 500 340 T 650 220" stroke="url(#heroGrowthGradient)" strokeWidth="5" fill="none" strokeLinecap="round" filter="url(#heroGlow)" className="animate-fade-in" style={{
              animationDelay: '0.5s',
              animationDuration: '1.2s'
            }} />

              {/* Wallet icon at origin */}
              <circle cx="100" cy="620" r="24" fill="white" stroke="#047DD5" strokeWidth="2" className="animate-fade-in" style={{
              animationDelay: '0.6s'
            }} />
              <g transform="translate(88, 608)" className="animate-fade-in" style={{
              animationDelay: '0.6s'
            }}>
                <path d="M 3 6 h 18 M 7 10 h 1 m 4 0 h 1 M 6 4 h 12 a 2 2 0 0 1 2 2 v 8 a 2 2 0 0 1 -2 2 H 6 a 2 2 0 0 1 -2 -2 V 6 a 2 2 0 0 1 2 -2 z" stroke="#047DD5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Flow lines from wallet to TPs */}
              <path d="M 100 620 L 300 460" stroke="url(#flowGradient)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-fade-in" style={{
              animationDelay: '0.7s'
            }} />
              <path d="M 100 620 L 420 380" stroke="url(#flowGradient)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-fade-in" style={{
              animationDelay: '0.8s'
            }} />
              <path d="M 100 620 L 540 300" stroke="url(#flowGradient)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-fade-in" style={{
              animationDelay: '0.9s'
            }} />
              <path d="M 100 620 L 650 220" stroke="url(#flowGradient)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-fade-in" style={{
              animationDelay: '1s'
            }} />

              {/* TP1 - Blue */}
              <g className="animate-scale-in" style={{
              animationDelay: '1.1s'
            }}>
                <line x1="300" y1="460" x2="300" y2="420" stroke="#047DD5" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
                <circle cx="300" cy="460" r="10" fill="#047DD5" stroke="white" strokeWidth="3" filter="url(#heroGlow)" />
                <circle cx="300" cy="460" r="6" fill="white" opacity="0.8" />
                <rect x="275" y="400" width="50" height="26" rx="6" fill="white" stroke="#047DD5" strokeWidth="1.5" opacity="0.95" />
                <text x="300" y="417" textAnchor="middle" className="text-[12px] font-bold fill-[#047DD5]">TP1</text>
                
                {/* Bell notification icon for TP1 - Moved up 3px */}
                <circle cx="300" cy="375" r="20" fill="#F6851B" opacity="0.2" className="animate-pulse" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))" />
                <g transform="translate(287.5, 362.5)">
                  <path d="M 12 4 a 4 4 0 0 0 -4 4 v 2 a 8 8 0 0 1 -2 5 L 4 18 h 16 l -2 -3 A 8 8 0 0 1 16 10 V 8 a 4 4 0 0 0 -4 -4 Z M 10 20 a 2 2 0 1 0 4 0" fill="#F6851B" stroke="none" />
                </g>
              </g>

              {/* TP2 - Turquoise */}
              <g className="animate-scale-in" style={{
              animationDelay: '1.3s'
            }}>
                <line x1="420" y1="380" x2="420" y2="340" stroke="#3CB4A3" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
                <circle cx="420" cy="380" r="10" fill="#3CB4A3" stroke="white" strokeWidth="3" filter="url(#heroGlow)" />
                <circle cx="420" cy="380" r="6" fill="white" opacity="0.8" />
                <rect x="395" y="320" width="50" height="26" rx="6" fill="white" stroke="#3CB4A3" strokeWidth="1.5" opacity="0.95" />
                <text x="420" y="337" textAnchor="middle" className="text-[12px] font-bold fill-[#3CB4A3]">TP2</text>
                
                {/* Bell notification icon for TP2 - Moved up 3px */}
                <circle cx="420" cy="295" r="20" fill="#F6851B" opacity="0.2" className="animate-pulse" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))" />
                <g transform="translate(407.5, 282.5)">
                  <path d="M 12 4 a 4 4 0 0 0 -4 4 v 2 a 8 8 0 0 1 -2 5 L 4 18 h 16 l -2 -3 A 8 8 0 0 1 16 10 V 8 a 4 4 0 0 0 -4 -4 Z M 10 20 a 2 2 0 1 0 4 0" fill="#F6851B" stroke="none" />
                </g>
              </g>

              {/* TP3 - Green */}
              <g className="animate-scale-in" style={{
              animationDelay: '1.5s'
            }}>
                <line x1="540" y1="300" x2="540" y2="260" stroke="#2ECC71" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
                <circle cx="540" cy="300" r="10" fill="#2ECC71" stroke="white" strokeWidth="3" filter="url(#heroGlow)" />
                <circle cx="540" cy="300" r="6" fill="white" opacity="0.8" />
                <rect x="515" y="240" width="50" height="26" rx="6" fill="white" stroke="#2ECC71" strokeWidth="1.5" opacity="0.95" />
                <text x="540" y="257" textAnchor="middle" className="text-[12px] font-bold fill-[#2ECC71]">TP3</text>
                
                {/* Bell notification icon for TP3 - Moved up 3px */}
                <circle cx="540" cy="215" r="20" fill="#F6851B" opacity="0.2" className="animate-pulse" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))" />
                <g transform="translate(527.5, 202.5)">
                  <path d="M 12 4 a 4 4 0 0 0 -4 4 v 2 a 8 8 0 0 1 -2 5 L 4 18 h 16 l -2 -3 A 8 8 0 0 1 16 10 V 8 a 4 4 0 0 0 -4 -4 Z M 10 20 a 2 2 0 1 0 4 0" fill="#F6851B" stroke="none" />
                </g>
              </g>

              {/* TP4 - Bright Green */}
              <g className="animate-scale-in" style={{
              animationDelay: '1.7s'
            }}>
                <line x1="650" y1="220" x2="650" y2="180" stroke="#2ECC71" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
                <circle cx="650" cy="220" r="10" fill="#2ECC71" stroke="white" strokeWidth="3" filter="url(#heroGlow)" />
                <circle cx="650" cy="220" r="6" fill="white" opacity="0.8" />
                <rect x="625" y="160" width="50" height="26" rx="6" fill="white" stroke="#2ECC71" strokeWidth="1.5" opacity="0.95" />
                <text x="650" y="177" textAnchor="middle" className="text-[12px] font-bold fill-[#2ECC71]">TP4</text>
                
                {/* Bell notification icon for TP4 - Moved up 3px */}
                <circle cx="650" cy="135" r="20" fill="#F6851B" opacity="0.2" className="animate-pulse" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))" />
                <g transform="translate(637.5, 122.5)">
                  <path d="M 12 4 a 4 4 0 0 0 -4 4 v 2 a 8 8 0 0 1 -2 5 L 4 18 h 16 l -2 -3 A 8 8 0 0 1 16 10 V 8 a 4 4 0 0 0 -4 -4 Z M 10 20 a 2 2 0 1 0 4 0" fill="#F6851B" stroke="none" />
                </g>
              </g>

              {/* Prévision card (Bottom Right) - Repositioned 7% up and slightly left */}
              <g className="animate-fade-in" style={{
              animationDelay: '1.9s'
            }}>
                <rect x="400" y="430" width="278.2" height="246.1" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1" opacity="0.95" filter="url(#cardShadow)" />
                
                {/* Card title */}
                <text x="420.8" y="467.56" fill="#1A1A1A" fontSize="17.12" fontWeight="600" fontFamily="Roboto Flex">
                  Prévision
                </text>
                
                {/* Sous-encart 1 - Profit total */}
                <g className="animate-fade-in" style={{
                animationDelay: '2s'
              }}>
                  <rect x="420.8" y="484.61" width="239.68" height="49.22" rx="8" fill="white" stroke="#E0E0E0" strokeWidth="1" />
                  <text x="433.64" y="514.22" fill="#333333" fontSize="13.54" fontFamily="Roboto Flex">Profit total</text>
                  <text x="647.84" y="514.22" textAnchor="end" fill="#2ECC71" fontSize="16" fontWeight="600" fontFamily="Roboto Flex">$16 630</text>
                </g>
                
                {/* Sous-encart 2 - Rendement global */}
                <g className="animate-fade-in" style={{
                animationDelay: '2.1s'
              }}>
                  <rect x="420.8" y="543.53" width="239.68" height="49.22" rx="8" fill="white" stroke="#E0E0E0" strokeWidth="1" />
                  <text x="433.64" y="573.14" fill="#333333" fontSize="13.54" fontFamily="Roboto Flex">Rendement global</text>
                  <text x="647.84" y="573.14" textAnchor="end" fill="#2ECC71" fontSize="16" fontWeight="600" fontFamily="Roboto Flex">+59 %</text>
                </g>
                
                {/* Sous-encart 3 - Valeur projetée */}
                <g className="animate-fade-in" style={{
                animationDelay: '2.2s'
              }}>
                  <rect x="420.8" y="602.45" width="239.68" height="49.22" rx="8" fill="white" stroke="#E0E0E0" strokeWidth="1" />
                  <text x="433.64" y="632.06" fill="#333333" fontSize="13.54" fontFamily="Roboto Flex">Valeur projetée</text>
                  <text x="647.84" y="632.06" textAnchor="end" fill="#2ECC71" fontSize="16" fontWeight="600" fontFamily="Roboto Flex">$28 500</text>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <BetaSignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>;
};
export default Hero;