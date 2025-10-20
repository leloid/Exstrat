import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import xLogo from "@/assets/x-logo.svg";
import linkedinIcon from "@/assets/linkedin-icon.png";

interface BetaSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BetaSignupModal = ({ isOpen, onClose }: BetaSignupModalProps) => {
  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactIdentifier, setContactIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !contactMethod) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (contactMethod === "Discord" && !contactIdentifier) {
      toast({
        title: "Pseudo Discord requis",
        description: "Veuillez saisir votre pseudo Discord",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("beta_applications")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          contact_method: contactMethod,
          contact_identifier: (contactMethod === "Discord" || contactMethod === "LinkedIn") ? contactIdentifier : null,
        });

      if (error) throw error;

      setStep("confirmation");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setFirstName("");
    setLastName("");
    setEmail("");
    setContactMethod("");
    setContactIdentifier("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/90 border border-border/50 rounded-[16px] shadow-[0_8px_32px_rgba(13,21,32,0.12)] px-9 py-12">
        {step === "form" ? (
          <>
            <div className="flex flex-col items-center space-y-6 pt-2">
              <img 
                src="/src/assets/logo-large.svg" 
                alt="exStrat" 
                className="h-14 w-auto opacity-90"
              />
              
              <DialogHeader className="space-y-3 text-center">
                <DialogTitle className="text-2xl font-bold text-[#101828]">
                  Merci pour l'intérêt que tu portes au projet !
                </DialogTitle>
                <DialogDescription className="text-base text-[#475467] leading-relaxed">
                  La bêta est limitée à 50 testeurs motivés à façonner le produit avec nous.
                  Laisse tes infos ci-dessous, et on te proposera un échange rapide avant de t'ajouter à la liste officielle.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-[#344054]">
                    Prénom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-11 border border-[#D0D5DD] rounded-[8px] focus:border-[#047DD5] focus:ring-2 focus:ring-[#047DD6]/10 active:border-[#1665C0] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-[#344054]">
                    Nom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-11 border border-[#D0D5DD] rounded-[8px] focus:border-[#047DD5] focus:ring-2 focus:ring-[#047DD6]/10 active:border-[#1665C0] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#344054]">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border border-[#D0D5DD] rounded-[8px] focus:border-[#047DD5] focus:ring-2 focus:ring-[#047DD6]/10 active:border-[#1665C0] transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact" className="text-sm font-medium text-[#344054]">
                  Moyen de contact préféré <span className="text-destructive">*</span>
                </Label>
                <Select value={contactMethod} onValueChange={setContactMethod} required>
                  <SelectTrigger className="h-11 border border-[#D0D5DD] rounded-[8px] focus:border-[#047DD5] focus:ring-2 focus:ring-[#047DD6]/10">
                    <SelectValue placeholder="Sélectionner un moyen de contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Discord">Discord</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contactMethod === "Discord" && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="discord" className="text-sm font-medium text-[#344054]">
                    Ton pseudo Discord <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="discord"
                    type="text"
                    placeholder="username#1234"
                    value={contactIdentifier}
                    onChange={(e) => setContactIdentifier(e.target.value)}
                    required
                    className="h-11 border border-[#D0D5DD] rounded-[8px] focus:border-[#047DD5] focus:ring-2 focus:ring-[#047DD6]/10 active:border-[#1665C0] transition-all"
                  />
                </div>
              )}

              {contactMethod === "LinkedIn" && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="linkedin" className="text-sm font-medium text-[#344054]">
                    Ton profil LinkedIn <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="linkedin"
                    type="text"
                    placeholder="linkedin.com/in/username"
                    value={contactIdentifier}
                    onChange={(e) => setContactIdentifier(e.target.value)}
                    required
                    className="h-11 border border-[#D0D5DD] rounded-[8px] focus:border-[#047DD5] focus:ring-2 focus:ring-[#047DD6]/10 active:border-[#1665C0] transition-all"
                  />
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full text-base font-medium h-12 px-8 py-4 rounded-[14px] bg-gradient-to-r from-[#0D1520] to-[#047DD5] hover:shadow-[0_8px_30px_rgba(4,125,214,0.4)] hover:to-[#047DD6] active:to-[#1665C0] active:scale-[0.98] transition-all duration-200 text-white border-0 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              >
                {isSubmitting ? "Envoi en cours..." : "→ Rejoindre la bêta"}
              </Button>
            </form>

            <div className="flex flex-col items-center gap-4 mt-8">
              <div className="flex items-center justify-center gap-6">
                <a 
                  href="https://www.linkedin.com/company/exstrat-io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-all duration-200 hover:opacity-100 opacity-60 hover:drop-shadow-[0_0_8px_rgba(4,125,214,0.4)] active:drop-shadow-[0_0_8px_rgba(22,101,192,0.5)]"
                >
                  <img src={linkedinIcon} alt="LinkedIn" className="w-7 h-7 grayscale hover:grayscale-0 transition-all" />
                </a>
                <a 
                  href="https://x.com/exstrat_io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-all duration-200 hover:opacity-100 opacity-60 hover:drop-shadow-[0_0_8px_rgba(4,125,214,0.4)] active:drop-shadow-[0_0_8px_rgba(22,101,192,0.5)]"
                >
                  <img src={xLogo} alt="X (Twitter)" className="w-7 h-7 brightness-[0.4] hover:brightness-[0.3] transition-all" />
                </a>
              </div>
              <a 
                href="mailto:contact@exstrat.io"
                className="text-sm text-[#475467] hover:text-[#047DD6] transition-colors duration-200 cursor-pointer"
              >
                contact@exstrat.io
              </a>
            </div>
          </>
        ) : (
          <div className="space-y-8 py-8 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0D1520] to-[#FF7A00] rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-[#0D1520] to-[#FF7A00] rounded-full p-4">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#101828] text-center">
                Candidature envoyée 🚀
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-base text-[#475467] leading-relaxed">
                Merci ! On te contactera très bientôt pour un échange rapide.
                Si tout colle, tu rejoindras la bêta privée exStrat et participeras directement à la construction du produit.
              </p>
            </div>

            <Button
              onClick={handleClose}
              variant="ghost"
              size="lg"
              className="text-[#475467] hover:text-[#101828] underline-offset-4 hover:underline"
            >
              Fermer la fenêtre
            </Button>

            <div className="flex flex-col items-center gap-4 mt-6">
              <div className="flex items-center justify-center gap-6">
                <a 
                  href="https://www.linkedin.com/company/exstrat-io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-all duration-200 hover:opacity-100 opacity-60 hover:drop-shadow-[0_0_8px_rgba(4,125,214,0.4)] active:drop-shadow-[0_0_8px_rgba(22,101,192,0.5)]"
                >
                  <img src={linkedinIcon} alt="LinkedIn" className="w-7 h-7 grayscale hover:grayscale-0 transition-all" />
                </a>
                <a 
                  href="https://x.com/exstrat_io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-all duration-200 hover:opacity-100 opacity-60 hover:drop-shadow-[0_0_8px_rgba(4,125,214,0.4)] active:drop-shadow-[0_0_8px_rgba(22,101,192,0.5)]"
                >
                  <img src={xLogo} alt="X (Twitter)" className="w-7 h-7 brightness-[0.4] hover:brightness-[0.3] transition-all" />
                </a>
              </div>
              <a 
                href="mailto:contact@exstrat.io"
                className="text-sm text-[#475467] hover:text-[#047DD6] transition-colors duration-200 cursor-pointer"
              >
                contact@exstrat.io
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BetaSignupModal;
