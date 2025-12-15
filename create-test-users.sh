#!/bin/bash

# Script pour créer 200 utilisateurs de test avec wallet, token BTC, stratégie, prévision et configuration
# Usage: ./create-test-users.sh [API_URL]

set -e

# Configuration
API_URL="${1:-http://exstrat-production.up.railway.app}"
NUM_USERS=200
OUTPUT_FILE="test-users.json"
BTC_PRICE=50000  # Prix approximatif du BTC en USD (sera mis à jour si nécessaire)

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Forcer HTTPS pour les URLs Railway (redirection automatique)
if [[ "$API_URL" == http://*railway.app* ]] || [[ "$API_URL" == http://*up.railway.app* ]]; then
    API_URL="${API_URL/http:/https:}"
    echo -e "${BLUE}[INFO]${NC} URL mise à jour pour utiliser HTTPS: $API_URL"
fi

# Vérifier que curl, jq et bc sont installés
if ! command -v curl &> /dev/null; then
    log_error "curl n'est pas installé. Veuillez l'installer."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_error "jq n'est pas installé. Veuillez l'installer: brew install jq (macOS) ou apt-get install jq (Linux)"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    log_error "bc n'est pas installé. Veuillez l'installer: brew install bc (macOS) ou apt-get install bc (Linux)"
    exit 1
fi

# Vérifier que le backend est accessible
log_info "Vérification de la connexion au backend: $API_URL"
if ! curl -s -L -f "$API_URL/health" > /dev/null 2>&1; then
    log_warning "Le endpoint /health n'est pas accessible, mais on continue..."
fi

# Initialiser le fichier de sortie
echo "[]" > "$OUTPUT_FILE"

# Fonction pour créer un utilisateur
create_user() {
    local user_num=$1
    local email="usertests${user_num}@exstrat.com"
    local password="TestPassword123!"
    
    log_info "Création de l'utilisateur $user_num: $email"
    
    # Créer l'utilisateur
    local signup_response=$(curl -s -L -w "\n%{http_code}" -X POST "$API_URL/auth/signup" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\"
        }" 2>&1)
    
    # Extraire le code HTTP et la réponse
    local http_code=$(echo "$signup_response" | tail -n1)
    local response_body=$(echo "$signup_response" | sed '$d')
    
    # Vérifier si curl a réussi
    if [ -z "$response_body" ] || [ "$http_code" != "201" ]; then
        log_error "Échec de la création de l'utilisateur $user_num"
        log_error "Code HTTP: ${http_code:-'aucun'}"
        if [ -n "$response_body" ]; then
            log_error "Réponse:"
            echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
        else
            log_error "Aucune réponse du serveur. Vérifiez que le backend est démarré et accessible."
            log_error "Test de connexion: curl -v $API_URL/health"
        fi
        return 1
    fi
    
    # Vérifier si la réponse est valide JSON
    if ! echo "$response_body" | jq -e '.' > /dev/null 2>&1; then
        log_error "Réponse invalide (pas de JSON)"
        log_error "Réponse brute: $response_body"
        return 1
    fi
    
    # Vérifier si l'utilisateur a été créé
    local access_token=$(echo "$response_body" | jq -r '.accessToken // empty')
    
    if [ -z "$access_token" ] || [ "$access_token" = "null" ]; then
        log_error "Échec de la création de l'utilisateur $user_num - Pas de token d'accès"
        log_error "Réponse complète:"
        echo "$response_body" | jq '.'
        
        # Vérifier le code de statut HTTP si disponible
        local status_code=$(echo "$response_body" | jq -r '.statusCode // empty')
        if [ -n "$status_code" ]; then
            log_error "Code de statut HTTP: $status_code"
        fi
        
        local message=$(echo "$response_body" | jq -r '.message // empty')
        if [ -n "$message" ]; then
            log_error "Message: $message"
        fi
        
        return 1
    fi
    
    local user_id=$(echo "$response_body" | jq -r '.user.id')
    log_success "Utilisateur créé: $user_id"
    
    # Créer un portfolio (wallet)
    log_info "Création du portfolio pour l'utilisateur $user_num"
    local portfolio_response=$(curl -s -L -X POST "$API_URL/portfolios" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $access_token" \
        -d "{
            \"name\": \"Portfolio Principal\",
            \"description\": \"Portfolio de test pour les tests de charge\",
            \"isDefault\": true
        }")
    
    local portfolio_id=$(echo "$portfolio_response" | jq -r '.id // empty')
    
    if [ -z "$portfolio_id" ] || [ "$portfolio_id" = "null" ]; then
        log_error "Échec de la création du portfolio pour l'utilisateur $user_num"
        echo "$portfolio_response" | jq '.'
        return 1
    fi
    
    log_success "Portfolio créé: $portfolio_id"
    
    # Créer un holding de 2 BTC via une transaction
    # Le système créera automatiquement le token BTC s'il n'existe pas
    log_info "Création du holding de 2 BTC"
    
    local btc_quantity=2
    local btc_invested_amount=$((btc_quantity * BTC_PRICE))
    
    # Créer une transaction BUY pour créer automatiquement le token et le holding
    local transaction_response=$(curl -s -L -X POST "$API_URL/transactions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $access_token" \
        -d "{
            \"symbol\": \"BTC\",
            \"name\": \"Bitcoin\",
            \"cmcId\": 1,
            \"quantity\": $btc_quantity,
            \"amountInvested\": $btc_invested_amount,
            \"averagePrice\": $BTC_PRICE,
            \"type\": \"BUY\",
            \"transactionDate\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\",
            \"portfolioId\": \"$portfolio_id\"
        }")
    
    # Vérifier si la transaction a été créée
    if ! echo "$transaction_response" | jq -e '.id' > /dev/null 2>&1; then
        log_error "Échec de la création de la transaction pour l'utilisateur $user_num"
        echo "$transaction_response" | jq '.' >&2
        return 1
    fi
    
    # Synchroniser le portfolio pour créer les holdings à partir des transactions
    log_info "Synchronisation du portfolio pour créer les holdings"
    curl -s -L -X POST "$API_URL/portfolios/sync" \
        -H "Authorization: Bearer $access_token" > /dev/null
    
    # Attendre un peu pour que la synchronisation se fasse
    sleep 0.5
    
    # Récupérer les holdings du portfolio
    local holdings_response=$(curl -s -L -X GET "$API_URL/portfolios/$portfolio_id/holdings" \
        -H "Authorization: Bearer $access_token")
    
    local holding_id=$(echo "$holdings_response" | jq -r '.[0].id // empty')
    local token_id=$(echo "$holdings_response" | jq -r '.[0].token.id // empty')
    
    if [ -z "$holding_id" ] || [ "$holding_id" = "null" ]; then
        log_error "Impossible de récupérer le holding BTC pour l'utilisateur $user_num"
        echo "$holdings_response" | jq '.' >&2
        return 1
    fi
    
    log_success "Holding créé: $holding_id (Token: $token_id)"
    
    # Créer une stratégie
    log_info "Création de la stratégie pour l'utilisateur $user_num"
    local strategy_response=$(curl -s -L -X POST "$API_URL/portfolios/strategies" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $access_token" \
        -d "{
            \"portfolioId\": \"$portfolio_id\",
            \"name\": \"Stratégie de test\",
            \"description\": \"Stratégie créée pour les tests de charge\",
            \"status\": \"active\"
        }")
    
    local strategy_id=$(echo "$strategy_response" | jq -r '.id // empty')
    
    if [ -z "$strategy_id" ] || [ "$strategy_id" = "null" ]; then
        log_error "Échec de la création de la stratégie pour l'utilisateur $user_num"
        return 1
    fi
    
    log_success "Stratégie créée: $strategy_id"
    
    # Configurer la stratégie pour le token BTC
    log_info "Configuration de la stratégie pour le token BTC"
    local token_config_response=$(curl -s -L -X POST "$API_URL/portfolios/strategies/$strategy_id/token-configs" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $access_token" \
        -d "{
            \"holdingId\": \"$holding_id\",
            \"isActive\": true
        }")
    
    # Créer une prévision
    log_info "Création de la prévision pour l'utilisateur $user_num"
    local forecast_response=$(curl -s -L -X POST "$API_URL/portfolios/forecasts" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $access_token" \
        -d "{
            \"portfolioId\": \"$portfolio_id\",
            \"name\": \"Prévision de test\",
            \"appliedStrategies\": {
                \"$holding_id\": \"$strategy_id\"
            },
            \"summary\": {
                \"totalInvested\": $btc_invested_amount,
                \"totalCollected\": 0,
                \"totalProfit\": 0,
                \"returnPercentage\": 0,
                \"remainingTokensValue\": $btc_invested_amount,
                \"tokenCount\": 1
            }
        }")
    
    local forecast_id=$(echo "$forecast_response" | jq -r '.id // empty')
    
    if [ -z "$forecast_id" ] || [ "$forecast_id" = "null" ]; then
        log_error "Échec de la création de la prévision pour l'utilisateur $user_num"
        return 1
    fi
    
    log_success "Prévision créée: $forecast_id"
    
    # Créer une configuration d'alertes
    log_info "Création de la configuration d'alertes pour l'utilisateur $user_num"
    
    # Calculer les valeurs avec bc pour gérer les décimales
    local tp1_target_price=$(echo "scale=2; $BTC_PRICE * 1.10" | bc)
    local tp1_sell_qty=0.2
    local tp1_projected=$(echo "scale=2; $btc_quantity * 0.2 * $BTC_PRICE * 1.10" | bc)
    local tp1_remaining=$(echo "scale=2; $btc_quantity * 0.8 * $BTC_PRICE" | bc)
    
    local tp2_target_price=$(echo "scale=2; $BTC_PRICE * 1.25" | bc)
    local tp2_sell_qty=0.3
    local tp2_projected=$(echo "scale=2; $btc_quantity * 0.3 * $BTC_PRICE * 1.25" | bc)
    local tp2_remaining=$(echo "scale=2; $btc_quantity * 0.5 * $BTC_PRICE" | bc)
    
    local tp3_target_price=$(echo "scale=2; $BTC_PRICE * 1.50" | bc)
    local tp3_sell_qty=0.5
    local tp3_projected=$(echo "scale=2; $btc_quantity * 0.5 * $BTC_PRICE * 1.50" | bc)
    
    local alert_config_response=$(curl -s -L -X POST "$API_URL/configuration/alerts" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $access_token" \
        -d "{
            \"forecastId\": \"$forecast_id\",
            \"isActive\": true,
            \"notificationChannels\": {
                \"email\": true,
                \"push\": false
            },
            \"tokenAlerts\": [
                {
                    \"holdingId\": \"$holding_id\",
                    \"tokenSymbol\": \"BTC\",
                    \"numberOfTargets\": 3,
                    \"isActive\": true,
                    \"tpAlerts\": [
                        {
                            \"tpOrder\": 1,
                            \"targetPrice\": $tp1_target_price,
                            \"sellQuantity\": $tp1_sell_qty,
                            \"projectedAmount\": $tp1_projected,
                            \"remainingValue\": $tp1_remaining,
                            \"beforeTP\": {
                                \"enabled\": true,
                                \"value\": -10,
                                \"type\": \"percentage\"
                            },
                            \"tpReached\": {
                                \"enabled\": true
                            },
                            \"isActive\": true
                        },
                        {
                            \"tpOrder\": 2,
                            \"targetPrice\": $tp2_target_price,
                            \"sellQuantity\": $tp2_sell_qty,
                            \"projectedAmount\": $tp2_projected,
                            \"remainingValue\": $tp2_remaining,
                            \"beforeTP\": {
                                \"enabled\": true,
                                \"value\": -10,
                                \"type\": \"percentage\"
                            },
                            \"tpReached\": {
                                \"enabled\": true
                            },
                            \"isActive\": true
                        },
                        {
                            \"tpOrder\": 3,
                            \"targetPrice\": $tp3_target_price,
                            \"sellQuantity\": $tp3_sell_qty,
                            \"projectedAmount\": $tp3_projected,
                            \"remainingValue\": 0,
                            \"beforeTP\": {
                                \"enabled\": true,
                                \"value\": -10,
                                \"type\": \"percentage\"
                            },
                            \"tpReached\": {
                                \"enabled\": true
                            },
                            \"isActive\": true
                        }
                    ]
                }
            ]
        }")
    
    local alert_config_id=$(echo "$alert_config_response" | jq -r '.id // empty')
    
    if [ -z "$alert_config_id" ] || [ "$alert_config_id" = "null" ]; then
        log_warning "La configuration d'alertes n'a pas pu être créée (peut-être optionnelle)"
    else
        log_success "Configuration d'alertes créée: $alert_config_id"
    fi
    
    # Sauvegarder les informations de l'utilisateur
    local user_data=$(jq -n \
        --arg email "$email" \
        --arg password "$password" \
        --arg user_id "$user_id" \
        --arg access_token "$access_token" \
        --arg portfolio_id "$portfolio_id" \
        --arg holding_id "$holding_id" \
        --arg token_id "$token_id" \
        --arg strategy_id "$strategy_id" \
        --arg forecast_id "$forecast_id" \
        --arg alert_config_id "${alert_config_id:-}" \
        '{
            email: $email,
            password: $password,
            userId: $user_id,
            accessToken: $access_token,
            portfolioId: $portfolio_id,
            holdingId: $holding_id,
            tokenId: $token_id,
            strategyId: $strategy_id,
            forecastId: $forecast_id,
            alertConfigId: $alert_config_id
        }')
    
    # Ajouter au fichier JSON
    local temp_file=$(mktemp)
    jq --argjson new_user "$user_data" '. + [$new_user]' "$OUTPUT_FILE" > "$temp_file"
    mv "$temp_file" "$OUTPUT_FILE"
    
    log_success "Utilisateur $user_num créé avec succès!"
    return 0
}

# Fonction principale
main() {
    log_info "Début de la création de $NUM_USERS utilisateurs de test"
    log_info "API URL: $API_URL"
    log_info "Fichier de sortie: $OUTPUT_FILE"
    
    local success_count=0
    local error_count=0
    
    for i in $(seq 1 $NUM_USERS); do
        if create_user $i; then
            ((success_count++))
        else
            ((error_count++))
        fi
        
        # Afficher la progression
        if [ $((i % 10)) -eq 0 ]; then
            log_info "Progression: $i/$NUM_USERS utilisateurs traités (Succès: $success_count, Erreurs: $error_count)"
        fi
        
        # Petit délai pour éviter de surcharger le serveur
        sleep 0.1
    done
    
    log_info "=========================================="
    log_success "Création terminée!"
    log_info "Total: $NUM_USERS utilisateurs"
    log_success "Succès: $success_count"
    if [ $error_count -gt 0 ]; then
        log_error "Erreurs: $error_count"
    fi
    log_info "Les données ont été sauvegardées dans: $OUTPUT_FILE"
    log_info "=========================================="
}

# Exécuter le script
main

