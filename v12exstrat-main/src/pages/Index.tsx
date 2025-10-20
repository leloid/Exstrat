import TopBar from "@/components/TopBar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import WhyExStrat from "@/components/WhyExStrat";
import PhilosophyAndTeam from "@/components/PhilosophyAndTeam";
import BetaCTA from "@/components/BetaCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <TopBar />
      <Hero />
      <HowItWorks />
      <WhyExStrat />
      <PhilosophyAndTeam />
      <BetaCTA />
      <Footer />
    </div>
  );
};

export default Index;
