import { useState } from "react";
import { GitCompare, BarChart3, History, Play, Wallet, PieChart, CheckCircle2, TrendingUp, Bell, ArrowUpCircle } from "lucide-react";
import compareImg from "@/assets/feature1-compare.png";
import profitsImg from "@/assets/feature2-profits.png";
import backtestImg from "@/assets/feature3-backtest.png";
import activateImg from "@/assets/feature4-activate.png";
import trackerImg from "@/assets/feature5-tracker.png";
import narrativesImg from "@/assets/feature6-narratives.png";
import logoMini from "@/assets/logo-mini.svg";

const features = [
  {
    id: 1,
    icon: GitCompare,
    title: "Créez et comparez vos stratégies token par token",
    image: compareImg,
    alt: "Comparaison de deux stratégies ETH (A vs B)",
  },
  {
    id: 2,
    icon: BarChart3,
    title: "Visualisez vos profits globaux",
    image: profitsImg,
    alt: "Vue globale du portefeuille avec courbe cumulative et contributeurs",
  },
  {
    id: 3,
    icon: History,
    title: "Backtestez vos idées",
    image: backtestImg,
    alt: "Backtest d'une stratégie sur plusieurs cycles",
  },
  {
    id: 4,
    icon: Play,
    title: "Activez vos ordres depuis exStrat",
    image: activateImg,
    alt: "Écran d'activation de stratégies avec ordres programmés sur Binance et Coinbase",
  },
  {
    id: 5,
    icon: Wallet,
    title: "Suivez vos portefeuilles",
    image: trackerImg,
    alt: "Tableau portefeuille avec diagramme profits/pertes et répartition par exchange et token",
  },
  {
    id: 6,
    icon: PieChart,
    title: "Répartition par narratif",
    image: narrativesImg,
    alt: "Camembert montrant la répartition par narratif (RWA, DeFi, IA…)",
  },
];

const WhyExStrat = () => {
  const [activeFeature, setActiveFeature] = useState(features[0]);

  const benefits = [
    {
      icon: Wallet,
      text: "Un espace unique pour suivre l'évolution de vos portefeuilles.",
    },
    {
      icon: Play,
      text: "Créez, activez et synchronisez vos stratégies sur vos exchanges.",
    },
    {
      icon: TrendingUp,
      text: "Visualisez vos progrès et recevez des alertes en temps réel.",
    },
    {
      icon: CheckCircle2,
      text: "Pilotez tout depuis une interface claire et unifiée.",
    },
  ];

  const dashboardCards = [
    { icon: ArrowUpCircle, label: "Ordres", color: "from-[#047DD5]/20 to-[#047DD5]/5" },
    { icon: BarChart3, label: "Stratégies", color: "from-[#F6851B]/20 to-[#F6851B]/5" },
    { icon: Bell, label: "Alertes", color: "from-[#047DD5]/20 to-[#047DD5]/5" },
  ];

  return (
    <section className="py-16 md:py-24 lg:py-32 px-[4vw] md:px-[5vw] relative overflow-hidden" style={{ backgroundColor: '#F9FBFE' }}>

      <div className="mx-auto max-w-[1600px] w-full relative z-10">
        {/* Main content section */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center mb-16 md:mb-20 lg:mb-24">
          {/* Left side - Text content */}
          <div className="space-y-6 md:space-y-8 animate-fade-up font-roboto">
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A1A1A] leading-tight">
                Pourquoi exStrat
              </h2>
              <p className="text-base md:text-lg lg:text-xl font-semibold text-[#047DD5]">
                Une seule interface pour tout gérer : vos wallets, vos stratégies et vos ordres.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 group animate-fade-in opacity-0"
                    style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#047DD5]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#F6851B]/20 transition-all duration-300 group-hover:scale-110">
                      <Icon className="w-5 h-5 text-[#047DD5] group-hover:text-[#F6851B] transition-colors duration-300" />
                    </div>
                    <p className="text-[#333333] leading-relaxed pt-1.5 text-base" style={{ lineHeight: '1.8' }}>
                      {benefit.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right side - Visual dashboard */}
          <div className="relative animate-fade-in hidden lg:block" style={{ animationDelay: '300ms' }}>
            <div className="relative h-[400px] lg:h-[500px] flex items-center justify-center">
              {/* Central hub */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center animate-pulse">
                  <img src={logoMini} alt="exStrat logo" className="w-full h-full" />
                </div>
              </div>

              {/* Floating cards around the hub */}
              {dashboardCards.map((card, index) => {
                const Icon = card.icon;
                const angle = (index * 120) - 30;
                const radius = 140;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <div
                    key={index}
                    className="absolute w-32 h-24 lg:w-40 lg:h-32 rounded-xl border-2 border-[#047DD5]/20 backdrop-blur-sm bg-white/80 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-110 group"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${index * 200}ms`,
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4">
                      <Icon className="w-8 h-8 text-[#047DD5] group-hover:text-[#F6851B] transition-colors duration-300" />
                      <span className="text-sm font-semibold text-[#1A1A1A]">{card.label}</span>
                    </div>
                  </div>
                );
              })}

              {/* Animated dots */}
              <div className="absolute inset-0">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-[#047DD5] rounded-full animate-pulse"
                    style={{
                      left: `${30 + i * 20}%`,
                      top: `${20 + i * 15}%`,
                      animationDelay: `${i * 0.5}s`,
                      opacity: 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyExStrat;
