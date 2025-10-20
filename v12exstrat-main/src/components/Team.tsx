import ceoPic from "@/assets/team-ceo.png";
import devPic from "@/assets/team-dev.png";

const teamMembers = [
  {
    name: "[Votre nom]",
    role: "CEO & Co-fondateur",
    image: ceoPic,
    bio: "Ingénieur de recherche en aérodynamique et investisseur sur le marché crypto depuis 2019. Passionné par l'analyse technique, il a traversé le bullrun de 2021 sans stratégie de sortie claire — une expérience qui l'a poussé à créer un outil pour planifier, comparer et simuler ses prises de profit. D'abord conçu pour son propre usage, exStrat est né de sa volonté de ne plus revivre un cycle sans préparation et de permettre à chacun d'anticiper le prochain bullrun avec méthode et sérénité.",
  },
  {
    name: "Lassen [Nom]",
    role: "Développeur on-chain & Co-fondateur",
    image: devPic,
    bio: "Passionné par la blockchain et la décentralisation, Lassen conçoit l'architecture technique d'exStrat, en mettant l'accent sur la sécurité, la connectivité et la simplicité d'usage.",
  },
];

const Team = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32 px-[4vw] md:px-[5vw]" style={{ backgroundColor: '#F9FBFE' }}>
      <div className="mx-auto max-w-[1600px] w-full">
        <div className="text-center space-y-4 md:space-y-6 mb-12 md:mb-16 lg:mb-20 animate-fade-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            L'équipe derrière exStrat
          </h2>
        </div>

        <div className="space-y-12 md:space-y-16">
          {teamMembers.map((member, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={member.name}
                className={`grid md:grid-cols-[250px,1fr] lg:grid-cols-[300px,1fr] gap-6 md:gap-8 lg:gap-10 items-start bg-card p-6 md:p-8 rounded-card shadow-card hover:shadow-card-hover transition-all duration-500 ${
                  isEven ? "animate-slide-in-left" : "md:grid-flow-dense animate-slide-in-right"
                }`}
              >
                <div className={isEven ? "" : "md:col-start-2"}>
                  <img
                    src={member.image}
                    alt={`Photo de ${member.name}`}
                    className="w-full h-auto rounded-card shadow-soft"
                  />
                </div>

                <div className={`space-y-4 ${isEven ? "" : "md:col-start-1 md:row-start-1"}`}>
                  <div>
                    <h3 className="text-2xl font-bold text-primary mb-1">
                      {member.name}
                    </h3>
                    <p className="text-base font-semibold text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Team;
