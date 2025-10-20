import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import logoLarge from "@/assets/logo-large.svg";
import logoMini from "@/assets/logo-mini.svg";
import BetaSignupModal from "./BetaSignupModal";

const TopBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-card/90 backdrop-blur-glass shadow-card"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1600px] w-full px-[4vw] md:px-[5vw] py-4 md:py-5 flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={isScrolled ? logoMini : logoLarge} 
            alt="exStrat logo" 
            className={`transition-all duration-300 ${
              isScrolled ? "h-7 md:h-8" : "h-8 md:h-10"
            }`}
          />
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="default"
          className="text-sm md:text-base hover:bg-secondary hover:shadow-[0px_8px_30px_rgba(246,133,27,0.35)] hover:scale-105 transition-all duration-300"
        >
          <span className="hidden sm:inline">Rejoindre la bêta</span>
          <span className="sm:hidden">Bêta</span>
        </Button>
      </div>

      <BetaSignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
};

export default TopBar;
