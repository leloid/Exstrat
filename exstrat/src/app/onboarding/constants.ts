import {
  ShieldCheckIcon,
  PlusIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import { BinanceIcon, CoinbaseIcon, KrakenIcon, LedgerIcon, MetamaskIcon, PhantomIcon } from './components/ExchangeIcons';

export const ONBOARDING_STEPS = [
  { id: 'investment', name: 'Investissement', icon: WalletIcon },
  { id: 'strategy', name: 'Stratégie', icon: ChartBarIcon },
  { id: 'configuration', name: 'Prévisions', icon: Cog6ToothIcon },
] as const;

// Sous-étapes pour l'investissement
export const INVESTMENT_SUB_STEPS = [
  { id: 'portfolio', name: 'Création de portfolio' },
  { id: 'add-crypto', name: 'Ajouter crypto' },
] as const;

export const EXCHANGES = [
  { id: 'binance', name: 'Binance', icon: BinanceIcon, available: false },
  { id: 'coinbase', name: 'Coinbase', icon: CoinbaseIcon, available: false },
  { id: 'kraken', name: 'Kraken', icon: KrakenIcon, available: false },
  { id: 'ledger', name: 'Ledger', icon: LedgerIcon, available: false },
  { id: 'metamask', name: 'Metamask', icon: MetamaskIcon, available: false },
  { id: 'phantom', name: 'Phantom', icon: PhantomIcon, available: false },
] as const;

