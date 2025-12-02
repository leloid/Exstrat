'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import * as configurationApi from '@/lib/configuration-api';
import { TokenAlert, AlertConfiguration, UpdateTPAlertDto } from '@/types/configuration';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface TPAlertsConfigProps {
  tokenAlert: TokenAlert;
  alertConfigurationId: string;
  onConfigurationUpdate: (config: AlertConfiguration) => void;
}

export const TPAlertsConfig: React.FC<TPAlertsConfigProps> = ({
  tokenAlert,
  alertConfigurationId,
  onConfigurationUpdate,
}) => {
  const { isDarkMode, language } = useTheme();
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleUpdateTPAlert = async (tpAlertId: string, updates: UpdateTPAlertDto) => {
    try {
      setSaving(prev => ({ ...prev, [tpAlertId]: true }));
      await configurationApi.updateTPAlert(tpAlertId, updates);
      
      // Recharger la configuration
      const updated = await configurationApi.getAlertConfigurationById(alertConfigurationId);
      onConfigurationUpdate(updated);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'alerte TP:', error);
    } finally {
      setSaving(prev => ({ ...prev, [tpAlertId]: false }));
    }
  };

  const handleToggleTokenAlert = async (isActive: boolean) => {
    try {
      setSaving(prev => ({ ...prev, token: true }));
      await configurationApi.updateTokenAlert(tokenAlert.id, { isActive });
      
      // Recharger la configuration
      const updated = await configurationApi.getAlertConfigurationById(alertConfigurationId);
      onConfigurationUpdate(updated);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'alerte token:', error);
    } finally {
      setSaving(prev => ({ ...prev, token: false }));
    }
  };

  // Trier les TP par ordre
  const sortedTPAlerts = [...tokenAlert.tpAlerts].sort((a, b) => a.tpOrder - b.tpOrder);

  return (
    <div className="space-y-4">
      {/* En-tête avec toggle global */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-300 dark:border-gray-600">
        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? 'Configuration des alertes par TP' : 'TP Alerts Configuration'}
        </h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={tokenAlert.isActive}
            onChange={(e) => handleToggleTokenAlert(e.target.checked)}
            disabled={saving.token}
            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {language === 'fr' ? 'Activer toutes les alertes' : 'Enable all alerts'}
          </span>
        </label>
      </div>

      {/* Liste des TP */}
      <div className="space-y-4">
        {sortedTPAlerts.map((tpAlert) => {
          const isSaving = saving[tpAlert.id];

          return (
            <div
              key={tpAlert.id}
              className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              {/* En-tête du TP */}
              <div className="flex items-center justify-between mb-3">
                <h5 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  TP {tpAlert.tpOrder}
                </h5>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tpAlert.isActive}
                    onChange={(e) =>
                      handleUpdateTPAlert(tpAlert.id, { isActive: e.target.checked })
                    }
                    disabled={isSaving}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' ? 'Actif' : 'Active'}
                  </span>
                </label>
              </div>

              {/* Données du TP */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {language === 'fr' ? 'Seuil de prix:' : 'Target price:'}
                  </span>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(tpAlert.targetPrice)}
                  </p>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {language === 'fr' ? 'Quantité à vendre:' : 'Sell quantity:'}
                  </span>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {tpAlert.sellQuantity.toFixed(4)}
                  </p>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {language === 'fr' ? 'Montant encaissé:' : 'Projected amount:'}
                  </span>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(tpAlert.projectedAmount)}
                  </p>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {language === 'fr' ? 'Valeur restante:' : 'Remaining value:'}
                  </span>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(tpAlert.remainingValue)}
                  </p>
                </div>
              </div>

              {/* Configuration des alertes */}
              <div className="space-y-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                {/* Alerte "Avant le TP" */}
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-700/30' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tpAlert.beforeTPEnabled}
                        onChange={(e) =>
                          handleUpdateTPAlert(tpAlert.id, {
                            beforeTP: {
                              enabled: e.target.checked,
                              value: tpAlert.beforeTPValue || -10,
                              type: (tpAlert.beforeTPType as 'percentage' | 'absolute') || 'percentage',
                            },
                          })
                        }
                        disabled={isSaving}
                        className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className={`font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                        {language === 'fr' ? 'Avant le TP' : 'Before TP'}
                      </span>
                    </label>
                  </div>
                  {tpAlert.beforeTPEnabled && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          const currentValue = tpAlert.beforeTPValue || -10;
                          const newValue = Math.max(-50, currentValue - 1);
                          handleUpdateTPAlert(tpAlert.id, {
                            beforeTP: {
                              enabled: true,
                              value: newValue,
                              type: (tpAlert.beforeTPType as 'percentage' | 'absolute') || 'percentage',
                            },
                          });
                        }}
                        disabled={isSaving}
                        className={`p-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={tpAlert.beforeTPValue || -10}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            handleUpdateTPAlert(tpAlert.id, {
                              beforeTP: {
                                enabled: true,
                                value: Math.max(-50, Math.min(0, value)),
                                type: (tpAlert.beforeTPType as 'percentage' | 'absolute') || 'percentage',
                              },
                            });
                          }
                        }}
                        disabled={isSaving}
                        className={`w-20 px-2 py-1 rounded border text-sm ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>%</span>
                      <button
                        onClick={() => {
                          const currentValue = tpAlert.beforeTPValue || -10;
                          const newValue = Math.min(0, currentValue + 1);
                          handleUpdateTPAlert(tpAlert.id, {
                            beforeTP: {
                              enabled: true,
                              value: newValue,
                              type: (tpAlert.beforeTPType as 'percentage' | 'absolute') || 'percentage',
                            },
                          });
                        }}
                        disabled={isSaving}
                        className={`p-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <span className={`text-xs ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fr' ? 'sous le seuil' : 'below threshold'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Alerte "TP Atteint" */}
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'}`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tpAlert.tpReachedEnabled}
                      onChange={(e) =>
                        handleUpdateTPAlert(tpAlert.id, {
                          tpReached: {
                            enabled: e.target.checked,
                          },
                        })
                      }
                      disabled={isSaving}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                      {language === 'fr' ? 'Atteinte du TP' : 'TP Reached'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

