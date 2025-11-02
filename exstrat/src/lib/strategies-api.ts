import api from './api';
import {
  CreateStrategyDto,
  UpdateStrategyDto,
  UpdateStrategyStepDto,
  StrategyResponse,
  StrategySearchResponse,
  StrategySummary,
  StrategySearchDto,
} from '@/types/strategies';

const BASE_URL = '/strategies';

export const strategiesApi = {
  // Créer une nouvelle stratégie
  async createStrategy(data: CreateStrategyDto): Promise<StrategyResponse> {
    console.log('Tentative de création de stratégie avec les données:', data);
    console.log('URL de création:', BASE_URL);
    
    try {
      const response = await api.post<StrategyResponse>(BASE_URL, data);
      console.log('Création réussie:', response);
      return response.data;
    } catch (error: unknown) {
      console.error('Erreur lors de la création:', error);
      const axiosError = error as { response?: { data?: unknown } };
      console.error('Détails de l\'erreur:', axiosError.response?.data);
      throw error;
    }
  },

  // Récupérer toutes les stratégies avec filtres
  async getStrategies(searchDto: StrategySearchDto = {}): Promise<StrategySearchResponse> {
    const response = await api.get<StrategySearchResponse>(BASE_URL, {
      params: searchDto,
    });
    return response.data;
  },

  // Récupérer les stratégies pour un token spécifique
  async getStrategiesByToken(symbol: string): Promise<StrategyResponse[]> {
    const response = await api.get<StrategyResponse[]>(`${BASE_URL}/token/${symbol}`);
    return response.data;
  },

  // Récupérer une stratégie par ID
  async getStrategyById(id: string): Promise<StrategyResponse> {
    const response = await api.get<StrategyResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Récupérer le résumé d'une stratégie
  async getStrategySummary(id: string): Promise<StrategySummary> {
    const response = await api.get<StrategySummary>(`${BASE_URL}/${id}/summary`);
    return response.data;
  },

  // Mettre à jour une stratégie
  async updateStrategy(id: string, data: UpdateStrategyDto): Promise<StrategyResponse> {
    console.log('Tentative de mise à jour de stratégie avec ID:', id);
    console.log('Données de mise à jour:', data);
    console.log('URL de mise à jour:', `${BASE_URL}/${id}`);
    
    try {
      const response = await api.patch<StrategyResponse>(`${BASE_URL}/${id}`, data);
      console.log('Mise à jour réussie:', response);
      return response.data;
    } catch (error: unknown) {
      console.error('Erreur lors de la mise à jour:', error);
      const axiosError = error as { response?: { data?: unknown } };
      console.error('Détails de l\'erreur:', axiosError.response?.data);
      throw error;
    }
  },

  // Mettre à jour une étape de stratégie
  async updateStrategyStep(
    strategyId: string,
    stepId: string,
    data: UpdateStrategyStepDto
  ): Promise<StrategyResponse> {
    const response = await api.patch<StrategyResponse>(
      `${BASE_URL}/${strategyId}/steps/${stepId}`,
      data
    );
    return response.data;
  },

  // Supprimer une stratégie
  async deleteStrategy(id: string): Promise<void> {
    console.log('Tentative de suppression de la stratégie avec ID:', id);
    console.log('URL de suppression:', `${BASE_URL}/${id}`);
    
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      console.log('Suppression réussie:', response);
    } catch (error: unknown) {
      console.error('Erreur lors de la suppression:', error);
      const axiosError = error as { response?: { data?: unknown } };
      console.error('Détails de l\'erreur:', axiosError.response?.data);
      throw error;
    }
  },
};
