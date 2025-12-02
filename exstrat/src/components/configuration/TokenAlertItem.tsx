'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import * as configurationApi from '@/lib/configuration-api';
import { Holding } from '@/types/portfolio';
import { TheoreticalStrategyResponse } from '@/types/strategies';
import { TokenAlert, AlertConfiguration, CreateTPAlertDto, UpdateTPAlertDto } from '@/types/configuration';
import { formatCurrency } from '@/lib/format';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { TPAlertsConfig } from './TPAlertsConfig';

interface TokenAlertItemProps {
  holding: Holding;
  strategy: TheoreticalStrategyResponse | null;
  tokenAlert: TokenAlert | undefined;
  alertConfigurationId: string | undefined;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCreateAlert: () => void;
  onConfigurationUpdate: (config: AlertConfiguration) => void;
}

export const TokenAlertItem: React.FC<TokenAlertItemProps> = ({
  holding,
  strategy,
  tokenAlert,
  alertConfigurationId,
  isExpanded,
  onToggleExpand,
  onCreateAlert,
  onConfigurationUpdate,
}) => {
  const { isDarkMode, language } = useTheme();
  const [saving, setSaving] = useState(false);

  if (!strategy) {
    return null;
  }

  const numberOfTargets = strategy.profitTargets.length;

  return (
    <div className={`rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
      {/* En-tête du token */}
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={onToggleExpand}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {holding.token.symbol} - {holding.token.name}
            </h3>
            {tokenAlert && (
              <span className={`px-2 py-1 text-xs rounded ${
                tokenAlert.isActive
                  ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                  : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}>
                {tokenAlert.isActive
                  ? (language === 'fr' ? 'Actif' : 'Active')
                  : (language === 'fr' ? 'Inactif' : 'Inactive')}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {language === 'fr' ? 'Stratégie:' : 'Strategy:'} {strategy.name}
            </span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {language === 'fr' ? 'Nombre de TP:' : 'Number of TP:'} {numberOfTargets}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUpIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <ChevronDownIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </div>
      </div>

      {/* Contenu déplié - Configuration des TP */}
      {isExpanded && (
        <div className="border-t border-gray-300 dark:border-gray-600 p-4">
          {tokenAlert && alertConfigurationId ? (
            <TPAlertsConfig
              tokenAlert={tokenAlert}
              alertConfigurationId={alertConfigurationId}
              onConfigurationUpdate={onConfigurationUpdate}
            />
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  {language === 'fr'
                    ? '💡 Configurez les alertes pour ce token en cliquant sur le bouton "Configurer alertes". Les alertes seront créées avec les valeurs par défaut (-10% avant le TP, alerte à l\'atteinte du TP).'
                    : '💡 Configure alerts for this token by clicking the "Configure alerts" button. Alerts will be created with default values (-10% before TP, alert when TP is reached).'}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateAlert();
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {language === 'fr' ? 'Configurer alertes' : 'Configure alerts'}
                </button>
              </div>
              
              {/* Aperçu des TP qui seront créés */}
              <div>
                <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fr' ? 'Aperçu des TP à configurer' : 'TP Preview to Configure'}
                </h4>
                <div className="space-y-3">
                  {strategy.profitTargets.map((tp) => {
                    const targetPrice = tp.targetType === 'percentage'
                      ? holding.averagePrice * (1 + tp.targetValue / 100)
                      : tp.targetValue;
                    const sellQuantity = (holding.quantity * tp.sellPercentage) / 100;
                    const projectedAmount = targetPrice * sellQuantity;
                    const remainingValue = (holding.quantity - sellQuantity) * targetPrice;

                    return (
                      <div
                        key={tp.order}
                        className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            TP {tp.order}
                          </h5>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {language === 'fr' ? 'Seuil de prix:' : 'Target price:'}
                            </span>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(targetPrice)}
                            </p>
                          </div>
                          <div>
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {language === 'fr' ? 'Quantité à vendre:' : 'Sell quantity:'}
                            </span>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {sellQuantity.toFixed(4)}
                            </p>
                          </div>
                          <div>
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {language === 'fr' ? 'Montant encaissé:' : 'Projected amount:'}
                            </span>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(projectedAmount)}
                            </p>
                          </div>
                          <div>
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {language === 'fr' ? 'Valeur restante:' : 'Remaining value:'}
                            </span>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(remainingValue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

