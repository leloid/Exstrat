import { Coins, Code, Blocks } from "lucide-react";
import daanPhoto from "@/assets/daan-photo.png";
import lahcenPhoto from "@/assets/lahcen-photo.jpg";

const PhilosophyAndTeam = () => {
  const highlights = [
    {
      icon: Coins,
      text: "Actifs dans l'univers crypto depuis 2017"
    },
    {
      icon: Code,
      text: "Développement d'applications web et mobile pour la traçabilité et la digitalisation"
    },
    {
      icon: Blocks,
      text: "Conception et intégration de smart contracts et dApps Web3, NFT, Digital Product Passport"
    }
  ];

  return (
    <section className="py-16 md:py-24 lg:py-32 px-[4vw] md:px-[5vw]" style={{ backgroundColor: '#F9FBFE' }}>
      <div className="mx-auto max-w-[1600px] w-full">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 animate-fade-up">
          {/* Left Column - Notre philosophie */}
          <div className="flex flex-col justify-center">
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1E1E1E] mb-6">
                Notre philosophie
              </h2>
              
              <div className="space-y-4 text-base md:text-lg text-[#2A2A2A] leading-relaxed font-roboto">
                <p>
                  Nous sommes deux passionnés de crypto, entrés dans le marché en 2017 et 2019.
                  Comme beaucoup, nous avons vécu le bullrun de 2021 sans réellement en profiter.
                  Nos portefeuilles avaient pris de la valeur, mais sans plan de sortie, tout s'est évaporé.
                </p>
                
                <p>
                  C'est de là qu'est née l'idée d'exStrat : un outil pour transformer cette expérience en méthode,
                  et permettre à chacun de construire une stratégie claire avant que le marché décide à sa place.
                </p>
                
                <p>
                  Nous pensons que le levier dans la crypto, ce n'est pas de trouver le prochain x100.
                  C'est de savoir quoi faire quand ton token fait déjà x3, x5 ou x10.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - L'équipe */}
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1E1E1E] mb-8 text-center">
              L'équipe exStrat
            </h2>
            
            {/* Team Photos */}
            <div className="flex justify-center gap-16 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-4 shadow-md grayscale">
                  <img 
                    src={daanPhoto} 
                    alt="Daan Reinartz" 
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <p className="text-sm md:text-base text-[#4A4A4A] font-roboto text-center">
                  CEO & Cofondateur
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-4 shadow-md grayscale">
                  <img 
                    src={lahcenPhoto} 
                    alt="Lahcen El Ouardi" 
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <p className="text-sm md:text-base text-[#4A4A4A] font-roboto text-center">
                  CTO & Cofondateur
                </p>
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <div 
                  key={index}
                  className="bg-white border border-[#D0D5DD] rounded-xl p-4 flex items-center gap-3"
                >
                  <highlight.icon className="w-5 h-5 text-[#047DD6] flex-shrink-0" />
                  <p className="text-sm md:text-base text-[#2A2A2A] font-roboto">
                    {highlight.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhilosophyAndTeam;
