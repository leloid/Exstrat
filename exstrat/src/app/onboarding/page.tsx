'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  PlusIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { transactionsApi } from '@/lib/transactions-api';
import { strategiesApi } from '@/lib/strategies-api';
import { CreatePortfolioDto, UpdatePortfolioDto } from '@/types/portfolio';
import { CreateTransactionDto, TokenSearchResult, TransactionResponse } from '@/types/transactions';
import { CreateStrategyDto, TargetType, CreateTheoreticalStrategyDto } from '@/types/strategies';
import { TokenSearch } from '@/components/transactions/TokenSearch';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import * as portfoliosApi from '@/lib/portfolios-api';
import { formatCurrency } from '@/lib/format';

// Interface pour les cibles de profit
interface ProfitTarget {
  id: string;
  targetType: 'percentage' | 'price';
  targetValue: number;
  sellPercentage: number;
}

// Icônes pour les plateformes
const LedgerIcon = () => (
  <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
    <div className="w-4 h-4 border border-white rounded"></div>
  </div>
);

const MetamaskIcon = () => (
  <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    </svg>
  </div>
);

const KrakenIcon = () => (
  <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
    <span className="text-white font-bold text-sm">K</span>
  </div>
);

const PhantomIcon = () => (
  <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center">
    <span className="text-white font-bold text-sm">P</span>
  </div>
);

const CoinbaseIcon = () => (
  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
    <span className="text-white font-bold text-sm">C</span>
  </div>
);

const BinanceIcon = () => (
  <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
    <span className="text-white font-bold text-sm">B</span>
  </div>
);

const steps = [
  { id: 'portfolio', name: 'Portfolio', icon: ShieldCheckIcon },
  { id: 'exchange', name: 'Exchange', icon: PlusIcon },
  { id: 'strategy', name: 'Stratégie', icon: ChartBarIcon },
  { id: 'configuration', name: 'Configuration', icon: Cog6ToothIcon },
];

