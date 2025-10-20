import { Wallet, LineChart, TrendingUp } from "lucide-react";
import Step1Illustration from "@/components/Step1Illustration";
import Step2Illustration from "@/components/Step2Illustration";
import Step3Illustration from "@/components/Step3Illustration";
const steps = [{
  number: 1,
  title: "Connectez vos wallets et exchanges",
  description: "Centralisez vos données d'investissement pour créer vos stratégies en toute simplicité.",
  note: "En connectant vos wallets et exchanges, exStrat retrace tout votre historique et calculs automatiquement vos prix moyens d'achat pour chaque token. Ces données deviennent la base pour construire vos stratégies de prises de profit.",
  image: null,
  isCustomIllustration: true,
  icon: Wallet,
  alt: "Écran de connexions avec MetaMask, Binance et Coinbase"
}, {
  number: 2,
  title: "Créez vos stratégies token par token",
  description: "Palier après palier, visualisez vos prises de profit et testez différents scénarios.",
  note: "Pour chacun de vos tokens, définissez plusieurs stratégies selon vos objectifs. Pendant que vous les bâtissez, exStrat simule en temps réel l'impact de chaque prise de profit et vous aide à comparer vos plans avant d'agir.",
  image: null,
  isCustomIllustration: true,
  icon: LineChart,
  alt: "Interface de stratégie BTC avec paliers TP et visualisation graphique"
}, {
  number: 3,
  title: "Passez de la stratégie individuelle à la vision globale.",
  description: "Visualisez la performance simulée de votre portefeuille complet.",
  note: "Pour chaque actif, sélectionnez la stratégie que vous souhaitez appliquer. exStrat regroupe vos choix et en déduit la performance globale de votre portefeuille : profits simulés, rendement total et projection de valeur à venir.",
  image: null,
  isCustomIllustration: true,
  icon: TrendingUp,
  alt: "Portefeuille avec menu déroulant de stratégies et synthèse des gains projetés"
}];
const HowItWorks = () => {
  return <section className="px-[4vw] md:px-[5vw] py-8 md:py-10 lg:py-12" style={{ backgroundColor: '#F9FBFE' }}>
      <div className="mx-auto max-w-[1600px] w-full">
        <div className="text-center space-y-4 md:space-y-6 mb-8 md:mb-10 lg:mb-12 animate-fade-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Comment ça marche ?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">Créez vos stratégies de prise de profit en trois étapes.</p>
        </div>

        <div className="space-y-12 md:space-y-16 lg:space-y-20">
          {steps.map((step, index) => {
          const Icon = step.icon;
          const isEven = index % 2 === 0;
          
          // Special layout for step 2
          if (step.number === 2) {
            return <div key={step.number} className="space-y-8 md:space-y-12">
              {/* Two-column text layout */}
              <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                {/* Left column */}
                <div className="space-y-4 md:space-y-6 animate-slide-in-left">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-card bg-primary/10 flex items-center justify-center shadow-soft">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide">
                      Étape {step.number}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                    {step.title}
                  </h3>

                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Right column */}
                <div className="flex items-center animate-slide-in-right">
                  <div className="bg-accent/60 p-4 md:p-5 rounded-button border-l-4 border-primary shadow-soft">
                    <p className="text-sm text-foreground font-medium">
                      {step.note}
                    </p>
                  </div>
                </div>
              </div>

              {/* Full-width illustration below */}
              <div className="animate-fade-in">
                <Step2Illustration />
              </div>
            </div>;
          }

          // Special layout for step 3
          if (step.number === 3) {
            return <div key={step.number} className="space-y-8 md:space-y-12">
              {/* Two-column text layout */}
              <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                {/* Left column */}
                <div className="space-y-4 md:space-y-6 animate-slide-in-left">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-card bg-primary/10 flex items-center justify-center shadow-soft">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide">
                      Étape {step.number}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                    {step.title}
                  </h3>

                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Right column */}
                <div className="flex items-center animate-slide-in-right">
                  <div className="bg-accent/60 p-4 md:p-5 rounded-button border-l-4 border-primary shadow-soft">
                    <p className="text-sm text-foreground font-medium">
                      {step.note}
                    </p>
                  </div>
                </div>
              </div>

              {/* Full-width illustration below */}
              <div className="animate-fade-in">
                <Step3Illustration />
              </div>
            </div>;
          }
          
          // Default layout for steps 1 and 3
          return <div key={step.number} className={`grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center ${isEven ? "" : "lg:grid-flow-dense"}`}>
                <div className={`space-y-4 md:space-y-6 ${isEven ? "animate-slide-in-left" : "lg:col-start-2 animate-slide-in-right"}`}>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-card bg-primary/10 flex items-center justify-center shadow-soft">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide">
                      Étape {step.number}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                    {step.title}
                  </h3>

                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  <div className="bg-accent/60 p-4 md:p-5 rounded-button border-l-4 border-primary shadow-soft">
                    <p className="text-sm text-foreground font-medium">
                      {step.note}
                    </p>
                  </div>
                </div>

                <div className={`${isEven ? "animate-slide-in-right" : "lg:col-start-1 lg:row-start-1 animate-slide-in-left"}`}>
                  {step.isCustomIllustration ? (
                    step.number === 1 ? <Step1Illustration /> : 
                    step.number === 2 ? <Step2Illustration /> : 
                    <Step3Illustration />
                  ) : (
                    <img src={step.image} alt={step.alt} className="w-full h-auto rounded-card shadow-card hover:shadow-card-hover transition-all duration-500" />
                  )}
                </div>
              </div>;
        })}
        </div>
      </div>
    </section>;
};
export default HowItWorks;