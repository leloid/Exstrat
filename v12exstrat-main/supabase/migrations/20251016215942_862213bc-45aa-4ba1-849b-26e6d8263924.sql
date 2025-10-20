-- Créer la table pour stocker les candidatures bêta
CREATE TABLE public.beta_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  contact_method TEXT NOT NULL,
  contact_identifier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion publique (formulaire accessible à tous)
CREATE POLICY "Anyone can submit beta application"
ON public.beta_applications
FOR INSERT
WITH CHECK (true);

-- Politique pour lecture (admin uniquement - pour consultation future)
CREATE POLICY "Only authenticated users can view applications"
ON public.beta_applications
FOR SELECT
USING (auth.role() = 'authenticated');

-- Index pour recherche par email
CREATE INDEX idx_beta_applications_email ON public.beta_applications(email);
CREATE INDEX idx_beta_applications_created_at ON public.beta_applications(created_at DESC);