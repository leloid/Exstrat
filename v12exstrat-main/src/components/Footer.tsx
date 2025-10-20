import linkedinIcon from "@/assets/linkedin-icon.png";
import xLogo from "@/assets/x-logo.svg";

const Footer = () => {
  return (
    <footer className="py-12 md:py-16 px-[4vw] md:px-[5vw] border-t border-border" style={{ backgroundColor: '#F9FBFE' }}>
      <div className="mx-auto max-w-[1600px] w-full">
        <div className="flex flex-col items-center space-y-6 text-center">
          {/* Social Icons */}
          <div className="flex items-center justify-center gap-6 pt-10">
            <a
              href="https://www.linkedin.com/company/exstrat-io"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-200 hover:scale-110"
            >
              <img
                src={linkedinIcon}
                alt="LinkedIn"
                className="w-7 h-7 grayscale hover:grayscale-0 hover:drop-shadow-[0_0_8px_rgba(4,125,213,0.6)] active:drop-shadow-[0_0_12px_rgba(22,101,192,0.8)] transition-all duration-200"
                style={{ filter: 'brightness(0) saturate(100%) invert(69%) sepia(8%) saturate(445%) hue-rotate(181deg) brightness(91%) contrast(87%)' }}
              />
            </a>
            <a
              href="https://x.com/exstrat_io"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-200 hover:scale-110"
            >
              <img
                src={xLogo}
                alt="X (Twitter)"
                className="w-7 h-7 grayscale hover:grayscale-0 hover:drop-shadow-[0_0_8px_rgba(4,125,213,0.6)] active:drop-shadow-[0_0_12px_rgba(22,101,192,0.8)] transition-all duration-200"
                style={{ filter: 'brightness(0) saturate(100%) invert(69%) sepia(8%) saturate(445%) hue-rotate(181deg) brightness(91%) contrast(87%)' }}
              />
            </a>
          </div>

          {/* Contact Email */}
          <a
            href="mailto:contact@exstrat.io"
            className="text-[#475467] text-sm hover:text-[#047DD6] transition-colors duration-200 cursor-pointer"
          >
            contact@exstrat.io
          </a>

          <p className="text-sm text-muted-foreground pt-4">
            © {new Date().getFullYear()} exStrat. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