const exchanges = [
  { id: 'binance', name: 'Binance', icon: BinanceIcon, available: false },
  { id: 'coinbase', name: 'Coinbase', icon: CoinbaseIcon, available: false },
  { id: 'kraken', name: 'Kraken', icon: KrakenIcon, available: false },
  { id: 'ledger', name: 'Ledger', icon: LedgerIcon, available: false },
  { id: 'metamask', name: 'Metamask', icon: MetamaskIcon, available: false },
  { id: 'phantom', name: 'Phantom', icon: PhantomIcon, available: false },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdData, setCreatedData] = useState({
    portfolio: null as any,
    transaction: null as any,
    strategy: null as any,
  });
  const [onboardingTransactions, setOnboardingTransactions] = useState<any[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [onboardingPortfolios, setOnboardingPortfolios] = useState<any[]>([]);
  const [editingPortfolio, setEditingPortfolio] = useState<any | null>(null);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const portfolioContext = usePortfolio();
  const { 
    portfolios, 
    currentPortfolio, 
    createPortfolio: createPortfolioContext, 
    updatePortfolio: updatePortfolioContext, 
    deletePortfolio: deletePortfolioContext, 
    refreshPortfolios 
  } = portfolioContext;
  
  // Form data
  const [portfolioData, setPortfolioData] = useState({
    name: '',
    description: '',
    isDefault: true,
  });
  
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null);
  const [transactionData, setTransactionData] = useState({
    quantity: '',
    amountInvested: '',
    averagePrice: '',
    type: 'BUY' as const,
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
    portfolioId: currentPortfolio?.id || '',
  });
  
  // États pour la stratégie théorique
  const [strategyName, setStrategyName] = useState<string>('');
  const [selectedStrategyToken, setSelectedStrategyToken] = useState<TokenSearchResult | null>(null);
  const [selectedStrategyPortfolioId, setSelectedStrategyPortfolioId] = useState<string>('virtual'); // 'virtual' ou un ID de portfolio
  const [availableStrategyQuantity, setAvailableStrategyQuantity] = useState<number>(0); // Quantité disponible dans le portfolio
  const [strategyQuantity, setStrategyQuantity] = useState<string>('');
  const [strategyAveragePrice, setStrategyAveragePrice] = useState<string>('');
  const [numberOfTargets, setNumberOfTargets] = useState<number>(3);
  const [profitTargets, setProfitTargets] = useState<ProfitTarget[]>([]);
  
  const isStrategyVirtualWallet = selectedStrategyPortfolioId === 'virtual';
  
  const router = useRouter();

  // Les portfolios sont déjà chargés par le PortfolioContext, pas besoin de les recharger ici

  // Synchroniser onboardingPortfolios avec portfolios du contexte
  // Cette synchronisation préserve les portfolios temporaires (optimistic updates)
  React.useEffect(() => {
    if (!portfolios || !Array.isArray(portfolios)) {
      return;
    }

    // Filtrer les portfolios valides et supprimer les doublons depuis le contexte
    const validPortfolios = portfolios.filter(p => p && p.id && p.name);
    const portfoliosFromContext = Array.from(
      new Map(validPortfolios.map(p => [p.id, p])).values()
    );
    
    // Préserver les portfolios temporaires (ceux qui commencent par "temp-")
    const tempPortfolios = onboardingPortfolios.filter(p => 
      p && p.id && p.id.startsWith('temp-')
    );
    
    // Fusionner : portfolios du contexte + portfolios temporaires
    // Les portfolios du contexte remplacent ceux qui ont le même ID (sauf les temporaires)
    const existingIds = new Set(tempPortfolios.map(p => p.id));
    const finalPortfolios = [
      ...tempPortfolios,
      ...portfoliosFromContext.filter(p => !existingIds.has(p.id))
    ];
    
    // Supprimer les doublons par ID (priorité aux portfolios du contexte pour les non-temporaires)
    const uniquePortfolios = Array.from(
      new Map(finalPortfolios.map(p => [p.id, p])).values()
    );
    
    // Convertir en string pour comparaison profonde
    const currentIds = (onboardingPortfolios || [])
      .filter(p => p && p.id)
      .map(p => p.id)
      .sort()
      .join(',');
    const newIds = uniquePortfolios.map(p => p.id).sort().join(',');
    
    // Ne mettre à jour que si les IDs ont vraiment changé
    if (currentIds !== newIds) {
      setOnboardingPortfolios(uniquePortfolios);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolios]);

  // Charger les transactions uniquement quand on arrive sur le step exchange (une seule fois)
  const prevStepRef = useRef(currentStep);
  const transactionsLoadedRef = useRef(false);
  
  React.useEffect(() => {
    // Ne charger que si on change vraiment de step vers le step 1 et qu'on ne les a pas déjà chargées
    if (currentStep === 1 && prevStepRef.current !== 1 && !transactionsLoadedRef.current) {
      const loadTransactions = async () => {
        try {
          transactionsLoadedRef.current = true;
          const response = await transactionsApi.getTransactions();
          const transactions = response.transactions || [];
          // Supprimer les doublons dès le chargement
          const uniqueTransactions = Array.from(
            new Map(transactions.map(t => [t.id, t])).values()
          );
          setOnboardingTransactions(uniqueTransactions);
        } catch (err) {
          console.error('Erreur lors du chargement des transactions:', err);
          transactionsLoadedRef.current = false; // Permettre de réessayer
        }
      };
      loadTransactions();
    }
    
    // Réinitialiser le flag si on quitte le step
    if (currentStep !== 1) {
      transactionsLoadedRef.current = false;
    }
    
    prevStepRef.current = currentStep;
  }, [currentStep]);

  // Initialiser les cibles de profit quand le nombre change
  React.useEffect(() => {
    const newTargets: ProfitTarget[] = [];
    for (let i = 0; i < numberOfTargets; i++) {
      newTargets.push({
        id: `target-${i}`,
        targetType: 'percentage',
        targetValue: (i + 1) * 50, // 50%, 100%, 150%, etc.
        sellPercentage: 100 / numberOfTargets, // Répartition égale
      });
    }
    setProfitTargets(newTargets);
  }, [numberOfTargets]);

  // Charger la quantité disponible pour la stratégie quand le portfolio ou le token change
  React.useEffect(() => {
    const loadAvailableStrategyQuantity = async () => {
      if (isStrategyVirtualWallet || !selectedStrategyToken || !selectedStrategyPortfolioId || selectedStrategyPortfolioId === 'virtual') {
        setAvailableStrategyQuantity(0);
        return;
      }
      
      try {
        const holdings = await portfoliosApi.getPortfolioHoldings(selectedStrategyPortfolioId);
        const holding = holdings.find(h => 
          h.token.symbol.toUpperCase() === selectedStrategyToken.symbol.toUpperCase()
        );
        
        if (holding) {
          setAvailableStrategyQuantity(holding.quantity);
          // Si la quantité actuelle dépasse ce qui est disponible, la réduire
          const currentQty = parseFloat(strategyQuantity);
          if (!isNaN(currentQty) && currentQty > holding.quantity) {
            setStrategyQuantity(holding.quantity.toString());
          }
        } else {
          setAvailableStrategyQuantity(0);
          // Si aucun holding n'existe pour ce token, réinitialiser la quantité
          if (strategyQuantity && parseFloat(strategyQuantity) > 0) {
            setStrategyQuantity('');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la quantité disponible pour la stratégie:', error);
        setAvailableStrategyQuantity(0);
      }
    };
    
    loadAvailableStrategyQuantity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStrategyPortfolioId, selectedStrategyToken?.symbol]);
  
  // Auto-remplir le prix moyen avec le prix actuel du token
  const handleStrategyTokenSelect = (token: TokenSearchResult | null) => {
    setSelectedStrategyToken(token);
    if (token && token.quote?.USD?.price) {
      setStrategyAveragePrice(token.quote.USD.price.toFixed(2));
    }
  };

  // Gérer les modifications des cibles
  const handleTargetChange = (index: number, field: keyof ProfitTarget, value: any) => {
    const newTargets = [...profitTargets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    
    // Si on modifie le sellPercentage, vérifier que la somme ne dépasse pas 100%
    if (field === 'sellPercentage') {
      const totalPercentage = newTargets.reduce((sum, target) => sum + target.sellPercentage, 0);
      if (totalPercentage > 100) {
        // Ajuster la valeur pour ne pas dépasser 100% au total
        const otherTargetsTotal = newTargets.reduce((sum, target, idx) => 
          idx === index ? sum : sum + target.sellPercentage, 0
        );
        const maxValue = Math.max(0, 100 - otherTargetsTotal);
        newTargets[index] = { ...newTargets[index], sellPercentage: Math.min(value, maxValue) };
        setError(`La somme des quantités à vendre ne peut pas dépasser 100%. Maximum pour cette cible: ${maxValue.toFixed(1)}%`);
      } else {
        setError(''); // Réinitialiser l'erreur si tout est OK
      }
    }
    
    setProfitTargets(newTargets);
  };

  // Calculer les informations de stratégie pour chaque cible
  const calculateStrategyInfo = () => {
    const qty = parseFloat(strategyQuantity);
    const avgPrice = parseFloat(strategyAveragePrice);
    
    if (isNaN(qty) || isNaN(avgPrice) || qty <= 0 || avgPrice <= 0) {
      return [];
    }
    
    let remainingTokens = qty;
    const results: Array<{
      tokensSold: number;
      amountCollected: number;
      remainingTokens: number;
      remainingTokensValuation: number;
      remainingBagValue: number;
    }> = [];
    
    profitTargets.forEach((target) => {
      // Calculer le prix cible
      let targetPrice = 0;
      if (target.targetType === 'percentage') {
        targetPrice = avgPrice * (1 + target.targetValue / 100);
      } else {
        targetPrice = target.targetValue;
      }
      
      // Calculer les tokens vendus pour cette cible (basé sur la quantité totale initiale)
      const tokensSold = (qty * target.sellPercentage) / 100;
      
      // Montant encaissé = tokens vendus × prix cible
      const amountCollected = tokensSold * targetPrice;
      
      // Retirer les tokens vendus
      remainingTokens = remainingTokens - tokensSold;
      
      // Valorisation des tokens restants au prix cible
      const remainingTokensValuation = remainingTokens * targetPrice;
      
      // Valeur du bag restant au prix d'achat moyen
      const remainingBagValue = remainingTokens * avgPrice;
      
      results.push({
        tokensSold,
        amountCollected,
        remainingTokens,
        remainingTokensValuation,
        remainingBagValue,
      });
    });
    
    return results;
  };

  const strategyInfo = calculateStrategyInfo();

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    // Si on est sur l'étape stratégie (step 2), créer la stratégie avant de continuer
    if (currentStep === 2) {
      // Validation
      if (!strategyName.trim()) {
        setError('Le nom de la stratégie est requis');
        return;
      }
      if (!selectedStrategyToken) {
        setError('Veuillez sélectionner un token');
        return;
      }
      if (!strategyQuantity || parseFloat(strategyQuantity) <= 0) {
        setError('Veuillez entrer une quantité valide');
        return;
      }
      if (!strategyAveragePrice || parseFloat(strategyAveragePrice) <= 0) {
        setError('Veuillez entrer un prix moyen valide');
        return;
      }
      
      // Validation de la quantité selon le type de wallet
      if (!isStrategyVirtualWallet && selectedStrategyPortfolioId) {
        const qty = parseFloat(strategyQuantity);
        if (qty > availableStrategyQuantity) {
          setError(
            `La quantité (${qty}) ne peut pas dépasser ce que vous possédez dans ce wallet (${availableStrategyQuantity})`
          );
          return;
        }
      }
      
      // Validation : la somme des quantités à vendre ne doit pas dépasser 100%
      const totalSellPercentage = profitTargets.reduce((sum, target) => sum + target.sellPercentage, 0);
      if (totalSellPercentage > 100) {
        setError(`La somme des quantités à vendre (${totalSellPercentage.toFixed(1)}%) ne peut pas dépasser 100%`);
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
        if (isStrategyVirtualWallet) {
          // Stratégie théorique
          const strategyData: CreateTheoreticalStrategyDto = {
            name: strategyName,
            description: `Stratégie pour ${selectedStrategyToken.symbol} - ${numberOfTargets} cibles de profit`,
            tokenSymbol: selectedStrategyToken.symbol,
            tokenName: selectedStrategyToken.name,
            quantity: parseFloat(strategyQuantity),
            averagePrice: parseFloat(strategyAveragePrice),
            profitTargets: profitTargets.map((target, index) => ({
              order: index + 1,
              targetType: target.targetType,
              targetValue: target.targetValue,
              sellPercentage: target.sellPercentage,
            })),
            status: 'active' as const,
          };
          
          const createdStrategy = await portfoliosApi.createTheoreticalStrategy(strategyData);
          console.log('✅ Stratégie théorique créée:', createdStrategy);
          setCreatedData(prev => ({ ...prev, strategy: createdStrategy }));
        } else {
          // Stratégie réelle
          const strategyData: CreateStrategyDto = {
            name: strategyName,
            symbol: selectedStrategyToken.symbol,
            tokenName: selectedStrategyToken.name,
            cmcId: selectedStrategyToken.id || 0,
            baseQuantity: parseFloat(strategyQuantity),
            referencePrice: parseFloat(strategyAveragePrice),
            steps: profitTargets.map((target) => ({
              targetType: (target.targetType === 'percentage' ? 'percentage_of_average' : 'exact_price') as TargetType,
              targetValue: target.targetValue,
              sellPercentage: target.sellPercentage,
              notes: '',
            })),
            notes: `Stratégie pour ${selectedStrategyToken.symbol} - ${numberOfTargets} cibles de profit`,
          };
          
          const createdStrategy = await strategiesApi.createStrategy(strategyData);
          console.log('✅ Stratégie réelle créée:', createdStrategy);
          setCreatedData(prev => ({ ...prev, strategy: createdStrategy }));
        }
      } catch (error: any) {
        console.error('❌ Erreur création stratégie:', error);
        setError(error.response?.data?.message || error.message || 'Erreur lors de la création de la stratégie');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(false);
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Fin de l'onboarding, rediriger vers le dashboard
      router.push('/dashboard');
    }
  };

  const handleCreatePortfolio = async () => {
    if (!portfolioData.name.trim()) {
      setError('Le nom du portfolio est requis');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Pour l'édition, on ne met à jour que le nom (simplification)
      const portfolioDto: UpdatePortfolioDto = {
        name: portfolioData.name.trim(),
      };

      if (editingPortfolio) {
        // Mettre à jour le portfolio existant (nom uniquement)
        const updatedPortfolio = await updatePortfolioContext(editingPortfolio.id, portfolioDto);
        // Le contexte est déjà mis à jour par updatePortfolioContext
        // Le useEffect synchronisera automatiquement onboardingPortfolios avec portfolios
        setCreatedData(prev => ({ ...prev, portfolio: updatedPortfolio }));
      }
      
      console.log('✅ Portfolio mis à jour:', editingPortfolio?.name);
      resetPortfolioForm();
      setShowPortfolioModal(false);
    } catch (err: unknown) {
      console.error('❌ Erreur mise à jour portfolio:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour du portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction simplifiée pour créer un portfolio directement depuis le champ de saisie
  const handleQuickCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) {
      setError('Veuillez entrer un nom pour le portfolio');
      return;
    }

    setIsLoading(true);
    setError('');

    // Optimistic update : créer un portfolio temporaire pour l'afficher immédiatement
    const tempId = `temp-${Date.now()}`;
    const tempPortfolio = {
      id: tempId,
      name: newPortfolioName.trim(),
      description: null,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Ajouter immédiatement à la liste locale (optimistic update)
    setOnboardingPortfolios(prev => {
      // Éviter les doublons si le portfolio existe déjà
      if (prev.some(p => p.id === tempId || p.name === newPortfolioName.trim())) {
        return prev;
      }
      return [...prev, tempPortfolio];
    });

    try {
      // Créer le portfolio avec seulement le nom (pas de description, pas de isDefault)
      const portfolioDto: CreatePortfolioDto = {
        name: newPortfolioName.trim(),
        isDefault: false,
      };

      // Créer le portfolio via l'API directement
      const createdPortfolio = await portfoliosApi.createPortfolio(portfolioDto);
      
      // Remplacer le portfolio temporaire par le vrai portfolio de l'API
      setOnboardingPortfolios(prev => {
        const filtered = prev.filter(p => p.id !== tempId);
        // Vérifier qu'il n'existe pas déjà
        if (!filtered.some(p => p.id === createdPortfolio.id)) {
          return [...filtered, createdPortfolio];
        }
        return filtered;
      });
      
      // Forcer une mise à jour du contexte pour que le Select voie immédiatement le nouveau portfolio
      // On utilise refreshPortfolios qui va recharger depuis l'API (mais c'est rapide car on vient de créer)
      // En production, on pourrait optimiser en ajoutant directement au contexte sans recharger
      await refreshPortfolios();
      
      // Réinitialiser le champ de saisie
      setNewPortfolioName('');
      setCreatedData(prev => ({ ...prev, portfolio: createdPortfolio }));
      
      console.log('✅ Portfolio créé:', createdPortfolio.name);
    } catch (err: unknown) {
      console.error('❌ Erreur création portfolio:', err);
      const error = err as { response?: { data?: { message?: string } } };
      
      // Rollback : retirer le portfolio temporaire en cas d'erreur
      setOnboardingPortfolios(prev => prev.filter(p => p.id !== tempId));
      
      setError(error.response?.data?.message || 'Erreur lors de la création du portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPortfolioClick = () => {
    setEditingPortfolio(null);
    setPortfolioData({
      name: '',
      description: '',
      isDefault: false,
    });
    setError('');
    setShowPortfolioModal(true);
  };

  const handleEditPortfolio = (portfolio: any) => {
    setEditingPortfolio(portfolio);
    setPortfolioData({
      name: portfolio.name,
      description: portfolio.description || '',
      isDefault: portfolio.isDefault || false,
    });
    setError('');
    setShowPortfolioModal(true);
  };

  const resetPortfolioForm = () => {
    setPortfolioData({
      name: '',
      description: '',
      isDefault: false,
    });
    setEditingPortfolio(null);
    setError('');
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    try {
      await deletePortfolioContext(portfolioId);
      // Le useEffect synchronisera automatiquement onboardingPortfolios avec portfolios
      if (createdData.portfolio?.id === portfolioId) {
        setCreatedData(prev => ({ ...prev, portfolio: null }));
      }
      // Recharger les portfolios du contexte pour s'assurer qu'ils sont à jour
      await refreshPortfolios();
    } catch (err: unknown) {
      setError('Erreur lors de la suppression du portfolio');
      console.error('❌ Erreur suppression portfolio:', err);
    }
  };

  const handleAddTransactionClick = () => {
    setEditingTransaction(null);
    setSelectedToken(null);
    setTransactionData({
      quantity: '',
      amountInvested: '',
      averagePrice: '',
      type: 'BUY' as const,
      transactionDate: new Date().toISOString().split('T')[0],
      notes: '',
      portfolioId: currentPortfolio?.id || '',
    });
    setError('');
    setShowTransactionModal(true);
  };

  const handleEditTransaction = (transaction: TransactionResponse) => {
    setEditingTransaction(transaction);
    setSelectedToken({
      id: transaction.cmcId,
      name: transaction.name,
      symbol: transaction.symbol,
      slug: transaction.symbol.toLowerCase(),
      num_market_pairs: 0,
      date_added: '',
      tags: [],
      max_supply: 0,
      circulating_supply: 0,
      total_supply: 0,
      is_active: 1,
      infinite_supply: false,
      platform: null,
      cmc_rank: 0,
      is_fiat: 0,
      self_reported_circulating_supply: null,
      self_reported_market_cap: null,
      tvl_ratio: null,
      last_updated: '',
      quote: {
        USD: {
          price: null,
          volume_24h: null,
          volume_change_24h: null,
          percent_change_1h: null,
          percent_change_24h: null,
          percent_change_7d: null,
          percent_change_30d: null,
          percent_change_60d: null,
          percent_change_90d: null,
          market_cap: null,
          market_cap_dominance: null,
          fully_diluted_market_cap: null,
          tvl: null,
          last_updated: '',
        },
      },
    } as TokenSearchResult);
    setTransactionData({
      quantity: transaction.quantity.toString(),
      amountInvested: transaction.amountInvested.toString(),
      averagePrice: transaction.averagePrice.toString(),
      type: (transaction.type || 'BUY') as 'BUY',
      transactionDate: new Date(transaction.transactionDate).toISOString().split('T')[0],
      notes: transaction.notes || '',
      portfolioId: transaction.portfolioId || currentPortfolio?.id || '',
    });
    setError('');
    setShowTransactionModal(true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await transactionsApi.deleteTransaction(transactionId);
      setOnboardingTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (err: unknown) {
      setError('Erreur lors de la suppression de la transaction');
      console.error('❌ Erreur suppression transaction:', err);
    }
  };

  const resetTransactionForm = () => {
    setSelectedToken(null);
    setTransactionData({
      quantity: '',
      amountInvested: '',
      averagePrice: '',
      type: 'BUY' as const,
      transactionDate: new Date().toISOString().split('T')[0],
      notes: '',
      portfolioId: currentPortfolio?.id || '',
    });
    setEditingTransaction(null);
    setError('');
  };

  const handleTokenSelect = (token: TokenSearchResult | null) => {
    setSelectedToken(token);
    // Ne plus auto-remplir le prix moyen car il sera calculé automatiquement
    // Le prix moyen sera calculé à partir de quantité et montant investi
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTransactionData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTransactionData(prev => {
      const newData = { ...prev, quantity: value };
      // Calculer automatiquement le prix moyen à partir de la quantité et du montant investi
      const qty = parseFloat(value);
      const amount = parseFloat(newData.amountInvested);
      if (!isNaN(qty) && !isNaN(amount) && qty > 0) {
        newData.averagePrice = (amount / qty).toFixed(8);
      }
      return newData;
    });
  };

  const handleAmountInvestedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTransactionData(prev => {
      const newData = { ...prev, amountInvested: value };
      // Calculer automatiquement le prix moyen à partir de la quantité et du montant investi
      const qty = parseFloat(newData.quantity);
      const amount = parseFloat(value);
      if (!isNaN(qty) && !isNaN(amount) && qty > 0) {
        newData.averagePrice = (amount / qty).toFixed(8);
      }
      return newData;
    });
  };

  const handleCreateTransaction = async () => {
    // Validation des champs requis
    if (!selectedToken) {
      setError('Veuillez sélectionner un token');
      return;
    }
    if (!transactionData.quantity || !transactionData.averagePrice || !transactionData.amountInvested) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!transactionData.portfolioId) {
      setError('Veuillez sélectionner un portefeuille');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (editingTransaction) {
        // Mettre à jour la transaction existante - seulement les champs modifiables
        const updateData = {
          quantity: parseFloat(transactionData.quantity),
          amountInvested: parseFloat(transactionData.amountInvested),
          averagePrice: parseFloat(transactionData.averagePrice),
          type: transactionData.type,
          transactionDate: new Date(transactionData.transactionDate).toISOString(),
          notes: transactionData.notes || undefined,
        };
        const updatedTransaction = await transactionsApi.updateTransaction(editingTransaction.id, updateData);
        setOnboardingTransactions(prev => {
          // Supprimer les doublons avant la mise à jour
          const unique = Array.from(new Map(prev.map(t => [t.id, t])).values());
          return unique.map(t => t.id === editingTransaction.id ? updatedTransaction : t);
        });
      } else {
        // Validation supplémentaire
        const quantity = parseFloat(transactionData.quantity);
        const amountInvested = parseFloat(transactionData.amountInvested);
        const averagePrice = parseFloat(transactionData.averagePrice);
        const cmcId = selectedToken.id;

        if (isNaN(quantity) || quantity <= 0) {
          setError('La quantité doit être un nombre positif');
          setIsLoading(false);
          return;
        }
        if (isNaN(amountInvested) || amountInvested <= 0) {
          setError('Le montant investi doit être un nombre positif');
          setIsLoading(false);
          return;
        }
        if (isNaN(averagePrice) || averagePrice <= 0) {
          setError('Le prix moyen doit être un nombre positif');
          setIsLoading(false);
          return;
        }
        if (!cmcId || cmcId <= 0) {
          setError('L\'ID du token est invalide');
          setIsLoading(false);
          return;
        }
        if (!transactionData.portfolioId || transactionData.portfolioId.trim() === '') {
          setError('Veuillez sélectionner un portefeuille');
          setIsLoading(false);
          return;
        }

        // Vérifier que le portfolio existe dans la liste
        const portfolioExists = portfolios.find(p => p.id === transactionData.portfolioId);
        if (!portfolioExists) {
          setError('Le portefeuille sélectionné n\'existe plus. Veuillez en sélectionner un autre.');
          setIsLoading(false);
          return;
        }

        // Créer une nouvelle transaction - tous les champs requis
        const transactionDto: CreateTransactionDto = {
          symbol: selectedToken.symbol,
          name: selectedToken.name,
          cmcId: cmcId,
          quantity: quantity,
          amountInvested: amountInvested,
          averagePrice: averagePrice,
          type: transactionData.type,
          transactionDate: new Date(transactionData.transactionDate).toISOString(),
          notes: transactionData.notes || undefined,
          portfolioId: transactionData.portfolioId,
        };
        
        console.log('📤 Données de transaction envoyées:', transactionDto);
        const createdTransaction = await transactionsApi.createTransaction(transactionDto);
        setOnboardingTransactions(prev => {
          // Vérifier si la transaction existe déjà pour éviter les doublons
          const exists = prev.some(t => t && t.id === createdTransaction.id);
          if (exists) {
            // Si elle existe, la mettre à jour
            return prev.map(t => t && t.id === createdTransaction.id ? createdTransaction : t);
          }
          // Supprimer les doublons existants avant d'ajouter
          const unique = Array.from(new Map(prev.map(t => [t.id, t])).values());
          return [...unique, createdTransaction];
        });
        setCreatedData(prev => ({ ...prev, transaction: createdTransaction }));
      }
      
      console.log('✅ Transaction sauvegardée:', editingTransaction ? 'mise à jour' : 'créée');
      resetTransactionForm();
      setShowTransactionModal(false);
    } catch (err: unknown) {
      console.error('❌ Erreur création transaction:', err);
      const error = err as { response?: { data?: { message?: string; error?: string }; status?: number }; message?: string };
      console.error('❌ Détails de l\'erreur:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message,
      });
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de la sauvegarde de la transaction';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStrategy = async () => {
    // Validation des champs requis
    if (!strategyName.trim()) {
      setError('Veuillez entrer un nom pour la stratégie');
      return;
    }
    if (!selectedStrategyToken) {
      setError('Veuillez sélectionner un token');
      return;
    }
    if (!strategyQuantity || parseFloat(strategyQuantity) <= 0) {
      setError('Veuillez entrer une quantité valide');
      return;
    }
    if (!strategyAveragePrice || parseFloat(strategyAveragePrice) <= 0) {
      setError('Veuillez entrer un prix moyen valide');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('💾 Création de la stratégie théorique...');
      
      // Préparer les données de la stratégie
      const strategyData: CreateTheoreticalStrategyDto = {
        name: strategyName,
        description: `Stratégie pour ${selectedStrategyToken.symbol} - ${numberOfTargets} cibles de profit`,
        tokenSymbol: selectedStrategyToken.symbol,
        tokenName: selectedStrategyToken.name,
        quantity: parseFloat(strategyQuantity),
        averagePrice: parseFloat(strategyAveragePrice),
        profitTargets: profitTargets.map((target, index) => ({
          order: index + 1,
          targetType: target.targetType,
          targetValue: target.targetValue,
          sellPercentage: target.sellPercentage,
        })),
        status: 'active' as const,
      };
      
      console.log('📤 Données de la stratégie:', strategyData);
      
      const createdStrategy = await portfoliosApi.createTheoreticalStrategy(strategyData);
      setCreatedData(prev => ({ ...prev, strategy: createdStrategy }));
      
      console.log('✅ Stratégie créée:', createdStrategy);
      setCurrentStep(3);
    } catch (err: unknown) {
      console.error('❌ Erreur création stratégie:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors de la création de la stratégie');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureStrategy = () => {
    // Rediriger vers la page config
    router.push('/config');
  };


  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const filteredExchanges = exchanges.filter(exchange =>
    exchange.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Portfolio
        return (
          <div className="space-y-6">
            {/* Liste des Portfolios Créés en haut */}
            {onboardingPortfolios.length > 0 && (
              <div className="mb-6">
                <div className="space-y-3">
                  {Array.from(
                    new Map(
                      onboardingPortfolios
                        .filter(portfolio => portfolio && portfolio.id && portfolio.name)
                        .map(portfolio => [portfolio.id, portfolio])
                    ).values()
                  ).map((portfolio) => (
                    <Card key={portfolio.id} className="border border-gray-200">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm md:text-base text-gray-900 truncate">{portfolio.name}</h4>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              onClick={() => handleEditPortfolio(portfolio)}
                              className="p-2"
                            >
                              <PencilIcon className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDeletePortfolio(portfolio.id)}
                              className="p-2"
                            >
                              <TrashIcon className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Champ de saisie avec bouton Add a new wallet en bas */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 md:mt-6">
              <Input
                type="text"
                placeholder="Nom du wallet"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickCreatePortfolio();
                  }
                }}
                className="flex-1 h-10 md:h-12 text-sm md:text-base"
              />
              <Button
                onClick={handleQuickCreatePortfolio}
                disabled={isLoading || !newPortfolioName.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 h-10 md:h-12 px-4 md:px-6 whitespace-nowrap text-sm md:text-base"
              >
                {isLoading ? '...' : 'Add a new wallet'}
              </Button>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Modal de Portfolio (pour l'édition uniquement) */}
            {showPortfolioModal && editingPortfolio && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
                <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">
                      Modifier le portfolio
                    </h3>
                    <button
                      onClick={() => {
                        setShowPortfolioModal(false);
                        resetPortfolioForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  </div>

                  <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                    {/* Error Message */}
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    {/* Nom du Portfolio */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Nom du Portfolio *
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: Portfolio Principal"
                        value={portfolioData.name}
                        onChange={(e) => setPortfolioData(prev => ({ ...prev, name: e.target.value }))}
                        className="h-10 md:h-12 text-sm md:text-base"
                      />
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPortfolioModal(false);
                          resetPortfolioForm();
                        }}
                        className="w-full sm:w-auto px-4 md:px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm md:text-base"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleCreatePortfolio}
                        disabled={isLoading || !portfolioData.name.trim()}
                        className="w-full sm:w-auto px-4 md:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-sm md:text-base"
                      >
                        {isLoading ? 'Sauvegarde...' : editingPortfolio ? '✓ Modifier' : '✓ Créer'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        );

      case 1: // Exchange
        return (
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {createdData.portfolio && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">
                  ✅ Portfolio "{createdData.portfolio.name}" créé avec succès !
                </p>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Recherchez votre exchange parmi +700 intégrations"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-base"
              />
            </div>

            {/* Exchange Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {filteredExchanges.map((exchange) => (
                <Card 
                  key={exchange.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    exchange.available 
                      ? 'hover:shadow-lg hover:border-blue-300' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <CardContent className="p-3 md:p-4 text-center">
                    <div className="flex items-center justify-center mb-2 md:mb-3">
                      <exchange.icon />
                    </div>
                    <h3 className="font-medium text-xs md:text-sm text-gray-900 mb-1">
                      {exchange.name}
                    </h3>
                    {!exchange.available && (
                      <p className="text-xs text-gray-500">Coming soon</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Liste des Transactions Créées */}
            {onboardingTransactions.length > 0 && (
              <div className="mt-4 md:mt-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                  Transactions ajoutées ({onboardingTransactions.length})
                </h3>
                <div className="space-y-3">
                  {Array.from(
                    new Map(
                      onboardingTransactions
                        .filter(transaction => transaction && transaction.id)
                        .map(transaction => [transaction.id, transaction])
                    ).values()
                  ).map((transaction) => (
                    <Card key={transaction.id} className="border border-gray-200">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-purple-600 font-bold text-xs md:text-sm">
                                {transaction.symbol.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-sm md:text-base text-gray-900 truncate">{transaction.symbol}</h4>
                                <span className="text-xs md:text-sm text-gray-500 hidden sm:inline">{transaction.name}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 text-xs md:text-sm text-gray-600">
                                <span>Qty: {parseFloat(transaction.quantity.toString()).toLocaleString()}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{transaction.type}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{formatCurrency(transaction.averagePrice)}</span>
                                {transaction.transactionDate && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="text-xs">
                                      {new Date(transaction.transactionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              onClick={() => handleEditTransaction(transaction)}
                              className="p-2"
                            >
                              <PencilIcon className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="p-2"
                            >
                              <TrashIcon className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Modal de Transaction */}
            {showTransactionModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">
                      {editingTransaction ? 'Modifier la transaction' : 'Ajouter une transaction'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowTransactionModal(false);
                        resetTransactionForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  </div>

                  <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                    {/* Error Message */}
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    {/* Recherche de token */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Token *
                      </label>
                      <TokenSearch
                        onTokenSelect={handleTokenSelect}
                        selectedToken={selectedToken}
                      />
                    </div>

                    {/* Sélection du portefeuille */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Portefeuille *
                      </label>
                      <Select
                        value={transactionData.portfolioId || ''}
                        onValueChange={(value) => {
                          setTransactionData(prev => ({ ...prev, portfolioId: value }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un portefeuille" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            // Fusionner portfolios du contexte et onboardingPortfolios pour avoir la liste la plus à jour
                            // Les portfolios temporaires sont aussi inclus (optimistic update)
                            const allPortfolios = [
                              ...onboardingPortfolios.filter(p => p && p.id && p.name),
                              ...portfolios.filter(p => p && p.id && p.name)
                            ];
                            
                            // Supprimer les doublons (priorité aux portfolios du contexte pour les IDs réels)
                            const uniquePortfolios = Array.from(
                              new Map(allPortfolios.map(p => [p.id, p])).values()
                            );
                            
                            return uniquePortfolios.map((portfolio) => (
                              <SelectItem key={portfolio.id} value={portfolio.id}>
                                {portfolio.name} {portfolio.isDefault && '(Défaut)'}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                      {onboardingPortfolios.length === 0 && portfolios.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Aucun portefeuille disponible. Créez-en un d'abord.
                        </p>
                      )}
                    </div>

                    {/* Quantité et Montant investi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                          Quantité *
                        </label>
                        <Input
                          type="number"
                          name="quantity"
                          value={transactionData.quantity}
                          onChange={handleQuantityChange}
                          placeholder="0.00"
                          step="0.00000001"
                          required
                          className="text-sm md:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                          Montant investi (USD) *
                        </label>
                        <Input
                          type="number"
                          name="amountInvested"
                          value={transactionData.amountInvested}
                          onChange={handleAmountInvestedChange}
                          placeholder="0.00"
                          step="0.01"
                          required
                          className="text-sm md:text-base"
                        />
                      </div>
                    </div>

                    {/* Prix moyen (calculé automatiquement) */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-500 mb-2">
                        Prix moyen (USD) *
                      </label>
                      <Input
                        type="number"
                        name="averagePrice"
                        value={transactionData.averagePrice}
                        readOnly
                        disabled
                        placeholder="0.00"
                        step="0.00000001"
                        className="bg-gray-100 cursor-not-allowed text-sm md:text-base"
                        required
                      />
                      <p className="mt-1 text-xs md:text-sm text-gray-500">
                        Calculé automatiquement: {transactionData.quantity && transactionData.amountInvested ? 
                          (parseFloat(transactionData.amountInvested) / parseFloat(transactionData.quantity)).toFixed(8) : '0.00'} USD
                      </p>
                    </div>

                    {/* Date de transaction */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Date de transaction *
                      </label>
                      <Input
                        type="date"
                        name="transactionDate"
                        value={transactionData.transactionDate}
                        onChange={handleInputChange}
                        required
                        className="text-sm md:text-base"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Notes (optionnel)
                      </label>
                      <textarea
                        name="notes"
                        value={transactionData.notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
                        placeholder="Ajoutez des notes sur cette transaction..."
                      />
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowTransactionModal(false);
                          resetTransactionForm();
                        }}
                        className="w-full sm:w-auto px-4 md:px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm md:text-base"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleCreateTransaction}
                        disabled={isLoading || !selectedToken}
                        className="w-full sm:w-auto px-4 md:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-sm md:text-base"
                      >
                        {isLoading ? 'Sauvegarde...' : editingTransaction ? '✓ Modifier' : '✓ Créer'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 md:pt-6 border-t border-gray-200">
              <div className="flex items-center text-xs md:text-sm text-gray-500">
                <ShieldCheckIcon className="w-3 h-3 md:w-4 md:h-4 mr-2 text-gray-400" />
                <span className="hidden sm:inline">Connexion rapide et sécurisée à vos transactions</span>
                <span className="sm:hidden">Sécurisé</span>
              </div>
              <Button 
                onClick={handleAddTransactionClick}
                className="w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg text-sm md:text-base"
              >
                <PlusIcon className="mr-2 h-4 w-4 inline" />
                Add Transaction
              </Button>
            </div>
          </div>
        );

      case 2: // Strategy
        return (
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success Messages */}
            {createdData.transaction && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">
                  ✅ Transaction {createdData.transaction.symbol} créée avec succès !
                </p>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                Créez votre première stratégie
              </h3>
              <p className="text-xs md:text-sm text-gray-600">
                Définissez des cibles de profit théoriques pour optimiser vos gains
              </p>
            </div>

            {/* Informations récapitulatives en haut */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 text-xs md:text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Portfolio</p>
                  <p className="font-semibold text-gray-900">
                    {selectedStrategyPortfolioId === 'virtual' 
                      ? 'Wallet Virtuelle' 
                      : onboardingPortfolios.find(p => p.id === selectedStrategyPortfolioId)?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Token</p>
                  <p className="font-semibold text-gray-900">
                    {selectedStrategyToken?.symbol || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Nombre de sorties</p>
                  <p className="font-semibold text-gray-900">{numberOfTargets}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Tokens détenus</p>
                  <p className="font-semibold text-gray-900">
                    {strategyQuantity ? parseFloat(strategyQuantity).toLocaleString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Prix moyen d'achat</p>
                  <p className="font-semibold text-purple-600">
                    {strategyAveragePrice ? `$${parseFloat(strategyAveragePrice).toLocaleString()}` : '-'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-gray-500 mb-1">Total investi</p>
                  <p className="text-lg font-bold text-green-600">
                    {strategyQuantity && strategyAveragePrice 
                      ? formatCurrency(parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice), '$', 2)
                      : '$0.00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Informations de base */}
              <div className="space-y-3 md:space-y-4">
                <div>
                  <Label htmlFor="strategyName" className="text-xs md:text-sm">Nom de la stratégie *</Label>
                  <Input
                    id="strategyName"
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="Ex: Stratégie BTC Conservative"
                    required
                    className="text-sm md:text-base"
                  />
                </div>
                
                <div>
                  <Label htmlFor="portfolio" className="text-xs md:text-sm">Portfolio / Wallet *</Label>
                  <Select
                    value={selectedStrategyPortfolioId}
                    onValueChange={(value) => {
                      setSelectedStrategyPortfolioId(value);
                      // Réinitialiser la quantité quand on change de portfolio
                      if (value !== 'virtual') {
                        setStrategyQuantity('');
                      }
                    }}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Sélectionner un wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Portfolios réels */}
                      {onboardingPortfolios.filter(p => p && p.id && p.name).map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </SelectItem>
                      ))}
                      {/* Séparateur visuel */}
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-t border-gray-200">
                        Simulation
                      </div>
                      {/* Wallet virtuelle */}
                      <SelectItem value="virtual">
                        Wallet Virtuelle
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {!isStrategyVirtualWallet && availableStrategyQuantity > 0 && selectedStrategyToken && (
                    <p className="mt-1 text-xs md:text-sm text-gray-600">
                      Quantité disponible: {availableStrategyQuantity.toLocaleString()} {selectedStrategyToken.symbol}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="token" className="text-xs md:text-sm">Token *</Label>
                  <TokenSearch
                    onTokenSelect={handleStrategyTokenSelect}
                    selectedToken={selectedStrategyToken}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="quantity" className="text-xs md:text-sm">
                      Quantité *
                      {!isStrategyVirtualWallet && availableStrategyQuantity > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                          (max: {availableStrategyQuantity.toLocaleString()})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={strategyQuantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Validation : si c'est un wallet réel, ne pas dépasser la quantité disponible
                        if (!isStrategyVirtualWallet && availableStrategyQuantity > 0 && value) {
                          const numValue = parseFloat(value);
                          if (numValue > availableStrategyQuantity) {
                            setError(
                              `La quantité ne peut pas dépasser ${availableStrategyQuantity.toLocaleString()} ${selectedStrategyToken?.symbol || ''}`
                            );
                            return;
                          }
                          setError('');
                        }
                        setStrategyQuantity(value);
                      }}
                      placeholder="Ex: 1.5"
                      step="0.00000001"
                      max={!isStrategyVirtualWallet && availableStrategyQuantity > 0 ? availableStrategyQuantity : undefined}
                      required
                      className="text-sm md:text-base"
                    />
                    {!isStrategyVirtualWallet && parseFloat(strategyQuantity) > availableStrategyQuantity && (
                      <p className="mt-1 text-xs md:text-sm text-red-600">
                        Quantité supérieure à celle disponible ({availableStrategyQuantity.toLocaleString()})
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="averagePrice" className="text-xs md:text-sm">Prix moyen (USD) *</Label>
                    <Input
                      id="averagePrice"
                      type="number"
                      value={strategyAveragePrice}
                      onChange={(e) => setStrategyAveragePrice(e.target.value)}
                      placeholder="Ex: 45000"
                      step="0.01"
                      required
                      className="text-sm md:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Configuration des cibles */}
              <div className="space-y-3 md:space-y-4">
                <div>
                  <Label htmlFor="numberOfTargets" className="text-xs md:text-sm">Nombre de sorties</Label>
                  <Select
                    value={numberOfTargets.toString()}
                    onValueChange={(value) => {
                      const val = parseInt(value);
                      if (!isNaN(val) && val >= 1 && val <= 6) {
                        setNumberOfTargets(val);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-40 text-sm md:text-base">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 sortie</SelectItem>
                      <SelectItem value="2">2 sorties</SelectItem>
                      <SelectItem value="3">3 sorties</SelectItem>
                      <SelectItem value="4">4 sorties</SelectItem>
                      <SelectItem value="5">5 sorties</SelectItem>
                      <SelectItem value="6">6 sorties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Titre pour les deux colonnes */}
                <div className="mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Configuration des cibles de profit</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Définissez vos paramètres et visualisez les résultats en temps réel</p>
                </div>

                {/* En-têtes des colonnes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-6">
                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-gray-900">Paramètres</h4>
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-gray-900">Informations calculées</h4>
                  </div>
                </div>

                {/* Cartes alignées par paire : Cible #1 avec Cible #1, etc. */}
                <div className="space-y-4 md:space-y-6">
                  {profitTargets.map((target, index) => {
                    const info = strategyInfo[index];
                    const qty = parseFloat(strategyQuantity);
                    const avgPrice = parseFloat(strategyAveragePrice);
                    
                    // Calculer le prix cible
                    let targetPrice = 0;
                    if (target.targetType === 'percentage') {
                      targetPrice = avgPrice * (1 + target.targetValue / 100);
                    } else {
                      targetPrice = target.targetValue;
                    }
                    
                    return (
                      <div key={target.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 items-stretch">
                        {/* Carte de gauche : Paramètres */}
                        <div className="border p-4 md:p-6 rounded-lg space-y-4 md:space-y-5 bg-gray-50 h-full flex flex-col">
                          <h3 className="text-sm md:text-base font-semibold text-gray-900">Cible #{index + 1}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              <Label htmlFor={`targetType-${index}`} className="text-xs md:text-sm">Type</Label>
                              <Select
                                value={target.targetType}
                                onValueChange={(value: string) => 
                                  handleTargetChange(index, 'targetType', value as 'percentage' | 'price')
                                }
                              >
                                <SelectTrigger className="text-sm md:text-base">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">% de profit</SelectItem>
                                  <SelectItem value="price">Prix exact</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`targetValue-${index}`} className="text-xs md:text-sm">
                                {target.targetType === 'percentage' ? 'Pourcentage (%)' : 'Prix (USD)'}
                              </Label>
                              <Input
                                id={`targetValue-${index}`}
                                type="number"
                                value={target.targetValue}
                                onChange={(e) => 
                                  handleTargetChange(index, 'targetValue', parseFloat(e.target.value))
                                }
                                step="0.01"
                                className="text-sm md:text-base"
                              />
                            </div>
                          </div>
                            <div className="flex-grow flex flex-col justify-end">
                            <div className="flex items-center justify-between mb-2">
                              <Label htmlFor={`sellPercentage-${index}`} className="text-xs md:text-sm">
                                Quantité à vendre (%)
                              </Label>
                              <span className="text-xs md:text-sm text-gray-500">
                                Total: {profitTargets.reduce((sum, t) => sum + t.sellPercentage, 0).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-2">
                              <div className="flex-1">
                                <Slider
                                  id={`sellPercentage-${index}`}
                                  min={0}
                                  max={(() => {
                                    // Calculer le maximum possible pour cette cible
                                    const otherTargetsTotal = profitTargets.reduce((sum, t, idx) => 
                                      idx === index ? sum : sum + t.sellPercentage, 0
                                    );
                                    return Math.min(100, 100 - otherTargetsTotal);
                                  })()}
                                  step={0.1}
                                  value={[target.sellPercentage]}
                                  onValueChange={(value) => 
                                    handleTargetChange(index, 'sellPercentage', value[0])
                                  }
                                  className="w-full"
                                />
                              </div>
                              <div className="w-full sm:w-24">
                                <Input
                                  type="number"
                                  min={0}
                                  max={(() => {
                                    const otherTargetsTotal = profitTargets.reduce((sum, t, idx) => 
                                      idx === index ? sum : sum + t.sellPercentage, 0
                                    );
                                    return 100 - otherTargetsTotal;
                                  })()}
                                  step={0.1}
                                  value={target.sellPercentage.toFixed(1)}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value) && value >= 0) {
                                      // Vérifier que la somme ne dépasse pas 100%
                                      const otherTargetsTotal = profitTargets.reduce((sum, t, idx) => 
                                        idx === index ? sum : sum + t.sellPercentage, 0
                                      );
                                      const maxValue = Math.max(0, 100 - otherTargetsTotal);
                                      handleTargetChange(index, 'sellPercentage', Math.min(value, maxValue));
                                    }
                                  }}
                                  placeholder="0.0"
                                  className="text-xs md:text-sm"
                                />
                              </div>
                            </div>
                            {profitTargets.reduce((sum, t) => sum + t.sellPercentage, 0) > 100 && (
                              <p className="mt-1 text-xs text-red-600">
                                La somme dépasse 100% !
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Carte de droite : Informations calculées */}
                        <Card className="border border-gray-200 h-full flex flex-col">
                          <CardContent className="p-4 md:p-6 flex flex-col h-full">
                            <div className="mb-3">
                              <h4 className="text-sm md:text-base font-semibold text-gray-900">Simulation #{index + 1}</h4>
                            </div>
                            <div className="space-y-3 text-xs md:text-sm flex-grow flex flex-col justify-between">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600">Valorisation des tokens restants:</span>
                                <span className="font-medium text-gray-900 text-right">
                                  {info ? formatCurrency(info.remainingTokensValuation, '$', 2) : '$0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600">Montant encaissé:</span>
                                <span className="font-medium text-gray-900 text-right">
                                  {info ? formatCurrency(info.amountCollected, '$', 2) : '$0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600">Valeur du bag restant:</span>
                                <span className="font-medium text-gray-900 text-right">
                                  {info ? formatCurrency(info.remainingBagValue, '$', 2) : '$0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-t border-gray-200 pt-3 mt-2">
                                <span className="text-gray-600 font-medium">Nombre de tokens restants:</span>
                                <span className="font-bold text-orange-600 text-lg text-right">
                                  {info ? info.remainingTokens.toFixed(6) : '0.000000'}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Barre de résumé en bas */}
            {strategyInfo.length > 0 && strategyQuantity && strategyAveragePrice && (
              <div className="mt-4 md:mt-8 bg-white border-2 border-gray-200 rounded-lg p-4 md:p-6 w-full max-w-full">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 items-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Investi</p>
                    <p className="text-base md:text-lg font-bold text-green-600">
                      {formatCurrency(parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice), '$', 2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total encaissé</p>
                    <p className="text-base md:text-lg font-bold text-green-600">
                      {formatCurrency(
                        strategyInfo.reduce((sum, info) => sum + info.amountCollected, 0),
                        '$',
                        2
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Résultat net</p>
                    <p className="text-base md:text-lg font-bold text-green-600">
                      {formatCurrency(
                        strategyInfo.reduce((sum, info) => sum + info.amountCollected, 0) - 
                        (parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice)),
                        '$',
                        2
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Rendement net</p>
                    <p className="text-base md:text-lg font-bold text-green-600">
                      {(((
                        strategyInfo.reduce((sum, info) => sum + info.amountCollected, 0) - 
                        (parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice))
                      ) / (parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice))) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tokens restants</p>
                    <p className="text-base md:text-lg font-bold text-orange-600">
                      {strategyInfo.length > 0 
                        ? strategyInfo[strategyInfo.length - 1].remainingTokens.toFixed(6)
                        : '0.000000'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer - Design amélioré avec plus d'espace */}
            <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 md:p-6 -mx-4 md:-mx-0 w-full max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
                  {/* Section informative à gauche */}
                  <div className="flex-1 space-y-2 md:space-y-3 w-full">
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <ChartBarIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-semibold text-gray-900">
                          Stratégie optimisée pour vos gains
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">
                          Vos cibles de profit sont calculées en temps réel pour maximiser vos rendements
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Section bouton à droite */}
                  <div className="flex-shrink-0 w-full lg:w-auto">
                    <Button
                      onClick={handleCreateStrategy}
                      disabled={isLoading || !selectedStrategyToken || !strategyQuantity || !strategyAveragePrice || !strategyName}
                      className="w-full lg:w-auto px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Création...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ChartBarIcon className="w-5 h-5" />
                          Créer la stratégie
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Configuration
        return (
          <div className="space-y-4 md:space-y-6">
            {/* Error Message */}
            {error && (
              <div className="mb-3 md:mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs md:text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success Messages */}
            {createdData.strategy && (
              <div className="mb-3 md:mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs md:text-sm text-green-600">
                  ✅ Stratégie "{createdData.strategy.name}" créée avec succès !
                </p>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                Configurez votre stratégie
              </h3>
              <p className="text-xs md:text-sm text-gray-600">
                Personnalisez les paramètres de votre stratégie
              </p>
            </div>

            <div className="text-center py-6 md:py-8">
              <Cog6ToothIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
              <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6 px-2">
                Accédez à la page de configuration pour personnaliser vos paramètres
              </p>
              <Button
                onClick={handleConfigureStrategy}
                className="w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg text-sm md:text-base"
              >
                Configurer
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-x-hidden">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-3 md:px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 md:space-x-3">
              <img 
                src="/Full_logo.svg" 
                alt="exStrat Logo" 
                className="h-6 md:h-8 w-auto"
              />
            </div>
            <button
              onClick={handleSkip}
              className="flex items-center space-x-1 md:space-x-2 text-gray-500 hover:text-gray-700 text-xs md:text-sm"
            >
              <XMarkIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Passer</span>
            </button>
          </div>
          <div className="flex items-center justify-between mb-2 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className={`flex items-center space-x-1 md:space-x-2 ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <step.icon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-xs md:text-sm font-medium hidden sm:inline">{step.name}</span>
                  <span className="text-xs md:text-sm font-medium sm:hidden">{step.name.substring(0, 4)}</span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 text-gray-300 mx-2 md:mx-4" />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5 md:h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${currentStep === 2 ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-3 md:px-4 sm:px-6 lg:px-8 py-4 md:py-8 overflow-x-hidden`}>
        <div className={`${currentStep === 2 ? 'max-w-full' : 'max-w-2xl'} mx-auto w-full`}>
          {/* Step Header */}
          <div className="text-center mb-4 md:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center mb-3 md:mb-4 gap-3 sm:gap-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <currentStepData.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="sm:ml-4 text-center sm:text-left">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {currentStep === 0 && 'Nouveau Portfolio'}
                  {currentStep === 1 && 'Connectez votre exchange'}
                  {currentStep === 2 && 'Créez votre première stratégie'}
                  {currentStep === 3 && 'Configurez votre stratégie'}
                </h1>
                <div className="flex items-center justify-center sm:justify-start text-xs md:text-sm text-gray-500 mt-1">
                  <ShieldCheckIcon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  <span>1 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <Card className="mb-4 md:mb-8">
            <CardContent className={`${currentStep === 2 ? 'p-4 md:p-6 lg:p-10' : 'p-4 md:p-6 lg:p-8'} w-full max-w-full overflow-x-hidden`}>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <Button
              onClick={handlePrevious}
              variant="outline"
              disabled={currentStep === 0}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 md:py-3 text-sm md:text-base"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Précédent</span>
            </Button>

            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <span>{isLoading ? 'Création...' : (currentStep === steps.length - 1 ? 'Terminer' : 'Suivant')}</span>
              {!isLoading && <ArrowRightIcon className="w-4 h-4" />}
            </Button>
          </div>

          {/* Security Info */}
          <div className="mt-4 md:mt-8 flex items-center justify-center text-xs md:text-sm text-gray-500 px-2">
            <ShieldCheckIcon className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            <span className="text-center">Connexion rapide et sécurisée à vos transactions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
