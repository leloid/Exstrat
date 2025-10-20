const Philosophy = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32 px-[4vw] md:px-[5vw]" style={{ backgroundColor: '#F9FBFE' }}>
      <div className="mx-auto max-w-[1600px] w-full">
        <div className="text-center space-y-6 md:space-y-8 animate-fade-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
            Notre philosophie
          </h2>
          
          <div className="mx-auto max-w-[60%] space-y-6 text-base md:text-lg text-[#2A2A2A] leading-relaxed font-roboto">
            <p>
              Nous sommes deux passionnés de crypto, entrés dans le marché en 2017 et 2019.
              Comme beaucoup, nous avons vécu le bullrun de 2021 sans réellement en profiter.
              Nos portefeuilles avaient pris de la valeur, mais sans plan de sortie, tout s'est évaporé.
            </p>
            
            <p>
              Avec le temps, on s'est renseigné, on a étudié, expérimenté, et surtout compris une chose simple :
              le problème, ce n'est pas d'acheter, c'est de savoir quand vendre.
            </p>
            
            <p>
              C'est de là qu'est née l'idée d'exStrat : un outil pour transformer cette expérience en méthode,
              et permettre à chacun de construire une stratégie claire avant que le marché décide à sa place.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
