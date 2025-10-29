import {
  ShieldCheckIcon,
  PlusIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { BinanceIcon, CoinbaseIcon, KrakenIcon, LedgerIcon, MetamaskIcon, PhantomIcon } from './components/ExchangeIcons';

export const ONBOARDING_STEPS = [
  { id: 'portfolio', name: 'Portfolio', icon: ShieldCheckIcon },
  { id: 'exchange', name: 'Exchange', icon: PlusIcon },
  { id: 'strategy', name: 'Stratégie', icon: ChartBarIcon },
  { id: 'configuration', name: 'Configuration', icon: Cog6ToothIcon },
] as const;

export const EXCHANGES = [
  { id: 'binance', name: 'Binance', icon: BinanceIcon, available: false },
  { id: 'coinbase', name: 'Coinbase', icon: CoinbaseIcon, available: false },
  { id: 'kraken', name: 'Kraken', icon: KrakenIcon, available: false },
  { id: 'ledger', name: 'Ledger', icon: LedgerIcon, available: false },
  { id: 'metamask', name: 'Metamask', icon: MetamaskIcon, available: false },
  { id: 'phantom', name: 'Phantom', icon: PhantomIcon, available: false },
] as const;

