/**
 * Utilitaires de formatage pour les données crypto
 */

/**
 * Formate un prix de manière sécurisée
 * @param price - Le prix à formater (peut être null ou undefined)
 * @param fallback - Valeur de fallback si le prix est null/undefined
 * @returns Prix formaté ou valeur de fallback
 */
export const formatPrice = (price: number | null | undefined, fallback: string = 'N/A'): string => {
  if (price === null || price === undefined || isNaN(price)) {
    return fallback;
  }
  return price.toLocaleString();
};

/**
 * Formate un pourcentage de manière sécurisée
 * @param percentage - Le pourcentage à formater (peut être null ou undefined)
 * @param decimals - Nombre de décimales (défaut: 2)
 * @returns Pourcentage formaté ou '0.00%'
 */
export const formatPercentage = (percentage: number | null | undefined, decimals: number = 2): string => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0.00%';
  }
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(decimals)}%`;
};

/**
 * Formate une quantité de manière sécurisée
 * @param quantity - La quantité à formater (peut être null ou undefined)
 * @param decimals - Nombre de décimales (défaut: 8)
 * @returns Quantité formatée ou '0.00000000'
 */
export const formatQuantity = (quantity: number | null | undefined, decimals: number = 8): string => {
  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return '0.00000000';
  }
  return quantity.toFixed(decimals);
};

/**
 * Formate un montant en USD de manière sécurisée
 * @param amount - Le montant à formater (peut être null ou undefined)
 * @param prefix - Préfixe à ajouter (défaut: '$')
 * @returns Montant formaté avec préfixe
 */
export const formatUSD = (amount: number | null | undefined, prefix: string = '$'): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${prefix}0.00`;
  }
  return `${prefix}${amount.toLocaleString()}`;
};
