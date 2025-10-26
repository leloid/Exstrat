'use client';

import React, { useState } from 'react';
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
  XMarkIcon
} from '@heroicons/react/24/outline';
import { createPortfolio } from '@/lib/portfolios-api';
import { transactionsApi } from '@/lib/transactions-api';
import { strategiesApi } from '@/lib/strategies-api';
import { CreatePortfolioDto } from '@/types/portfolio';
import { CreateTransactionDto, TokenSearchResult } from '@/types/transactions';
import { CreateStrategyDto, TargetType } from '@/types/strategies';
import { TokenSearch } from '@/components/transactions/TokenSearch';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import * as portfoliosApi from '@/lib/portfolios-api';

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
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdData, setCreatedData] = useState({
    portfolio: null as any,
    transaction: null as any,
    strategy: null as any,
  });
  const { portfolios, currentPortfolio } = usePortfolio();
  
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
  const [strategyQuantity, setStrategyQuantity] = useState<string>('');
  const [strategyAveragePrice, setStrategyAveragePrice] = useState<string>('');
  const [numberOfTargets, setNumberOfTargets] = useState<number>(3);
  const [profitTargets, setProfitTargets] = useState<ProfitTarget[]>([]);
  
  const router = useRouter();

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
    setProfitTargets(newTargets);
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
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
      const portfolioDto: CreatePortfolioDto = {
        name: portfolioData.name,
        description: portfolioData.description || undefined,
        isDefault: portfolioData.isDefault,
      };

      const createdPortfolio = await createPortfolio(portfolioDto);
      setCreatedData(prev => ({ ...prev, portfolio: createdPortfolio }));
      
      console.log('✅ Portfolio créé:', createdPortfolio);
      setCurrentStep(1);
    } catch (err: any) {
      console.error('❌ Erreur création portfolio:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransactionClick = () => {
    setShowTransactionForm(true);
  };

  const handleTokenSelect = (token: TokenSearchResult | null) => {
    setSelectedToken(token);
    if (token) {
      // Auto-remplir le prix moyen avec le prix actuel
      setTransactionData(prev => ({
        ...prev,
        averagePrice: token.quote?.USD?.price?.toString() || '',
      }));
    }
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
    setTransactionData(prev => ({
      ...prev,
      quantity: value,
    }));

    // Auto-calculer le montant investi
    const averagePrice = parseFloat(transactionData.averagePrice);
    if (!isNaN(parseFloat(value)) && !isNaN(averagePrice)) {
      setTransactionData(prev => ({
        ...prev,
        amountInvested: (parseFloat(value) * averagePrice).toString(),
      }));
    }
  };

  const handleAveragePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTransactionData(prev => ({
      ...prev,
      averagePrice: value,
    }));

    // Auto-calculer le montant investi
    const quantity = parseFloat(transactionData.quantity);
    if (!isNaN(quantity) && !isNaN(parseFloat(value))) {
      setTransactionData(prev => ({
        ...prev,
        amountInvested: (quantity * parseFloat(value)).toString(),
      }));
    }
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
      const transactionDto: CreateTransactionDto = {
        symbol: selectedToken.symbol,
        name: selectedToken.name,
        cmcId: selectedToken.id,
        quantity: parseFloat(transactionData.quantity),
        amountInvested: parseFloat(transactionData.amountInvested),
        averagePrice: parseFloat(transactionData.averagePrice),
        type: transactionData.type,
        transactionDate: new Date(transactionData.transactionDate).toISOString(),
        notes: transactionData.notes || undefined,
        portfolioId: transactionData.portfolioId,
      };
      
      const createdTransaction = await transactionsApi.createTransaction(transactionDto);
      setCreatedData(prev => ({ ...prev, transaction: createdTransaction }));
      
      console.log('✅ Transaction créée:', createdTransaction);
      setCurrentStep(2);
    } catch (err: any) {
      console.error('❌ Erreur création transaction:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création de la transaction');
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
      const strategyData = {
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
        status: 'active',
      };
      
      console.log('📤 Données de la stratégie:', strategyData);
      
      const createdStrategy = await portfoliosApi.createTheoreticalStrategy(strategyData);
      setCreatedData(prev => ({ ...prev, strategy: createdStrategy }));
      
      console.log('✅ Stratégie créée:', createdStrategy);
      setCurrentStep(3);
    } catch (err: any) {
      console.error('❌ Erreur création stratégie:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création de la stratégie');
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
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nouveau Portfolio
              </h3>
              <p className="text-gray-600">
                Créez un nouveau portfolio pour organiser vos investissements
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Portfolio *
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Portfolio Principal"
                  value={portfolioData.name}
                  onChange={(e) => setPortfolioData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  placeholder="Décrivez votre portfolio..."
                  value={portfolioData.description}
                  onChange={(e) => setPortfolioData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={portfolioData.isDefault}
                  onChange={(e) => setPortfolioData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="mr-2" 
                />
                <span className="text-sm text-gray-700">Portfolio par défaut</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreatePortfolio}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isLoading ? 'Création...' : '✓ Créer'}
              </Button>
            </div>
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
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Recherchez votre exchange parmi +700 intégrations"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Exchange Grid */}
            <div className="grid grid-cols-3 gap-4">
              {filteredExchanges.map((exchange) => (
                <Card 
                  key={exchange.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    exchange.available 
                      ? 'hover:shadow-lg hover:border-blue-300' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <exchange.icon />
                    </div>
                    <h3 className="font-medium text-sm text-gray-900 mb-1">
                      {exchange.name}
                    </h3>
                    {!exchange.available && (
                      <p className="text-xs text-gray-500">Coming soon</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Transaction Form - Affiché seulement si showTransactionForm est true */}
            {showTransactionForm && (
              <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ajoutez votre première transaction
                  </h3>
                  <p className="text-gray-600">
                    Créez une transaction pour commencer à suivre vos investissements
                  </p>
                </div>

                <div className="space-y-4">
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
                      value={transactionData.portfolioId}
                      onValueChange={(value) => {
                        setTransactionData(prev => ({ ...prev, portfolioId: value }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un portefeuille" />
                      </SelectTrigger>
                      <SelectContent>
                        {portfolios.map((portfolio) => (
                          <SelectItem key={portfolio.id} value={portfolio.id}>
                            {portfolio.name} {portfolio.isDefault && '(Défaut)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {portfolios.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Aucun portefeuille disponible. Créez-en un d'abord.
                      </p>
                    )}
                  </div>

                  {/* Type de transaction */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de transaction *
                    </label>
                    <select
                      name="type"
                      value={transactionData.type}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="BUY">Achat</option>
                      <option value="SELL">Vente</option>
                      <option value="TRANSFER_IN">Transfert entrant</option>
                      <option value="TRANSFER_OUT">Transfert sortant</option>
                      <option value="STAKING">Staking</option>
                      <option value="REWARD">Récompense</option>
                    </select>
                  </div>

                  {/* Quantité et Prix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix moyen (USD) *
                      </label>
                      <Input
                        type="number"
                        name="averagePrice"
                        value={transactionData.averagePrice}
                        onChange={handleAveragePriceChange}
                        placeholder="0.00"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {/* Montant investi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant investi (USD) *
                    </label>
                    <Input
                      type="number"
                      name="amountInvested"
                      value={transactionData.amountInvested}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Calculé automatiquement: {transactionData.quantity && transactionData.averagePrice ? 
                        (parseFloat(transactionData.quantity) * parseFloat(transactionData.averagePrice)).toFixed(2) : '0.00'} USD
                    </p>
                  </div>

                  {/* Date de transaction */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de transaction *
                    </label>
                    <Input
                      type="date"
                      name="transactionDate"
                      value={transactionData.transactionDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optionnel)
                    </label>
                    <textarea
                      name="notes"
                      value={transactionData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ajoutez des notes sur cette transaction..."
                    />
                  </div>

                  {/* Boutons d'action pour le formulaire */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowTransactionForm(false)}
                      className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleCreateTransaction}
                      disabled={isLoading || !selectedToken}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {isLoading ? 'Création...' : '✓ Créer la transaction'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                <ShieldCheckIcon className="w-4 h-4 mr-2 text-gray-400" />
                <span>Connexion rapide et sécurisée à vos transactions</span>
              </div>
              <Button 
                onClick={handleAddTransactionClick}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg"
              >
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Créez votre première stratégie
              </h3>
              <p className="text-gray-600">
                Définissez des cibles de profit théoriques pour optimiser vos gains
              </p>
            </div>

            <div className="space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="strategyName">Nom de la stratégie *</Label>
                  <Input
                    id="strategyName"
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="Ex: Stratégie BTC Conservative"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="token">Token *</Label>
                  <TokenSearch
                    onTokenSelect={handleStrategyTokenSelect}
                    selectedToken={selectedStrategyToken}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantité *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={strategyQuantity}
                      onChange={(e) => setStrategyQuantity(e.target.value)}
                      placeholder="Ex: 1.5"
                      step="0.00000001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="averagePrice">Prix moyen (USD) *</Label>
                    <Input
                      id="averagePrice"
                      type="number"
                      value={strategyAveragePrice}
                      onChange={(e) => setStrategyAveragePrice(e.target.value)}
                      placeholder="Ex: 45000"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Configuration des cibles */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="numberOfTargets">Nombre de sorties (1-10)</Label>
                  <Input
                    id="numberOfTargets"
                    type="number"
                    min="1"
                    max="10"
                    value={numberOfTargets}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 10) {
                        setNumberOfTargets(val);
                      }
                    }}
                    className="w-24"
                  />
                </div>

                {profitTargets.map((target, index) => (
                  <div key={target.id} className="border p-4 rounded-lg space-y-3 bg-gray-50">
                    <h3 className="text-md font-semibold">Cible #{index + 1}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`targetType-${index}`}>Type</Label>
                        <Select
                          value={target.targetType}
                          onValueChange={(value: 'percentage' | 'price') => 
                            handleTargetChange(index, 'targetType', value)
                          }
                        >
                          <SelectTrigger id={`targetType-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">% de profit</SelectItem>
                            <SelectItem value="price">Prix exact</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`targetValue-${index}`}>
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
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`sellPercentage-${index}`}>
                        Quantité à vendre: {target.sellPercentage.toFixed(1)}%
                      </Label>
                      <Slider
                        id={`sellPercentage-${index}`}
                        min={0}
                        max={100}
                        step={1}
                        value={[target.sellPercentage]}
                        onValueChange={(value) => 
                          handleTargetChange(index, 'sellPercentage', value[0])
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                <ChartBarIcon className="w-4 h-4 mr-2 text-gray-400" />
                <span>Stratégie optimisée pour vos gains</span>
              </div>
              <Button
                onClick={handleCreateStrategy}
                disabled={isLoading || !selectedStrategyToken || !strategyQuantity || !strategyAveragePrice || !strategyName}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Création...' : 'Créer la stratégie'}
              </Button>
            </div>
          </div>
        );

      case 3: // Configuration
        return (
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success Messages */}
            {createdData.strategy && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">
                  ✅ Stratégie "{createdData.strategy.name}" créée avec succès !
                </p>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Configurez votre stratégie
              </h3>
              <p className="text-gray-600">
                Personnalisez les paramètres de votre stratégie
              </p>
            </div>

            <div className="text-center py-8">
              <Cog6ToothIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">
                Accédez à la page de configuration pour personnaliser vos paramètres
              </p>
              <Button
                onClick={handleConfigureStrategy}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <img 
                src="/Full_logo.svg" 
                alt="exStrat Logo" 
                className="h-8 w-auto"
              />
            </div>
            <button
              onClick={handleSkip}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
              <span>Passer</span>
            </button>
          </div>
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-2 ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRightIcon className="w-4 h-4 text-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <currentStepData.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 text-left">
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentStep === 0 && 'Nouveau Portfolio'}
                  {currentStep === 1 && 'Connectez votre exchange'}
                  {currentStep === 2 && 'Créez votre première stratégie'}
                  {currentStep === 3 && 'Configurez votre stratégie'}
                </h1>
                <div className="flex items-center text-sm text-gray-500">
                  <ShieldCheckIcon className="w-4 h-4 mr-1" />
                  <span>1 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              onClick={handlePrevious}
              variant="outline"
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Précédent</span>
            </Button>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleSkip}
                variant="outline"
                className="text-gray-600"
              >
                Quitter l'onboarding
              </Button>
            </div>
          </div>

          {/* Security Info */}
          <div className="mt-8 flex items-center justify-center text-sm text-gray-500">
            <ShieldCheckIcon className="w-4 h-4 mr-2" />
            <span>Connexion rapide et sécurisée à vos transactions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
