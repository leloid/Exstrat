import { Button } from "@/components/ui/button";
import { useState } from "react";
import BetaSignupModal from "./BetaSignupModal";

const BetaCTA = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section id="beta-signup" className="py-16 md:py-24 lg:py-32 px-[4vw] md:px-[5vw]" style={{ backgroundColor: '#F9FBFE' }}>
      <div className="mx-auto max-w-[1200px] w-full">
        <div className="bg-card p-6 md:p-10 lg:p-16 rounded-card shadow-card border-2 border-border hover:shadow-card-hover transition-all duration-500">
          <div className="text-center space-y-6 md:space-y-8 animate-fade-up">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Rejoignez la liste des bêta-testeurs
            </h2>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              <span className="font-semibold">Aidez-nous à construire l'application dont vous rêvez.</span>
              <br />
              Nous sélectionnons des utilisateurs engagés pour co-créer la première plateforme stratégique de gestion crypto, pensée pour les investisseurs exigeants.
            </p>

            <div className="pt-4">
              <Button
                onClick={() => setIsModalOpen(true)}
                size="lg"
                className="text-base px-10 hover:bg-secondary hover:shadow-[0px_8px_30px_rgba(246,133,27,0.35)] hover:scale-105 transition-all duration-300"
              >
                Rejoindre la bêta
              </Button>

              <p className="text-sm text-muted-foreground mt-6">
                La liste est limitée à 50 places. Devenez l'un des premiers à construire exStrat avec nous.
              </p>
            </div>

            <BetaSignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BetaCTA;
