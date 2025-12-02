'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import * as configurationApi from '@/lib/configuration-api';
import { AlertConfiguration, NotificationChannels } from '@/types/configuration';

interface NotificationChannelsConfigProps {
  alertConfiguration: AlertConfiguration;
  onConfigurationUpdate: (config: AlertConfiguration) => void;
}

export const NotificationChannelsConfig: React.FC<NotificationChannelsConfigProps> = ({
  alertConfiguration,
  onConfigurationUpdate,
}) => {
  const { isDarkMode, language } = useTheme();
  const [saving, setSaving] = useState(false);

  const handleUpdateChannels = async (channels: NotificationChannels) => {
    try {
      setSaving(true);
      const updated = await configurationApi.updateAlertConfiguration(alertConfiguration.id, {
        notificationChannels: channels,
      });
      onConfigurationUpdate(updated);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des canaux:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
        <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? 'Choisir les canaux de notification' : 'Choose notification channels'}
        </h3>

        <div className="space-y-3">
          {/* Email */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={alertConfiguration.notificationChannels.email}
              onChange={(e) =>
                handleUpdateChannels({
                  ...alertConfiguration.notificationChannels,
                  email: e.target.checked,
                })
              }
              disabled={saving}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex-1">
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                📧 {language === 'fr' ? 'Email' : 'Email'}
              </span>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fr'
                  ? 'Recevez les alertes par email'
                  : 'Receive alerts by email'}
              </p>
            </div>
          </label>

          {/* Push */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={alertConfiguration.notificationChannels.push}
              onChange={(e) =>
                handleUpdateChannels({
                  ...alertConfiguration.notificationChannels,
                  push: e.target.checked,
                })
              }
              disabled={saving}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex-1">
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                📱 {language === 'fr' ? 'Notifications push' : 'Push notifications'}
              </span>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fr'
                  ? 'Recevez les alertes sur votre appareil mobile (nécessite l\'application)'
                  : 'Receive alerts on your mobile device (requires the app)'}
              </p>
              {alertConfiguration.notificationChannels.push && (
                <div className={`mt-2 p-2 rounded text-xs ${
                  isDarkMode ? 'bg-blue-900/20 border border-blue-700/30 text-blue-400' : 'bg-blue-50 border border-blue-200 text-blue-700'
                }`}>
                  {language === 'fr'
                    ? '💡 Téléchargez l\'application mobile exStrat pour activer les notifications push'
                    : '💡 Download the exStrat mobile app to enable push notifications'}
                </div>
              )}
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

