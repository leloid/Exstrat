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
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  WalletIcon
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
import { formatCurrency, formatPercentage } from '@/lib/format';
import { ONBOARDING_STEPS, INVESTMENT_SUB_STEPS } from './constants';

// Interface pour les cibles de profit
interface ProfitTarget {
  id: string;
  targetType: 'percentage' | 'price';
  targetValue: number;
  sellPercentage: number; // Pourcentage à vendre (base de calcul)
  sellQuantityType: 'percentage' | 'tokens'; // Type de quantité à vendre
  sellTokens: number; // Nombre de tokens à vendre (si sellQuantityType === 'tokens')
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

// Composant WalletSelector personnalisé avec un design amélioré
interface WalletSelectorProps {
  value: string;
  onChange: (value: string) => void;
  portfolios: any[];
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ value, onChange, portfolios }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Trouver le label de la valeur sélectionnée
  const getSelectedLabel = () => {
    if (value === 'all') return 'Tous les wallets';
    const portfolio = portfolios.find(p => p.id === value);
    return portfolio ? portfolio.name : 'Sélectionner un wallet';
  };

  // Fermer le dropdown quand on clique en dehors
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={selectRef} className="relative w-full sm:w-[280px]">
      <label className="block text-xs font-semibold text-gray-700 mb-2.5 uppercase tracking-wide">
        Wallet
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-14 px-5 py-3.5 bg-white border-2 rounded-xl shadow-sm
          flex items-center justify-between
          transition-all duration-200
          ${isOpen 
            ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-md' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }
          focus:outline-none focus:ring-4 focus:ring-blue-500/10
        `}
      >
        <span className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {getSelectedLabel()}
        </span>
        <ChevronDownIcon 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="py-2 max-h-72 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange('all');
                setIsOpen(false);
              }}
              className={`
                w-full px-5 py-3.5 text-left
                transition-colors duration-150
                ${value === 'all' 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">Tous les wallets</span>
                {value === 'all' && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
            </button>
            
            {portfolios.map((portfolio) => (
              <button
                key={portfolio.id}
                type="button"
                onClick={() => {
                  onChange(portfolio.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-5 py-3.5 text-left
                  transition-colors duration-150
                  ${value === portfolio.id 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{portfolio.name}</span>
                  <div className="flex items-center gap-2">
                    {portfolio.isDefault && (
                      <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md">
                        Défaut
                      </span>
                    )}
                    {value === portfolio.id && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Utiliser les constantes importées
const steps = ONBOARDING_STEPS;

const exchanges = [
  { id: 'binance', name: 'Binance', icon: BinanceIcon, available: false },
  { id: 'coinbase', name: 'Coinbase', icon: CoinbaseIcon, available: false },
  { id: 'kraken', name: 'Kraken', icon: KrakenIcon, available: false },
  { id: 'ledger', name: 'Ledger', icon: LedgerIcon, available: false },
  { id: 'metamask', name: 'Metamask', icon: MetamaskIcon, available: false },
  { id: 'phantom', name: 'Phantom', icon: PhantomIcon, available: false },
];

export default function OnboardingPage() {
  // Forcer le mode clair pour l'onboarding
  const [currentStep, setCurrentStep] = useState(0);
  const [investmentSubStep, setInvestmentSubStep] = useState<'portfolio' | 'add-crypto'>('portfolio');
  const [addCryptoMethod, setAddCryptoMethod] = useState<'exchange' | 'wallet' | 'manual' | null>(null);
  const [selectedPortfolioForTable, setSelectedPortfolioForTable] = useState<string>('all'); // 'all' ou un ID de portfolio
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set()); // Tokens dont les détails sont affichés
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
  const [allTransactions, setAllTransactions] = useState<any[]>([]); // Toutes les transactions chargées depuis l'API
  const [holdings, setHoldings] = useState<any[]>([]); // Holdings pour obtenir les prix actuels et PNL
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
  const [strategyStep, setStrategyStep] = useState<number>(1); // Étape actuelle (1-5)
  const [strategyName, setStrategyName] = useState<string>('');
  const [selectedStrategyToken, setSelectedStrategyToken] = useState<TokenSearchResult | null>(null);
  const [selectedStrategyPortfolioId, setSelectedStrategyPortfolioId] = useState<string>(''); // ID de portfolio (pas de wallet virtuel par défaut)
  const [availableStrategyQuantity, setAvailableStrategyQuantity] = useState<number>(0); // Quantité disponible dans le portfolio
  const [strategyQuantity, setStrategyQuantity] = useState<string>('');
  const [strategyAveragePrice, setStrategyAveragePrice] = useState<string>('');
  const [numberOfTargets, setNumberOfTargets] = useState<number>(0);
  const [profitTargets, setProfitTargets] = useState<ProfitTarget[]>([]);
  const [investmentData, setInvestmentData] = useState<{
    numberOfTransactions: number;
    totalInvested: number;
    totalQuantity: number;
    averagePrice: number;
    currentPrice?: number;
    currentPNL?: number;
    currentPNLPercentage?: number;
  } | null>(null);
  const [availableTokens, setAvailableTokens] = useState<TokenSearchResult[]>([]); // Tokens disponibles dans le wallet sélectionné
  
  const isStrategyVirtualWallet = selectedStrategyPortfolioId === 'virtual';
  
  // États pour la partie Prévisions (étape 3)
  const [previsionPortfolioId, setPrevisionPortfolioId] = useState<string>('');
  const [previsionName, setPrevisionName] = useState<string>('');
  const [previsionHoldings, setPrevisionHoldings] = useState<any[]>([]);
  const [previsionAppliedStrategies, setPrevisionAppliedStrategies] = useState<Record<string, string>>({});
  const [previsionExpandedTokens, setPrevisionExpandedTokens] = useState<Set<string>>(new Set());
  const [previsionTheoreticalStrategies, setPrevisionTheoreticalStrategies] = useState<any[]>([]);
  const [previsionLoading, setPrevisionLoading] = useState(false);
  const [savedPrevision, setSavedPrevision] = useState<any | null>(null);
  
  const router = useRouter();

  // Charger les stratégies théoriques pour la prévision
  const loadPrevisionTheoreticalStrategies = React.useCallback(async () => {
    try {
      const data = await portfoliosApi.getTheoreticalStrategies();
      // Normaliser le tokenSymbol en majuscules pour la comparaison
      const normalizedData = data.map(strategy => ({
        ...strategy,
        tokenSymbol: strategy.tokenSymbol?.toUpperCase() || '',
      }));
      setPrevisionTheoreticalStrategies(normalizedData);
      console.log('📋 Stratégies théoriques chargées:', normalizedData.length);
    } catch (error) {
      console.error('Erreur lors du chargement des stratégies:', error);
    }
  }, []);

  React.useEffect(() => {
    loadPrevisionTheoreticalStrategies();
  }, [loadPrevisionTheoreticalStrategies]);

  // Recharger les stratégies quand on arrive sur l'étape prévisions
  React.useEffect(() => {
    if (currentStep === 2) {
      console.log('🔄 Arrivée sur l\'étape prévisions, rechargement des stratégies...');
      loadPrevisionTheoreticalStrategies();
    }
  }, [currentStep, loadPrevisionTheoreticalStrategies]);

  // Charger les holdings quand un portfolio est sélectionné
  React.useEffect(() => {
    const loadPrevisionHoldings = async () => {
      if (!previsionPortfolioId || previsionPortfolioId === 'virtual') {
        setPrevisionHoldings([]);
        setPrevisionAppliedStrategies({});
        return;
      }
      
      try {
        setPrevisionLoading(true);
        const holdingsData = await portfoliosApi.getPortfolioHoldings(previsionPortfolioId);
        const portfolio = portfolios.find(p => p.id === previsionPortfolioId);
        
        const formattedHoldings: any[] = holdingsData.map((holding: any) => ({
          id: holding.id,
          token: {
            symbol: holding.token?.symbol || holding.symbol || '',
            name: holding.token?.name || holding.tokenName || '',
          },
          quantity: holding.quantity || 0,
          investedAmount: holding.investedAmount || holding.amountInvested || 0,
          averagePrice: holding.averagePrice || 0,
          currentPrice: holding.currentPrice,
          portfolioId: portfolio?.id || '',
          portfolioName: portfolio?.name || '',
        }));
        
        setPrevisionHoldings(formattedHoldings);
      } catch (error) {
        console.error('Erreur lors du chargement des holdings:', error);
        setPrevisionHoldings([]);
      } finally {
        setPrevisionLoading(false);
      }
    };
    
    loadPrevisionHoldings();
  }, [previsionPortfolioId, portfolios]);

  // Calculer le résultat pour un token
  const calculatePrevisionTokenResult = (holding: any): any | null => {
    const strategyId = previsionAppliedStrategies[holding.id];
    if (!strategyId || strategyId === 'none') {
      return null;
    }

    const strategy = previsionTheoreticalStrategies.find(s => s.id === strategyId);
    if (!strategy) return null;

    const quantity = holding.quantity;
    const averagePrice = holding.averagePrice;
    const currentPrice = holding.currentPrice || averagePrice;
    
    let remainingTokens = quantity;
    let totalCollected = 0;
    const profitTargetsDetails: Array<{
      order: number;
      targetPrice: number;
      tokensSold: number;
      amountCollected: number;
    }> = [];

    strategy.profitTargets.forEach((target: any) => {
      const tokensToSell = (quantity * target.sellPercentage) / 100;
      
      let targetPrice = 0;
      if (target.targetType === 'percentage') {
        targetPrice = averagePrice * (1 + target.targetValue / 100);
      } else {
        targetPrice = target.targetValue;
      }
      
      const amountCollected = tokensToSell * targetPrice;
      totalCollected += amountCollected;
      remainingTokens -= tokensToSell;

      profitTargetsDetails.push({
        order: target.order,
        targetPrice,
        tokensSold: tokensToSell,
        amountCollected,
      });
    });

    const totalInvested = quantity * averagePrice;
    const totalProfit = totalCollected - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    const remainingTokensValue = remainingTokens * currentPrice;

    return {
      holdingId: holding.id,
      token: holding.token.symbol,
      quantity,
      invested: totalInvested,
      averagePrice,
      amountCollected: totalCollected,
      returnPercentage,
      remainingTokens: Math.max(0, remainingTokens),
      remainingTokensValue,
      profitTargetsDetails,
    };
  };

  // Calculer le résumé global
  const calculatePrevisionGlobalSummary = (): any => {
    let totalInvested = 0;
    let totalCollected = 0;
    let totalRemainingTokensValue = 0;

    previsionHoldings.forEach(holding => {
      const result = calculatePrevisionTokenResult(holding);
      if (result) {
        totalInvested += result.invested;
        totalCollected += result.amountCollected;
        totalRemainingTokensValue += result.remainingTokensValue;
      } else {
        totalInvested += holding.investedAmount;
        totalRemainingTokensValue += holding.investedAmount;
      }
    });

    const totalProfit = totalCollected + totalRemainingTokensValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCollected,
      totalProfit,
      returnPercentage,
      remainingTokensValue: totalRemainingTokensValue,
    };
  };

  // Gérer le changement de stratégie
  const handlePrevisionStrategyChange = (holdingId: string, strategyId: string) => {
    setPrevisionAppliedStrategies(prev => ({
      ...prev,
      [holdingId]: strategyId,
    }));
  };

  // Toggle expansion des tokens
  const togglePrevisionTokenExpansion = (holdingId: string) => {
    setPrevisionExpandedTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(holdingId)) {
        newSet.delete(holdingId);
      } else {
        newSet.add(holdingId);
      }
      return newSet;
    });
  };

  // Obtenir les stratégies compatibles
  const getPrevisionCompatibleStrategies = (tokenSymbol: string) => {
    const upperSymbol = tokenSymbol.toUpperCase();
    return previsionTheoreticalStrategies.filter(s => 
      s.tokenSymbol?.toUpperCase() === upperSymbol
    );
  };

  // Sauvegarder la prévision
  const handleSavePrevision = async () => {
    if (!previsionName.trim() || !previsionPortfolioId) {
      return;
    }

    try {
      const summary = calculatePrevisionGlobalSummary();
      const portfolio = portfolios.find(p => p.id === previsionPortfolioId);
      const newForecast = await portfoliosApi.createForecast({
        portfolioId: previsionPortfolioId,
        name: previsionName,
        appliedStrategies: previsionAppliedStrategies,
        summary: {
          totalInvested: summary.totalInvested,
          totalCollected: summary.totalCollected,
          totalProfit: summary.totalProfit,
          returnPercentage: summary.returnPercentage,
          remainingTokensValue: summary.remainingTokensValue,
          tokenCount: previsionHoldings.length,
        },
      });
      
      // Stocker la prévision sauvegardée pour afficher le récapitulatif
      setSavedPrevision({
        id: newForecast.id,
        name: previsionName,
        portfolioId: previsionPortfolioId,
        portfolioName: portfolio?.name || '',
        createdAt: new Date().toISOString(),
        tokenCount: previsionHoldings.length,
        totalInvested: summary.totalInvested,
        totalCollected: summary.totalCollected,
        totalProfit: summary.totalProfit,
        returnPercentage: summary.returnPercentage,
        remainingTokensValue: summary.remainingTokensValue,
        appliedStrategies: previsionAppliedStrategies,
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

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
      
      // Initialiser selectedStrategyPortfolioId avec le premier portfolio disponible si vide
      if (!selectedStrategyPortfolioId && uniquePortfolios.length > 0) {
        setSelectedStrategyPortfolioId(uniquePortfolios[0].id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolios]);

  // Charger toutes les transactions et holdings depuis l'API quand on arrive sur la sous-étape "add-crypto" avec méthode "manual"
  React.useEffect(() => {
    if (currentStep === 0 && investmentSubStep === 'add-crypto' && addCryptoMethod === 'manual') {
      const loadAllData = async () => {
        try {
          setIsLoading(true);
          // Charger toutes les transactions (sans limite pour avoir toutes)
          const response = await transactionsApi.getTransactions({ limit: 1000 });
          const transactions = response.transactions || [];
          // Supprimer les doublons
          const uniqueTransactions = Array.from(
            new Map(transactions.map(t => [t.id, t])).values()
          );
          setAllTransactions(uniqueTransactions);

          // Charger les holdings pour obtenir les prix actuels et PNL
          if (selectedPortfolioForTable !== 'all') {
            try {
              const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(selectedPortfolioForTable);
              setHoldings(portfolioHoldings);
            } catch (err) {
              console.error('Erreur lors du chargement des holdings:', err);
            }
          } else {
            // Si "Tous les wallets", charger les holdings de tous les portfolios
            const allPortfolios = [
              ...onboardingPortfolios.filter(p => p && p.id && p.name),
              ...portfolios.filter(p => p && p.id && p.name)
            ];
            const uniquePortfolios = Array.from(
              new Map(allPortfolios.map(p => [p.id, p])).values()
            );
            const allHoldings: any[] = [];
            for (const portfolio of uniquePortfolios) {
              try {
                const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
                allHoldings.push(...portfolioHoldings);
              } catch (err) {
                console.error(`Erreur lors du chargement des holdings pour ${portfolio.id}:`, err);
              }
            }
            setHoldings(allHoldings);
          }
        } catch (err) {
          console.error('Erreur lors du chargement des transactions:', err);
          setError('Erreur lors du chargement des transactions');
        } finally {
          setIsLoading(false);
        }
      };
      loadAllData();
    }
  }, [currentStep, investmentSubStep, addCryptoMethod, selectedPortfolioForTable, onboardingPortfolios, portfolios]);

  // Fonction pour recharger les holdings après une modification de transaction
  const refreshHoldingsAfterTransaction = React.useCallback(async (portfolioId: string) => {
    try {
      if (selectedPortfolioForTable === 'all') {
        // Si "Tous les wallets", recharger tous les portfolios
        const allPortfolios = [
          ...onboardingPortfolios.filter(p => p && p.id && p.name),
          ...portfolios.filter(p => p && p.id && p.name)
        ];
        const uniquePortfolios = Array.from(
          new Map(allPortfolios.map(p => [p.id, p])).values()
        );
        const allHoldings: any[] = [];
        for (const portfolio of uniquePortfolios) {
          try {
            const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
            allHoldings.push(...portfolioHoldings);
          } catch (err) {
            console.error(`Erreur lors du rechargement des holdings pour ${portfolio.id}:`, err);
          }
        }
        setHoldings(allHoldings);
      } else if (selectedPortfolioForTable === portfolioId) {
        // Si c'est le portfolio sélectionné, recharger uniquement ce portfolio
        const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(portfolioId);
        setHoldings(portfolioHoldings);
      }
      // Si le portfolio modifié n'est pas celui sélectionné, ne rien faire
    } catch (err) {
      console.error(`Erreur lors du rechargement des holdings pour ${portfolioId}:`, err);
    }
  }, [selectedPortfolioForTable, onboardingPortfolios, portfolios]);

  // Recharger les holdings quand le portfolio sélectionné change
  React.useEffect(() => {
    if (currentStep === 0 && investmentSubStep === 'add-crypto' && addCryptoMethod === 'manual') {
      const loadHoldings = async () => {
        try {
          if (selectedPortfolioForTable !== 'all') {
            const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(selectedPortfolioForTable);
            setHoldings(portfolioHoldings);
          } else {
            // Si "Tous les wallets", charger les holdings de tous les portfolios
            const allPortfolios = [
              ...onboardingPortfolios.filter(p => p && p.id && p.name),
              ...portfolios.filter(p => p && p.id && p.name)
            ];
            const uniquePortfolios = Array.from(
              new Map(allPortfolios.map(p => [p.id, p])).values()
            );
            const allHoldings: any[] = [];
            for (const portfolio of uniquePortfolios) {
              try {
                const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
                allHoldings.push(...portfolioHoldings);
              } catch (err) {
                console.error(`Erreur lors du chargement des holdings pour ${portfolio.id}:`, err);
              }
            }
            setHoldings(allHoldings);
          }
        } catch (err) {
          console.error('Erreur lors du chargement des holdings:', err);
        }
      };
      loadHoldings();
    }
  }, [selectedPortfolioForTable, currentStep, investmentSubStep, addCryptoMethod, onboardingPortfolios, portfolios]);

  // Fonction pour gérer l'expansion/collapse des tokens
  const toggleTokenExpansion = (symbol: string) => {
    setExpandedTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  // Initialiser les cibles de profit quand le nombre change
  React.useEffect(() => {
    if (numberOfTargets <= 0) {
      setProfitTargets([]);
      return;
    }
    const newTargets: ProfitTarget[] = [];
    for (let i = 0; i < numberOfTargets; i++) {
      newTargets.push({
        id: `target-${i}`,
        targetType: 'percentage',
        targetValue: (i + 1) * 50, // 50%, 100%, 150%, etc.
        sellPercentage: 100 / numberOfTargets, // Répartition égale
        sellQuantityType: 'percentage', // Par défaut, utiliser le pourcentage
        sellTokens: 0, // Sera calculé automatiquement
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
          // Auto-remplir avec la quantité maximale disponible par défaut
          // L'utilisateur pourra ensuite modifier si nécessaire
          if (holding.quantity > 0) {
            setStrategyQuantity(holding.quantity.toString());
          }
        } else {
          setAvailableStrategyQuantity(0);
          // Si aucun holding n'existe pour ce token, réinitialiser la quantité
            setStrategyQuantity('');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la quantité disponible pour la stratégie:', error);
        setAvailableStrategyQuantity(0);
      }
    };
    
    loadAvailableStrategyQuantity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStrategyPortfolioId, selectedStrategyToken?.symbol]);
  
  // Charger les tokens disponibles dans le wallet sélectionné
  React.useEffect(() => {
    const loadAvailableTokens = async () => {
      if (!selectedStrategyPortfolioId || selectedStrategyPortfolioId === 'virtual') {
        setAvailableTokens([]);
        return;
      }

      try {
        const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(selectedStrategyPortfolioId);
        // Extraire les tokens uniques des holdings et rechercher leurs infos complètes
        const tokens: TokenSearchResult[] = [];
        for (const holding of portfolioHoldings.filter(h => h.token && h.quantity > 0)) {
          try {
            // Rechercher le token complet via l'API
            const searchResults = await transactionsApi.searchTokens(holding.token?.symbol || '');
            const fullToken = searchResults.find(t => t.symbol.toUpperCase() === holding.token?.symbol?.toUpperCase());
            if (fullToken) {
              tokens.push(fullToken);
            }
          } catch (err) {
            console.error(`Erreur lors de la recherche du token ${holding.token?.symbol}:`, err);
          }
        }
        setAvailableTokens(tokens);
      } catch (error) {
        console.error('Erreur lors du chargement des tokens disponibles:', error);
        setAvailableTokens([]);
      }
    };
    
    loadAvailableTokens();
  }, [selectedStrategyPortfolioId]);
  
  // Auto-remplir le prix moyen avec le prix actuel du token
  const handleStrategyTokenSelect = (token: TokenSearchResult | null) => {
    setSelectedStrategyToken(token);
    if (token && token.quote?.USD?.price) {
      setStrategyAveragePrice(token.quote.USD.price.toFixed(2));
    }
    // Passer à l'étape suivante (quantité)
    if (token && strategyStep === 2) {
      setStrategyStep(3);
    }
  };

  // Fonction pour passer à l'étape suivante
  const handleStrategyNextStep = () => {
    if (strategyStep < 5) {
      setStrategyStep(strategyStep + 1);
    }
  };

  // Fonction pour revenir à l'étape précédente
  const handleStrategyPreviousStep = () => {
    if (strategyStep > 1) {
      setStrategyStep(strategyStep - 1);
    }
  };

  // Calculer les données d'investissement depuis les transactions réelles
  React.useEffect(() => {
    const calculateInvestmentData = async () => {
      if (isStrategyVirtualWallet || !selectedStrategyToken || !selectedStrategyPortfolioId) {
        setInvestmentData(null);
        return;
      }

      try {
        // Récupérer toutes les transactions pour ce portfolio et ce token
        const allTransactionsForPortfolio = [
          ...allTransactions,
          ...onboardingTransactions
        ].filter(t => 
          t.portfolioId === selectedStrategyPortfolioId && 
          t.symbol?.toUpperCase() === selectedStrategyToken.symbol.toUpperCase()
        );

        if (allTransactionsForPortfolio.length === 0) {
          setInvestmentData(null);
          return;
        }

        // Calculer les totaux
        let totalQuantity = 0;
        let totalInvested = 0;
        let buyCount = 0;

        allTransactionsForPortfolio.forEach(tx => {
          if (tx.type === 'BUY' || tx.type === 'TRANSFER_IN' || tx.type === 'STAKING' || tx.type === 'REWARD') {
            totalQuantity += parseFloat(tx.quantity?.toString() || '0');
            totalInvested += parseFloat(tx.amountInvested?.toString() || '0');
            buyCount++;
          } else if (tx.type === 'SELL' || tx.type === 'TRANSFER_OUT') {
            totalQuantity = Math.max(0, totalQuantity - parseFloat(tx.quantity?.toString() || '0'));
            totalInvested = Math.max(0, totalInvested - parseFloat(tx.amountInvested?.toString() || '0'));
          }
        });

        const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

        // Récupérer le prix actuel depuis le holding
        const holding = holdings.find(h => 
          h.token?.symbol?.toUpperCase() === selectedStrategyToken.symbol.toUpperCase()
        );
        const currentPrice = holding?.currentPrice || selectedStrategyToken.quote?.USD?.price;
        const currentValue = totalQuantity * (currentPrice || averagePrice);
        const currentPNL = currentValue - totalInvested;
        const currentPNLPercentage = totalInvested > 0 ? (currentPNL / totalInvested) * 100 : 0;

        setInvestmentData({
          numberOfTransactions: buyCount,
          totalInvested,
          totalQuantity,
          averagePrice,
          currentPrice,
          currentPNL,
          currentPNLPercentage,
        });

        // Auto-remplir les champs avec les valeurs calculées (uniquement pour les wallets réels)
        if (!isStrategyVirtualWallet) {
          if (totalQuantity > 0) {
            // Toujours mettre à jour la quantité avec le maximum disponible pour les wallets réels
            setStrategyQuantity(totalQuantity.toString());
          }
          if (averagePrice > 0) {
            // Toujours mettre à jour le prix moyen avec la valeur calculée depuis les transactions
            setStrategyAveragePrice(averagePrice.toFixed(2));
          }
        }
      } catch (err) {
        console.error('Erreur lors du calcul des données d\'investissement:', err);
        setInvestmentData(null);
      }
    };

    calculateInvestmentData();
  }, [selectedStrategyPortfolioId, selectedStrategyToken, allTransactions, onboardingTransactions, holdings, isStrategyVirtualWallet]);

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

  // Fonction pour mettre à jour le pourcentage à partir du nombre de tokens
  const handleTokensChange = (index: number, tokensValue: number) => {
    const qty = parseFloat(strategyQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Veuillez d\'abord saisir une quantité de tokens');
      return;
    }
    
    // Calculer le pourcentage équivalent basé sur le total initial (pas sur le reste)
    const percentage = (tokensValue / qty) * 100;
    
    // Vérifier que le total ne dépasse pas 100%
    const otherTargetsTotal = profitTargets.reduce((sum, target, idx) => 
      idx === index ? sum : sum + target.sellPercentage, 0
    );
    const maxPercentage = Math.max(0, 100 - otherTargetsTotal);
    
    // Limiter le pourcentage et ajuster les tokens si nécessaire
    const finalPercentage = Math.min(percentage, maxPercentage);
    handleTargetChange(index, 'sellPercentage', finalPercentage);
    
    // Réinitialiser l'erreur si tout est OK
    if (finalPercentage <= maxPercentage) {
      setError('');
    }
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
      
      // Calculer les tokens vendus pour cette cible
      // Si sellQuantityType est 'tokens', utiliser directement sellTokens
      // Sinon, utiliser le pourcentage sur le total initial (pas sur le reste)
      let tokensSold = 0;
      if (target.sellQuantityType === 'tokens' && target.sellTokens > 0) {
        tokensSold = Math.min(target.sellTokens, remainingTokens);
      } else {
        // Pourcentage calculé sur le total initial, pas sur le reste
        tokensSold = (qty * target.sellPercentage) / 100;
        // Ne pas vendre plus que ce qui reste disponible
        tokensSold = Math.min(tokensSold, remainingTokens);
      }
      
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
    // Gérer les sous-étapes de l'investissement
    if (currentStep === 0) {
      if (investmentSubStep === 'portfolio') {
        // Passer à la sous-étape d'ajout de crypto
        setInvestmentSubStep('add-crypto');
        return;
      } else if (investmentSubStep === 'add-crypto') {
        // Si on n'a pas encore choisi de méthode, ne rien faire
        if (!addCryptoMethod) {
          return;
        }
        // Si on a choisi "Enter manually", vérifier qu'il y a des transactions (onboarding ou existantes)
        if (addCryptoMethod === 'manual') {
          // Combiner toutes les transactions pour vérifier s'il y en a
          const combinedTransactions = [
            ...allTransactions,
            ...onboardingTransactions
          ];
          const uniqueTransactions = Array.from(
            new Map(combinedTransactions.map(t => [t.id, t])).values()
          );
          
          // Filtrer selon le portfolio sélectionné
          const filteredTransactions = uniqueTransactions.filter(transaction => {
            if (!transaction || !transaction.id) return false;
            if (selectedPortfolioForTable !== 'all' && transaction.portfolioId !== selectedPortfolioForTable) {
              return false;
            }
            return true;
          });
          
          // Si on a des transactions, passer à l'étape suivante
          if (filteredTransactions.length > 0) {
            setCurrentStep(1);
            setInvestmentSubStep('portfolio'); // Réinitialiser pour la prochaine fois
            setAddCryptoMethod(null);
          }
        } else {
          // Pour les autres méthodes (exchange, wallet), passer directement à l'étape suivante
          setCurrentStep(1);
          setInvestmentSubStep('portfolio');
          setAddCryptoMethod(null);
        }
        return;
      }
    }
    
    // Si on est sur l'étape stratégie (step 1 maintenant), créer la stratégie avant de continuer
    if (currentStep === 1) {
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
          
          // Ajouter la stratégie créée à la liste des stratégies théoriques pour l'étape prévision
          if (createdStrategy && createdStrategy.id) {
            // Formater la stratégie au format attendu (même format que getTheoreticalStrategies)
            const formattedStrategy = {
              id: createdStrategy.id,
              name: createdStrategy.name,
              tokenSymbol: createdStrategy.tokenSymbol?.toUpperCase() || selectedStrategyToken.symbol.toUpperCase(),
              profitTargets: Array.isArray(createdStrategy.profitTargets) 
                ? createdStrategy.profitTargets 
                : [],
            };
            
            console.log('📝 Ajout de la stratégie à la liste:', formattedStrategy);
            
            setPrevisionTheoreticalStrategies(prev => {
              // Vérifier si la stratégie n'existe pas déjà
              const exists = prev.some(s => s.id === createdStrategy.id);
              if (exists) {
                console.log('⚠️ Stratégie déjà présente, mise à jour');
                // Mettre à jour la stratégie existante
                return prev.map(s => s.id === createdStrategy.id ? formattedStrategy : s);
              }
              console.log('✅ Nouvelle stratégie ajoutée, total:', prev.length + 1);
              return [...prev, formattedStrategy];
            });
          }
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
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Si on passe à l'étape prévisions (step 2), recharger les stratégies théoriques
      if (nextStep === 2) {
        // Attendre un peu pour s'assurer que la stratégie est bien sauvegardée côté backend
        setTimeout(() => {
          console.log('🔄 Passage à l\'étape prévisions, rechargement des stratégies...');
          loadPrevisionTheoreticalStrategies();
        }, 500);
      }
    } else {
      // Fin de l'onboarding
      // Si une prévision a été sauvegardée, rediriger vers /prevision avec l'onglet "Mes prévisions"
      if (savedPrevision) {
        router.push('/prevision?tab=list');
      } else {
        // Sinon, rediriger vers le dashboard
      router.push('/dashboard');
      }
    }
  };

  const handlePrevious = () => {
    // Gérer les sous-étapes de l'investissement
    if (currentStep === 0) {
      if (investmentSubStep === 'add-crypto') {
        setInvestmentSubStep('portfolio');
        setAddCryptoMethod(null);
        return;
      }
    }
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
        
        // Mettre à jour immédiatement onboardingPortfolios pour refléter les changements
        setOnboardingPortfolios(prev => 
          prev.map(p => p.id === editingPortfolio.id ? updatedPortfolio : p)
        );
        
        // Rafraîchir les portfolios du contexte pour s'assurer de la synchronisation
        await refreshPortfolios();
        
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
      // Supprimer aussi de allTransactions
      setAllTransactions(prev => prev.filter(t => t.id !== transactionId));
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
        // Mettre à jour aussi dans allTransactions
        setAllTransactions(prev => {
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
        // Ajouter aussi à allTransactions pour qu'elle apparaisse immédiatement
        setAllTransactions(prev => {
          const exists = prev.some(t => t && t.id === createdTransaction.id);
          if (exists) {
            return prev.map(t => t && t.id === createdTransaction.id ? createdTransaction : t);
          }
          return [...prev, createdTransaction];
        });
        setCreatedData(prev => ({ ...prev, transaction: createdTransaction }));
      }
      
      // Recharger les holdings pour mettre à jour les PNL après l'ajout/modification d'une transaction
      const portfolioIdToRefresh = transactionData.portfolioId;
      if (portfolioIdToRefresh) {
        await refreshHoldingsAfterTransaction(portfolioIdToRefresh);
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
      setCurrentStep(2);
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



  const handleSkip = () => {
    router.push('/dashboard');
  };

  const filteredExchanges = exchanges.filter(exchange =>
    exchange.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour rendre la sous-étape de création de portfolio
  const renderPortfolioSubStep = () => {
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
  };

  // Fonction pour rendre la sélection de méthode d'ajout crypto
  const renderAddCryptoSelection = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Ajouter de la crypto
          </h3>
          <p className="text-sm md:text-base text-gray-600">
            Choisissez comment vous souhaitez ajouter vos cryptomonnaies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Link Exchange */}
          <Card 
            className="opacity-50 grayscale cursor-not-allowed transition-all duration-200 border border-gray-200 h-full flex flex-col pointer-events-none"
          >
            <CardContent className="p-6 flex flex-col h-full">
              <div className="h-32 mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/30 rounded-full blur-xl"></div>
                  <div className="w-16 h-16 bg-white/20 rounded-full blur-lg absolute"></div>
                  <div className="w-12 h-12 bg-white/10 rounded-full blur-md absolute"></div>
                </div>
              </div>
              <div className="mb-3 h-6 flex items-center">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  <ShieldCheckIcon className="w-3 h-3" />
                  FULLY SECURED
                </span>
              </div>
              <h4 className="font-bold text-base md:text-lg text-gray-900 mb-2">
                Link Exchange
              </h4>
              <p className="text-sm text-gray-600 mb-auto flex-grow">
                Connect to your exchange and automatically import...
              </p>
              <div className="flex justify-end mt-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRightIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crypto Wallet */}
          <Card 
            className="opacity-50 grayscale cursor-not-allowed transition-all duration-200 border border-gray-200 h-full flex flex-col pointer-events-none"
          >
            <CardContent className="p-6 flex flex-col h-full">
              <div className="h-32 mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/30 rounded-full blur-xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-blue-300/50 rounded-full"></div>
                    <div className="w-12 h-12 border-4 border-blue-400/50 rounded-full absolute"></div>
                    <div className="w-8 h-8 bg-white/50 rounded-full absolute"></div>
                  </div>
                </div>
              </div>
              <div className="mb-3 h-6 flex items-center">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  <ShieldCheckIcon className="w-3 h-3" />
                  FULLY SECURED
                </span>
              </div>
              <h4 className="font-bold text-base md:text-lg text-gray-900 mb-2">
                Crypto Wallet
              </h4>
              <p className="text-sm text-gray-600 mb-auto flex-grow">
                Link popular Wallets like Ledger, Metamask and man...
              </p>
              <div className="flex justify-end mt-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRightIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enter manually */}
          <Card 
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 border border-gray-200 h-full flex flex-col"
            onClick={() => setAddCryptoMethod('manual')}
          >
            <CardContent className="p-6 flex flex-col h-full">
              <div className="h-32 mb-4 bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-blue-200/20 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 border-4 border-blue-300/30 rounded-full flex items-center justify-center">
                      <div className="w-1 h-8 bg-blue-400/50 rounded"></div>
                      <div className="w-8 h-1 bg-blue-400/50 rounded absolute"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-3 h-6 flex items-center">
                {/* Espace réservé pour l'alignement même sans badge */}
              </div>
              <h4 className="font-bold text-base md:text-lg text-gray-900 mb-2">
                Enter manually
              </h4>
              <p className="text-sm text-gray-600 mb-auto flex-grow">
                10,000 available cryptos, ranging from BTC to Altcoin...
              </p>
              <div className="flex justify-end mt-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRightIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </div>
        );
  };

  // Fonction pour rendre l'ajout manuel de crypto (avec tableau d'investissement)
  const renderManualAddCrypto = () => {
        return (
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}


        {/* Tableau d'investissement */}
        {(() => {
          // Combiner toutes les transactions : celles de l'onboarding + celles chargées depuis l'API
          const combinedTransactions = [
            ...allTransactions,
            ...onboardingTransactions
          ];
          // Supprimer les doublons (priorité aux transactions de l'onboarding pour les IDs identiques)
          const uniqueTransactions = Array.from(
            new Map(combinedTransactions.map(t => [t.id, t])).values()
          );
          
          // Filtrer selon le portfolio et la recherche
          const filteredTransactions = uniqueTransactions.filter(transaction => {
            if (!transaction || !transaction.id) return false;
            // Filtrer par portfolio si un portfolio est sélectionné
            if (selectedPortfolioForTable !== 'all' && transaction.portfolioId !== selectedPortfolioForTable) {
              return false;
            }
            // Filtrer par recherche de symbole
            if (searchTerm && !transaction.symbol?.toLowerCase().includes(searchTerm.toLowerCase())) {
              return false;
            }
            return true;
          });

          // Grouper les transactions par token (symbol) pour la vue niveau 1
          const transactionsByToken = new Map<string, any[]>();
          filteredTransactions.forEach(transaction => {
            const symbol = transaction.symbol?.toUpperCase() || '';
            if (!transactionsByToken.has(symbol)) {
              transactionsByToken.set(symbol, []);
            }
            transactionsByToken.get(symbol)!.push(transaction);
          });

          // Calculer les valeurs agrégées pour chaque token (niveau 1)
          const tokenSummaries = Array.from(transactionsByToken.entries()).map(([symbol, transactions]) => {
            // Calculer les totaux
            const totalQuantity = transactions.reduce((sum, t) => sum + parseFloat(t.quantity?.toString() || '0'), 0);
            const totalAmountInvested = transactions.reduce((sum, t) => sum + parseFloat(t.amountInvested?.toString() || '0'), 0);
            const weightedAveragePrice = totalQuantity > 0 ? totalAmountInvested / totalQuantity : 0;
            
            // Trouver la dernière transaction
            const lastTransaction = transactions.sort((a, b) => {
              const dateA = a.transactionDate ? new Date(a.transactionDate).getTime() : 0;
              const dateB = b.transactionDate ? new Date(b.transactionDate).getTime() : 0;
              return dateB - dateA;
            })[0];

            // Trouver le holding correspondant pour obtenir le prix actuel et PNL
            // Si "Tous les wallets" est sélectionné, on doit trouver le holding qui correspond au token
            // parmi tous les portfolios. Si un portfolio spécifique est sélectionné, les holdings
            // sont déjà filtrés par ce portfolio dans le useEffect.
            const holding = holdings.find(h => 
              h.token?.symbol?.toUpperCase() === symbol.toUpperCase()
            );

            // Utiliser le prix actuel du holding s'il existe
            // IMPORTANT: Si currentPrice n'existe pas, on ne peut pas calculer un PNL valide
            // car utiliser averagePrice donnerait toujours un PNL de 0
            let currentPrice: number;
            let currentValue: number;
            let pnlAbsolute: number;
            let pnlPercentage: number;
            
            if (holding?.currentPrice && holding.currentPrice > 0) {
              // Calculer avec le vrai prix actuel du marché
              currentPrice = holding.currentPrice;
              currentValue = totalQuantity * currentPrice;
              pnlAbsolute = currentValue - totalAmountInvested;
              pnlPercentage = totalAmountInvested > 0 ? (pnlAbsolute / totalAmountInvested) * 100 : 0;
            } else if (holding?.currentValue !== undefined && holding?.profitLoss !== undefined && holding?.profitLossPercentage !== undefined) {
              // Utiliser les valeurs calculées par le backend si disponibles
              // Ajuster proportionnellement si les quantités diffèrent
              const holdingQuantity = holding.quantity || 0;
              if (holdingQuantity > 0 && Math.abs(holdingQuantity - totalQuantity) < 0.0001) {
                // Les quantités correspondent exactement, utiliser directement les valeurs du holding
                currentPrice = holding.currentValue / holdingQuantity;
                currentValue = holding.currentValue;
                pnlAbsolute = holding.profitLoss;
                pnlPercentage = holding.profitLossPercentage;
              } else if (holdingQuantity > 0) {
                // Les quantités diffèrent, recalculer proportionnellement
                const pricePerToken = holding.currentValue / holdingQuantity;
                currentPrice = pricePerToken;
                currentValue = totalQuantity * pricePerToken;
                pnlAbsolute = currentValue - totalAmountInvested;
                pnlPercentage = totalAmountInvested > 0 ? (pnlAbsolute / totalAmountInvested) * 100 : 0;
              } else {
                // Pas de quantité dans le holding, utiliser le prix moyen
                currentPrice = holding?.averagePrice || weightedAveragePrice;
                currentValue = totalQuantity * currentPrice;
                pnlAbsolute = currentValue - totalAmountInvested;
                pnlPercentage = totalAmountInvested > 0 ? (pnlAbsolute / totalAmountInvested) * 100 : 0;
              }
            } else {
              // Pas de prix actuel disponible - utiliser le prix moyen (PNL sera 0 ou proche de 0)
              currentPrice = holding?.averagePrice || weightedAveragePrice;
              currentValue = totalQuantity * currentPrice;
              pnlAbsolute = currentValue - totalAmountInvested;
              pnlPercentage = totalAmountInvested > 0 ? (pnlAbsolute / totalAmountInvested) * 100 : 0;
            }

            return {
              symbol,
              name: lastTransaction?.name || symbol,
              totalQuantity,
              totalAmountInvested,
              weightedAveragePrice,
              currentPrice,
              currentValue,
              pnlAbsolute,
              pnlPercentage,
              lastTransactionDate: lastTransaction?.transactionDate,
              transactions, // Garder les transactions pour la vue détaillée
              logoUrl: holding?.token?.logoUrl
            };
          });

          // Filtrer par recherche de symbole au niveau des tokens
          const filteredTokenSummaries = tokenSummaries.filter(summary => {
            if (searchTerm && !summary.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
              return false;
            }
            return true;
          });

          return filteredTokenSummaries.length > 0 || isLoading ? (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                  Mes investissements
                </h3>
                <p className="text-sm text-gray-600">
                  Choisissez un portfolio et visualisez l'ensemble de vos données d'investissements
                </p>
              </div>
              {/* Sélecteur de wallet */}
              <div className="w-full sm:w-auto">
                <WalletSelector
                  value={selectedPortfolioForTable}
                  onChange={setSelectedPortfolioForTable}
                  portfolios={(() => {
                    const allPortfolios = [
                      ...onboardingPortfolios.filter(p => p && p.id && p.name),
                      ...portfolios.filter(p => p && p.id && p.name)
                    ];
                    return Array.from(
                      new Map(allPortfolios.map(p => [p.id, p])).values()
                    );
                  })()}
                />
              </div>
            </div>
            
            {/* Barre de recherche */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Chercher un symbole"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-base"
              />
            </div>

            {/* Tableau */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-gray-700 w-12"></th>
                    <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-gray-700">Symbol</th>
                    <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-gray-700">Nom</th>
                    <th className="text-right py-3 px-4 text-xs md:text-sm font-semibold text-gray-700">Quantité</th>
                    <th className="text-right py-3 px-4 text-xs md:text-sm font-semibold text-gray-700">Montant</th>
                    <th className="text-right py-3 px-4 text-xs md:text-sm font-semibold text-gray-700">Prix moyen</th>
                    <th className="text-right py-3 px-4 text-xs md:text-sm font-semibold text-gray-700">Valeur actuelle</th>
                    <th className="text-right py-3 px-4 text-xs md:text-sm font-semibold text-gray-700">PNL</th>
                    <th className="text-right py-3 px-4 text-xs md:text-sm font-semibold text-gray-700">PNL %</th>
                    <th className="text-right py-3 px-4 text-xs md:text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTokenSummaries.map((tokenSummary) => {
                    const isExpanded = expandedTokens.has(tokenSummary.symbol);
                    return (
                      <React.Fragment key={tokenSummary.symbol}>
                        {/* Niveau 1 : Vue principale par token (agrégée) */}
                        <tr 
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => toggleTokenExpansion(tokenSummary.symbol)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              {isExpanded ? (
                                <ChevronDownIcon className="h-4 w-4 text-gray-400 transform rotate-180 transition-transform" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform" />
                              )}
            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {tokenSummary.logoUrl ? (
                                <img src={tokenSummary.logoUrl} alt={tokenSummary.symbol} className="w-6 h-6 rounded-full" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{tokenSummary.symbol.charAt(0)}</span>
                            </div>
                              )}
                              <span className="text-sm font-medium text-gray-900">{tokenSummary.symbol}</span>
                              </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">{tokenSummary.name}</td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900">{tokenSummary.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900">{formatCurrency(tokenSummary.totalAmountInvested, '$', 2)}</td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900">{formatCurrency(tokenSummary.weightedAveragePrice, '$', 2)}</td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900">{formatCurrency(tokenSummary.currentValue, '$', 2)}</td>
                          <td className={`py-3 px-4 text-sm text-right font-medium ${tokenSummary.pnlAbsolute >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(tokenSummary.pnlAbsolute, '$', 2)}
                          </td>
                          <td className={`py-3 px-4 text-sm text-right font-medium ${tokenSummary.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tokenSummary.pnlPercentage >= 0 ? '+' : ''}{tokenSummary.pnlPercentage.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-600">
                            {tokenSummary.lastTransactionDate ? new Date(tokenSummary.lastTransactionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                          </td>
                        </tr>
                        {/* Niveau 2 : Vue détaillée par transaction (expandable) */}
                        {isExpanded && (
                          <>
                            {/* En-tête pour la vue détaillée */}
                            <tr className="bg-gray-100/50">
                              <td colSpan={10} className="py-2 px-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                  Transactions individuelles ({tokenSummary.transactions.length})
                              </div>
                              </td>
                            </tr>
                            {tokenSummary.transactions.map((transaction) => {
                              // Calculer PNL pour chaque transaction
                              // Utiliser le prix actuel du token (même que pour le résumé agrégé)
                              const transactionCurrentPrice = tokenSummary.currentPrice || parseFloat(transaction.averagePrice?.toString() || '0');
                              const transactionQuantity = parseFloat(transaction.quantity?.toString() || '0');
                              const transactionCurrentValue = transactionQuantity * transactionCurrentPrice;
                              const transactionAmountInvested = parseFloat(transaction.amountInvested?.toString() || '0');
                              const transactionPnlAbsolute = transactionCurrentValue - transactionAmountInvested;
                              const transactionPnlPercentage = transactionAmountInvested > 0 ? (transactionPnlAbsolute / transactionAmountInvested) * 100 : 0;

                              return (
                                <React.Fragment key={transaction.id}>
                                  <tr 
                                    className="border-b border-gray-50 bg-gray-50/50 hover:bg-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <td className="py-2 px-4"></td>
                                    <td className="py-2 px-4"></td>
                                    <td className="py-2 px-4"></td>
                                    <td className="py-2 px-4 text-xs text-right text-gray-700">{parseFloat(transaction.quantity?.toString() || '0').toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                                    <td className="py-2 px-4 text-xs text-right text-gray-700">{formatCurrency(transactionAmountInvested, '$', 2)}</td>
                                    <td className="py-2 px-4 text-xs text-right text-gray-700">{formatCurrency(parseFloat(transaction.averagePrice?.toString() || '0'), '$', 2)}</td>
                                    <td className="py-2 px-4 text-xs text-right text-gray-700">{formatCurrency(transactionCurrentValue, '$', 2)}</td>
                                    <td className={`py-2 px-4 text-xs text-right font-medium ${transactionPnlAbsolute >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatCurrency(transactionPnlAbsolute, '$', 2)}
                                    </td>
                                    <td className={`py-2 px-4 text-xs text-right font-medium ${transactionPnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {transactionPnlPercentage >= 0 ? '+' : ''}{transactionPnlPercentage.toFixed(2)}%
                                    </td>
                                    <td className="py-2 px-4">
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="text-xs text-right text-gray-600">
                                          {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                                        </span>
                                        <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditTransaction(transaction);
                                            }}
                                            className="p-1 h-6 w-6 text-gray-600 hover:text-gray-900"
                                          >
                                            <PencilIcon className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteTransaction(transaction.id);
                                            }}
                                            className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                                          >
                                            <TrashIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                                    </td>
                                  </tr>
                                  {transaction.notes && (
                                    <tr 
                                      className="bg-gray-50/30"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <td colSpan={10} className="py-1 px-4">
                                        <div className="text-xs text-gray-600 italic pl-8">
                                          📝 Note: {transaction.notes}
                </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
          ) : null;
        })()}

        {/* Footer avec bouton Add Transaction */}
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
                            const allPortfolios = [
                              ...onboardingPortfolios.filter(p => p && p.id && p.name),
                              ...portfolios.filter(p => p && p.id && p.name)
                            ];
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
                    </div>

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
      </div>
    );
  };

  // Fonction pour rendre l'ajout via Exchange (placeholder)
  const renderExchangeAddCrypto = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Link Exchange</h3>
          <p className="text-sm text-gray-600">Fonctionnalité à venir...</p>
              </div>
      </div>
    );
  };

  // Fonction pour rendre l'ajout via Wallet (placeholder)
  const renderWalletAddCrypto = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Crypto Wallet</h3>
          <p className="text-sm text-gray-600">Fonctionnalité à venir...</p>
            </div>
          </div>
        );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Investissement
        // Gérer les sous-étapes
        if (investmentSubStep === 'portfolio') {
          return renderPortfolioSubStep();
        } else if (investmentSubStep === 'add-crypto') {
          if (!addCryptoMethod) {
            return renderAddCryptoSelection();
          } else if (addCryptoMethod === 'manual') {
            return renderManualAddCrypto();
          } else if (addCryptoMethod === 'exchange') {
            return renderExchangeAddCrypto();
          } else if (addCryptoMethod === 'wallet') {
            return renderWalletAddCrypto();
          }
        }
        return null;

      case 1: // Stratégie
        return (
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
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

            <div className="space-y-4 md:space-y-6">

                {/* Structure en deux colonnes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                  {/* Colonne gauche : Zone A - Inputs */}
            <div className="space-y-4 md:space-y-6">
                    <Card className="border border-gray-200 bg-white">
                      <CardContent className="p-4 md:p-6 space-y-4">
                        <h4 className="text-sm md:text-base font-semibold mb-4 text-gray-900">Paramétrage de la stratégie</h4>
                        
                        {/* Étape 1 : Portfolio */}
                {strategyStep >= 1 && (
                  <div className={strategyStep === 1 ? 'ring-2 ring-blue-200 rounded-lg p-2 -m-2' : ''}>
                          <Label htmlFor="portfolio" className="text-xs md:text-sm flex items-center gap-2">
                            1. Choisissez votre wallet
                            {strategyStep > 1 && (
                              <span className="text-xs text-green-600 font-medium">✓ Complété</span>
                            )}
                          </Label>
                  <Select
                    value={selectedStrategyPortfolioId}
                    onValueChange={(value) => {
                      setSelectedStrategyPortfolioId(value);
                      setSelectedStrategyToken(null);
                        setStrategyQuantity('');
                      setStrategyName('');
                      setNumberOfTargets(0);
                      setProfitTargets([]);
                      if (value !== 'virtual' && value) {
                        setStrategyStep(2); // Passer à l'étape token
                      }
                    }}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Sélectionner un wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {onboardingPortfolios.filter(p => p && p.id && p.name).map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </SelectItem>
                      ))}
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-t border-gray-200">
                        Simulation
                      </div>
                      <div className="px-3 py-2 text-sm text-gray-400 cursor-not-allowed opacity-50">
                        Wallet Virtuelle
                      </div>
                    </SelectContent>
                  </Select>
                  {selectedStrategyPortfolioId && strategyStep === 1 && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        onClick={handleStrategyNextStep}
                        className="flex-1"
                      >
                        Suivant
                      </Button>
                    </div>
                  )}
                </div>
                )}
                
                        {/* Étape 2 : Token */}
                {strategyStep >= 2 && selectedStrategyPortfolioId && (
                  <div className={strategyStep === 2 ? 'ring-2 ring-blue-200 rounded-lg p-2 -m-2' : ''}>
                          <Label htmlFor="token" className="text-xs md:text-sm flex items-center gap-2">
                            2. Choisissez un token
                            {strategyStep > 2 && (
                              <span className="text-xs text-green-600 font-medium">✓ Complété</span>
                            )}
                          </Label>
                  {availableTokens.length > 0 && !isStrategyVirtualWallet ? (
                    <Select
                      value={selectedStrategyToken?.symbol || ''}
                      onValueChange={(value) => {
                        const token = availableTokens.find(t => t.symbol === value);
                        handleStrategyTokenSelect(token || null);
                      }}
                    >
                      <SelectTrigger className="text-sm md:text-base">
                        <SelectValue placeholder="Sélectionner un token" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTokens.map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            {token.symbol} - {token.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                  <TokenSearch
                    onTokenSelect={handleStrategyTokenSelect}
                    selectedToken={selectedStrategyToken}
                  />
                  )}
                  {selectedStrategyToken && strategyStep === 2 && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        onClick={handleStrategyPreviousStep}
                        variant="outline"
                        className="flex-1"
                      >
                        Précédent
                      </Button>
                      <Button
                        type="button"
                        onClick={handleStrategyNextStep}
                        className="flex-1"
                      >
                        Suivant
                      </Button>
                </div>
                  )}
                </div>
                )}
                
                        {/* Étape 3 : Quantité */}
                {strategyStep >= 3 && selectedStrategyToken && (
                  <div className={strategyStep === 3 ? 'ring-2 ring-blue-200 rounded-lg p-2 -m-2' : ''}>
                            <Label htmlFor="quantity" className="text-xs md:text-sm flex items-center gap-2">
                              3. Quantité à appliquer à la stratégie
                              {strategyStep > 3 && (
                                <span className="text-xs text-green-600 font-medium">✓ Complété</span>
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
                                      `La quantité ne peut pas dépasser ${availableStrategyQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${selectedStrategyToken?.symbol || ''}`
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
                            {!isStrategyVirtualWallet && availableStrategyQuantity > 0 && (
                              <p className="mt-1 text-xs md:text-sm text-gray-500">
                                Maximum disponible: {availableStrategyQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} {selectedStrategyToken?.symbol || ''}
                              </p>
                            )}
                    {!isStrategyVirtualWallet && parseFloat(strategyQuantity) > availableStrategyQuantity && (
                      <p className="mt-1 text-xs md:text-sm text-red-600">
                                Quantité supérieure à celle disponible ({availableStrategyQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })})
                      </p>
                    )}
                    {strategyQuantity && strategyStep === 3 && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          type="button"
                          onClick={handleStrategyPreviousStep}
                          variant="outline"
                          className="flex-1"
                        >
                          Précédent
                        </Button>
                        <Button
                          type="button"
                          onClick={handleStrategyNextStep}
                          className="flex-1"
                        >
                          Suivant
                        </Button>
                  </div>
                    )}
                  </div>
                )}
                
                        {/* Étape 4 : Nom de la stratégie */}
                {strategyStep >= 4 && strategyQuantity && (
                  <div className={strategyStep === 4 ? 'ring-2 ring-blue-200 rounded-lg p-2 -m-2' : ''}>
                          <Label htmlFor="strategyName" className="text-xs md:text-sm flex items-center gap-2">
                            4. Nom de la stratégie
                            {strategyStep > 4 && (
                              <span className="text-xs text-green-600 font-medium">✓ Complété</span>
                            )}
                          </Label>
                    <Input
                              id="strategyName"
                              type="text"
                              value={strategyName}
                              onChange={(e) => setStrategyName(e.target.value)}
                              placeholder="Nom de la stratégie"
                      className="text-sm md:text-base"
                    />
                    {strategyName && strategyStep === 4 && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          type="button"
                          onClick={handleStrategyPreviousStep}
                          variant="outline"
                          className="flex-1"
                        >
                          Précédent
                        </Button>
                        <Button
                          type="button"
                          onClick={handleStrategyNextStep}
                          className="flex-1"
                        >
                          Suivant
                        </Button>
                  </div>
                    )}
                </div>
                )}

                        {/* Étape 5 : Nombre de sorties */}
                {strategyStep >= 5 && strategyName && (
                  <div className={strategyStep === 5 ? 'ring-2 ring-blue-200 rounded-lg p-2 -m-2' : ''}>
                  <Label htmlFor="numberOfTargets" className="text-xs md:text-sm flex items-center gap-2">
                    5. Nombre de sorties
                    {strategyStep > 5 && (
                      <span className="text-xs text-green-600 font-medium">✓ Complété</span>
                    )}
                  </Label>
                  <Select
                    value={numberOfTargets > 0 ? numberOfTargets.toString() : ''}
                    onValueChange={(value) => {
                      if (value === '') {
                        setNumberOfTargets(0);
                        return;
                      }
                      const val = parseInt(value);
                      if (!isNaN(val) && val >= 1 && val <= 6) {
                        setNumberOfTargets(val);
                      }
                    }}
                  >
                            <SelectTrigger className="text-sm md:text-base">
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
                )}
                      </CardContent>
                    </Card>
                </div>

                  {/* Colonne droite : Zone B - Données d'investissement */}
                  <div className="space-y-4 md:space-y-6">
                    <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-4">Vos données d'investissement</h4>
                    
                    <Card className="border border-gray-200">
                      <CardContent className="p-4 md:p-6 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-gray-600">Nombre de saisies</span>
                          <span className="text-sm md:text-base font-semibold text-gray-900">
                            {investmentData?.numberOfTransactions || (strategyQuantity && strategyAveragePrice ? 1 : 0)}
                          </span>
                </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-gray-600">Total investi</span>
                          <span className="text-sm md:text-base font-semibold text-green-600">
                            {investmentData 
                              ? formatCurrency(investmentData.totalInvested, '$', 2)
                              : (strategyQuantity && strategyAveragePrice 
                                ? formatCurrency(parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice), '$', 2)
                                : '$0.00')}
                          </span>
              </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-gray-600">Tokens détenus</span>
                          <span className="text-sm md:text-base font-semibold text-orange-600">
                            {investmentData?.totalQuantity || (strategyQuantity ? parseFloat(strategyQuantity).toLocaleString(undefined, { maximumFractionDigits: 8 }) : '0')}
                          </span>
                </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-gray-600">Prix moyen d'achat</span>
                          <span className="text-sm md:text-base font-semibold text-purple-600">
                            {investmentData?.averagePrice 
                              ? formatCurrency(investmentData.averagePrice, '$', 2)
                              : (strategyAveragePrice 
                                ? formatCurrency(parseFloat(strategyAveragePrice), '$', 2)
                                : '$0.00')}
                          </span>
                        </div>
                        {investmentData?.currentPNL !== undefined && (
                          <>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                              <span className="text-xs md:text-sm text-gray-600">PNL actuel</span>
                              <span className={`text-sm md:text-base font-semibold ${investmentData.currentPNL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(investmentData.currentPNL, '$', 2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs md:text-sm text-gray-600">PNL %</span>
                              <span className={`text-sm md:text-base font-semibold ${(investmentData.currentPNLPercentage ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(investmentData.currentPNLPercentage ?? 0) >= 0 ? '+' : ''}{(investmentData.currentPNLPercentage ?? 0).toFixed(2)}%
                              </span>
                            </div>
                          </>
                        )}
                        {selectedStrategyToken?.quote?.USD?.price && (
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-xs md:text-sm text-gray-600">Prix actuel</span>
                            <span className="text-sm md:text-base font-semibold text-gray-900">
                              {formatCurrency(selectedStrategyToken.quote.USD.price, '$', 2)}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* En-têtes des colonnes pour les paliers - affichés seulement si des sorties sont définies */}
                {numberOfTargets > 0 && profitTargets.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-6 mt-6">
                  <div>
                        <h4 className="text-sm md:text-base font-semibold text-gray-900">Configuration des paliers</h4>
                  </div>
                  <div>
                        <h4 className="text-sm md:text-base font-semibold text-gray-900">Projections</h4>
                  </div>
                </div>

                {/* Cartes alignées par paire : Cible #1 avec Cible #1, etc. */}
                <div className="space-y-4 md:space-y-6">
                      {profitTargets.slice(0, numberOfTargets).map((target, index) => {
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
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </div>
                              <h3 className="text-sm md:text-base font-semibold text-blue-600">Cible de sortie</h3>
                            </div>
                            {/* Toggle Switch */}
                            <div className="relative inline-flex items-center">
                              <button
                                type="button"
                                onClick={() => handleTargetChange(index, 'targetType', target.targetType === 'percentage' ? 'price' : 'percentage')}
                                className={`
                                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                  ${target.targetType === 'price' ? 'bg-blue-600' : 'bg-gray-300'}
                                `}
                              >
                                <span
                                  className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                    ${target.targetType === 'price' ? 'translate-x-6' : 'translate-x-1'}
                                  `}
                                />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              <Label htmlFor={`targetValue-${index}`} className="text-xs md:text-sm">
                                {target.targetType === 'percentage' ? 'Pourcentage (%)' : 'Prix (USD)'}
                              </Label>
                              {target.targetType === 'percentage' ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newValue = Math.max(0, target.targetValue - 10);
                                      handleTargetChange(index, 'targetValue', newValue);
                                    }}
                                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                  >
                                    <span className="text-lg font-semibold text-gray-600">−</span>
                                  </button>
                                  <Input
                                    id={`targetValue-${index}`}
                                    type="number"
                                    value={target.targetValue}
                                    onChange={(e) => 
                                      handleTargetChange(index, 'targetValue', parseFloat(e.target.value) || 0)
                                    }
                                    step="0.01"
                                    className="text-sm md:text-base flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newValue = target.targetValue + 10;
                                      handleTargetChange(index, 'targetValue', newValue);
                                    }}
                                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                  >
                                    <span className="text-lg font-semibold text-gray-600">+</span>
                                  </button>
                                </div>
                              ) : (
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
                              )}
                              {target.targetType === 'percentage' && !isNaN(avgPrice) && avgPrice > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-1">Pourcentage du prix moyen d'achat</p>
                                  <div className="flex items-center gap-3">
                                    <p className="text-sm md:text-base font-semibold text-purple-600 underline">
                                      {target.targetValue > 0 ? `${100 + target.targetValue}%` : '100%'}
                                    </p>
                                    <p className="text-sm md:text-base font-semibold text-purple-600">
                                      {formatCurrency(targetPrice, '$', 6)}
                                    </p>
                            </div>
                          </div>
                              )}
                              {target.targetType === 'price' && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500">Valeur exacte du token</p>
                                </div>
                              )}
                              {info && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs md:text-sm text-gray-600 font-medium">Nombre de tokens restants:</span>
                                    <span className="text-sm md:text-base font-bold text-orange-600">
                                      {info.remainingTokens.toFixed(8)}
                              </span>
                            </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quantité à vendre - Pourcentage et Tokens */}
                            <div className="flex-grow flex flex-col justify-end">
                            <Label htmlFor={`sellPercentage-${index}`} className="text-xs md:text-sm mb-2">
                              Quantité à vendre
                              </Label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
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
                              <div className="w-full sm:w-32 flex items-center gap-2">
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
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                              <div className="w-full sm:w-40 flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.00000001"
                                  value={(() => {
                                    // Calculer le nombre de tokens équivalent basé sur le total initial
                                    const qty = parseFloat(strategyQuantity);
                                    if (isNaN(qty) || qty <= 0 || target.sellPercentage <= 0) return '';
                                    // Calculer le nombre de tokens équivalent au pourcentage sur le total initial
                                    const tokensEquivalent = (qty * target.sellPercentage) / 100;
                                    return tokensEquivalent > 0 ? tokensEquivalent.toFixed(8) : '0.00000000';
                                  })()}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value) && value >= 0) {
                                      handleTokensChange(index, value);
                                    } else if (e.target.value === '') {
                                      // Si l'input est vide, mettre le pourcentage à 0
                                      handleTargetChange(index, 'sellPercentage', 0);
                                    }
                                  }}
                                  placeholder="0.00000000"
                                  className="text-xs md:text-sm"
                                />
                                <span className="text-xs text-gray-500">tokens</span>
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
                                <span className="font-medium text-green-600 text-right">
                                  {info ? formatCurrency(info.remainingTokensValuation, '$', 2) : '$0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600">Montant encaissé:</span>
                                <span className="font-medium text-green-600 text-right">
                                  {info ? formatCurrency(info.amountCollected, '$', 2) : '$0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600">Valeur du bag restant:</span>
                                <span className="font-medium text-green-600 text-right">
                                  {info ? formatCurrency(info.remainingBagValue, '$', 2) : '$0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-t border-gray-200 pt-3 mt-2">
                                <span className="text-gray-600 font-medium">Nombre de tokens restants:</span>
                                <span className="font-bold text-orange-600 text-lg text-right">
                                  {info ? info.remainingTokens.toFixed(8) : '0.00000000'}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
                  </>
                )}
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
                        <p className="text-xs md:text-sm mt-1 text-gray-600">
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

      case 2: // Prévisions (anciennement Configuration)
        const previsionGlobalSummary = calculatePrevisionGlobalSummary();
        
        // Si une prévision a été sauvegardée, afficher le récapitulatif
        if (savedPrevision) {
        return (
            <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
              <div className="rounded-xl p-4 md:p-6 bg-white border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {savedPrevision.name}
                  </span>
                </div>
                <p className="text-xs md:text-sm mb-4 text-gray-600">
                  Créé le {new Date(savedPrevision.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} - {savedPrevision.tokenCount} actifs configurés
                </p>

                {/* Métriques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs md:text-sm mb-1 text-gray-600">
                      Total investi
                    </div>
                    <div className="text-base md:text-lg font-bold text-gray-900">
                      {formatCurrency(savedPrevision.totalInvested)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm mb-1 text-gray-600">
                      Total encaissé
                    </div>
                    <div className="text-base md:text-lg font-bold text-green-600">
                      {formatCurrency(savedPrevision.totalCollected)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm mb-1 text-gray-600">
                      Profit net
                    </div>
                    <div className="text-base md:text-lg font-bold text-green-600">
                      {formatCurrency(savedPrevision.totalProfit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm mb-1 text-gray-600">
                      Rendement net
                    </div>
                    <div className="text-base md:text-lg font-bold text-green-600">
                      {formatPercentage(savedPrevision.returnPercentage)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
            {/* Error Message */}
            {error && (
              <div className="mb-3 md:mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs md:text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Zone A - Configuration de la prévision */}
            <div className="rounded-xl p-4 md:p-6 bg-white border border-gray-200">
              <h2 className="text-lg md:text-xl font-bold mb-2 text-gray-900">
                Stratégie globale de portfolio
              </h2>
              <p className="text-xs md:text-sm mb-4 md:mb-6 text-gray-600">
                Choisissez un portfolio et renseignez un nom pour votre nouvelle stratégie globale.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Label className="text-xs md:text-sm mb-2 text-gray-700">
                    Portfolio *
                  </Label>
                  <Select value={previsionPortfolioId} onValueChange={setPrevisionPortfolioId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.filter(p => p.id !== 'virtual').map(portfolio => (
                        <SelectItem key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

                <div>
                  <Label className="text-xs md:text-sm mb-2 text-gray-700">
                    Nom de la prévision de mon Wallet *
                  </Label>
                  <Input
                    type="text"
                    placeholder="Ex: Stratégie Bullrun 2025"
                    value={previsionName}
                    onChange={(e) => setPrevisionName(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Zone A - Tableau de configuration */}
            {previsionPortfolioId && previsionHoldings.length > 0 && (
              <div className="rounded-xl p-4 md:p-6 bg-white border border-gray-200">
                <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-900">
                  Configuration
                </h3>
                <p className="text-xs md:text-sm mb-4 md:mb-6 text-gray-600">
                  Pour chaque token de votre portfolio, choisissez une stratégie de prise de profit.
                </p>

                {/* Tableau Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Token</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Quantité
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Investi
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Stratégie
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Détails
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previsionHoldings.map(holding => {
                        const compatibleStrategies = getPrevisionCompatibleStrategies(holding.token.symbol);
                        const selectedStrategyId = previsionAppliedStrategies[holding.id] || 'none';
                        const isExpanded = previsionExpandedTokens.has(holding.id);
                        const result = calculatePrevisionTokenResult(holding);

                        return (
                          <React.Fragment key={holding.id}>
                            <tr className="border-b border-gray-200">
                              <td className="py-4 px-4 text-sm font-medium text-gray-900">
                                {holding.token.symbol}
                              </td>
                              <td className="text-right py-4 px-4 text-sm text-gray-900">
                                {holding.quantity.toLocaleString()}
                              </td>
                              <td className="text-right py-4 px-4 text-sm text-gray-900">
                                {formatCurrency(holding.investedAmount)}
                              </td>
                              <td className="py-4 px-4">
                                <Select
                                  value={selectedStrategyId}
                                  onValueChange={(value) => handlePrevisionStrategyChange(holding.id, value)}
                                >
                                  <SelectTrigger className="w-40 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      Sans TP (défaut)
                                    </SelectItem>
                                    {compatibleStrategies.length === 0 ? (
                                      <div className="px-3 py-2 text-xs text-gray-500">
                                        Aucune stratégie disponible. Créez-en une dans le module Stratégies.
                                      </div>
                                    ) : (
                                      compatibleStrategies.map(strategy => (
                                        <SelectItem key={strategy.id} value={strategy.id}>
                                          {strategy.name}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-4 px-4">
                                {selectedStrategyId !== 'none' && result ? (
                                  <button
                                    onClick={() => togglePrevisionTokenExpansion(holding.id)}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                  >
                                    {isExpanded ? (
                                      <>
                                        Masquer
                                        <ChevronUpIcon className="w-4 h-4" />
                                      </>
                                    ) : (
                                      <>
                                        Afficher
                                        <ChevronDownIcon className="w-4 h-4" />
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-sm text-gray-500">
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>
                            {/* Détails des prises de profit */}
                            {isExpanded && result && (
                              <tr>
                                <td colSpan={5} className="py-4 px-4">
                                  <div className="rounded-lg p-4 bg-gray-50">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-900">
                                      Prises de profits pour stratégie {previsionTheoreticalStrategies.find(s => s.id === selectedStrategyId)?.name} sur {holding.token.symbol}
                                    </h4>
                                    <div className="space-y-2">
                                      {result.profitTargetsDetails.map((detail: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            readOnly
                                            className="w-4 h-4"
                                          />
                                          <span className="text-sm text-gray-700">
                                            TP {detail.order}: {holding.token.symbol} = {formatCurrency(detail.targetPrice)} Vendre {((detail.tokensSold / holding.quantity) * 100).toFixed(1)}%
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Version Mobile */}
                <div className="md:hidden space-y-4">
                  {previsionHoldings.map(holding => {
                    const compatibleStrategies = getPrevisionCompatibleStrategies(holding.token.symbol);
                    const selectedStrategyId = previsionAppliedStrategies[holding.id] || 'none';
                    const isExpanded = previsionExpandedTokens.has(holding.id);
                    const result = calculatePrevisionTokenResult(holding);

                    return (
                      <div key={holding.id} className="rounded-lg border p-4 bg-gray-50 border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-semibold text-gray-900">
                            {holding.token.symbol}
              </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-xs text-gray-600">
                              Quantité
                            </span>
                            <p className="font-medium text-gray-900">
                              {holding.quantity.toLocaleString()}
              </p>
            </div>
                          <div>
                            <span className="text-xs text-gray-600">
                              Investi
                            </span>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(holding.investedAmount)}
                            </p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <Label className="text-xs mb-2 block text-gray-700">
                            Stratégie
                          </Label>
                          <Select
                            value={selectedStrategyId}
                            onValueChange={(value) => handlePrevisionStrategyChange(holding.id, value)}
                          >
                            <SelectTrigger className="w-full text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                Sans TP (défaut)
                              </SelectItem>
                              {compatibleStrategies.map(strategy => (
                                <SelectItem key={strategy.id} value={strategy.id}>
                                  {strategy.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedStrategyId !== 'none' && result && (
                          <>
                            <button
                              onClick={() => togglePrevisionTokenExpansion(holding.id)}
                              className="w-full flex items-center justify-between text-sm text-blue-600 hover:text-blue-700 mb-2"
                            >
                              <span>Détails</span>
                              {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                            </button>
                            {isExpanded && (
                              <div className="rounded-lg p-3 mt-2 bg-white">
                                <h4 className="text-sm font-semibold mb-2 text-gray-900">
                                  Prises de profits pour stratégie {previsionTheoreticalStrategies.find(s => s.id === selectedStrategyId)?.name}
                                </h4>
                                <div className="space-y-2">
                                  {result.profitTargetsDetails.map((detail: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <input type="checkbox" checked={true} readOnly className="w-4 h-4" />
                                      <span className="text-xs text-gray-700">
                                        TP {detail.order}: {formatCurrency(detail.targetPrice)} Vendre {((detail.tokensSold / holding.quantity) * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Zone B - Résultats par token */}
            {previsionPortfolioId && previsionHoldings.length > 0 && (
              <div className="rounded-xl p-4 md:p-6 bg-white border border-gray-200">
                <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900">
                  Résultats par token
                </h3>
                
                {/* Tableau Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Token</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Montant encaissé
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Rendement net
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Token restants
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previsionHoldings.map(holding => {
                        const result = calculatePrevisionTokenResult(holding);
                        if (!result) return null;

                        return (
                          <tr key={holding.id} className="border-b border-gray-200">
                            <td className="py-4 px-4 text-sm font-medium text-gray-900">
                              {holding.token.symbol}
                            </td>
                            <td className="text-right py-4 px-4 text-sm font-medium text-green-600">
                              {formatCurrency(result.amountCollected)}
                            </td>
                            <td className={`text-right py-4 px-4 text-sm font-medium ${result.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(result.returnPercentage)}
                            </td>
                            <td className="text-right py-4 px-4 text-sm text-gray-900">
                              {result.remainingTokens.toFixed(8)} ({formatCurrency(result.remainingTokensValue)})
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Version Mobile */}
                <div className="md:hidden space-y-4">
                  {previsionHoldings.map(holding => {
                    const result = calculatePrevisionTokenResult(holding);
                    if (!result) return null;

                    return (
                      <div key={holding.id} className="rounded-lg border p-4 bg-gray-50 border-gray-200">
                        <h3 className="text-base font-semibold mb-3 text-gray-900">
                          {holding.token.symbol}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-xs text-gray-600">
                              Montant encaissé
                            </span>
                            <p className="font-medium text-green-600">
                              {formatCurrency(result.amountCollected)}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-600">
                              Rendement net
                            </span>
                            <p className={`font-medium ${result.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(result.returnPercentage)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs text-gray-600">
                              Token restants
                            </span>
                            <p className="font-medium text-gray-900">
                              {result.remainingTokens.toFixed(8)} ({formatCurrency(result.remainingTokensValue)})
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Zone C - Résumé global */}
            {previsionPortfolioId && previsionHoldings.length > 0 && Object.keys(previsionAppliedStrategies).some(id => previsionAppliedStrategies[id] !== 'none') && (
              <div className="rounded-xl p-4 md:p-6 bg-white border border-gray-200">
                <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900">
                  Résumé global du wallet
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                  <div>
                    <div className="text-xs md:text-sm mb-1 text-gray-600">
                      Total investi
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-gray-900">
                      {formatCurrency(previsionGlobalSummary.totalInvested)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm mb-1 text-gray-600">
                      Total encaissé
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-green-600">
                      {formatCurrency(previsionGlobalSummary.totalCollected)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm mb-1 text-gray-600">
                      Profit net
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-green-600">
                      {formatCurrency(previsionGlobalSummary.totalProfit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm mb-1 text-gray-600">
                      Rendement net
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-green-600">
                      {formatPercentage(previsionGlobalSummary.returnPercentage)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs md:text-sm mb-1 text-gray-600">
                      Valeur tokens restants
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-gray-900">
                      {formatCurrency(previsionGlobalSummary.remainingTokensValue)}
                    </div>
                  </div>
                </div>

                {/* Bouton Sauvegarder */}
                <div className="mt-6 flex justify-end">
              <Button
                    onClick={handleSavePrevision}
                    disabled={!previsionName.trim() || !previsionPortfolioId}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                    Sauvegarder la prévision
              </Button>
            </div>
              </div>
            )}

            {/* Message si aucun holding */}
            {previsionPortfolioId && previsionHoldings.length === 0 && !previsionLoading && (
              <div className="rounded-xl p-8 text-center bg-white border border-gray-200">
                <p className="text-sm md:text-base text-gray-600">
                  Aucun holding disponible. Ajoutez des transactions d'abord.
                </p>
              </div>
            )}

            {/* Loading state */}
            {previsionLoading && (
              <div className="rounded-xl p-8 text-center bg-white border border-gray-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm md:text-base text-gray-600">
                  Chargement...
                </p>
              </div>
            )}
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
      <div className={`${currentStep === 1 || currentStep === 2 || (currentStep === 0 && investmentSubStep === 'add-crypto' && addCryptoMethod === 'manual') ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-3 md:px-4 sm:px-6 lg:px-8 py-4 md:py-8 overflow-x-hidden`}>
        <div className={`${currentStep === 1 || currentStep === 2 || (currentStep === 0 && investmentSubStep === 'add-crypto' && addCryptoMethod === 'manual') ? 'max-w-full' : 'max-w-2xl'} mx-auto w-full`}>
          {/* Step Header */}
          <div className="text-center mb-4 md:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center mb-3 md:mb-4 gap-3 sm:gap-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <currentStepData.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="sm:ml-4 text-center sm:text-left">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {currentStep === 0 && investmentSubStep === 'portfolio' && 'Création de portfolio'}
                  {currentStep === 0 && investmentSubStep === 'add-crypto' && !addCryptoMethod && 'Ajouter de la crypto'}
                  {currentStep === 0 && investmentSubStep === 'add-crypto' && addCryptoMethod === 'manual' && 'Mes investissements'}
                  {currentStep === 0 && investmentSubStep === 'add-crypto' && addCryptoMethod === 'exchange' && 'Link Exchange'}
                  {currentStep === 0 && investmentSubStep === 'add-crypto' && addCryptoMethod === 'wallet' && 'Crypto Wallet'}
                  {currentStep === 1 && 'Créez votre première stratégie'}
                  {currentStep === 2 && 'Créez vos prévisions'}
                </h1>
                <div className="flex items-center justify-center sm:justify-start text-xs md:text-sm text-gray-500 mt-1">
                  <ShieldCheckIcon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  <span>1 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <Card className="mb-4 md:mb-8 bg-white border-gray-200">
            <CardContent className={`${currentStep === 2 ? 'p-4 md:p-6 lg:p-10' : 'p-4 md:p-6 lg:p-8'} w-full max-w-full overflow-x-hidden`}>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <Button
              onClick={handlePrevious}
              variant="outline"
              disabled={currentStep === 0 && investmentSubStep === 'portfolio'}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 md:py-3 text-sm md:text-base"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Précédent</span>
            </Button>

            {/* Masquer le bouton "Suivant" sur la page "Ajouter de la crypto" et "Créer la stratégie" */}
            {/* Masquer le bouton "Terminer" dans la première partie de "Créer votre prévision" (avant sauvegarde) */}
            {!(currentStep === 0 && investmentSubStep === 'add-crypto' && !addCryptoMethod) && 
             !(currentStep === 1) &&
             !(currentStep === 2 && !savedPrevision) && (
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <span>{isLoading ? 'Création...' : (currentStep === steps.length - 1 ? 'Terminer' : 'Suivant')}</span>
              {!isLoading && <ArrowRightIcon className="w-4 h-4" />}
            </Button>
            )}
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
