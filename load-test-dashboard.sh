#!/bin/bash

# Script de test de charge pour le dashboard
# Simule 50 utilisateurs qui chargent leur dashboard simultanément
# Usage: ./load-test-dashboard.sh [API_URL] [NUM_USERS]

set -e

# Configuration
API_URL="${1:-https://exstrat-production.up.railway.app}"
NUM_USERS="${2:-50}"
USERS_FILE="test-users.json"
RESULTS_DIR="load-test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$RESULTS_DIR/results_${TIMESTAMP}.json"
SUMMARY_FILE="$RESULTS_DIR/summary_${TIMESTAMP}.txt"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Vérifier les prérequis
if ! command -v jq &> /dev/null; then
    log_error "jq n'est pas installé. Installez-le: brew install jq"
    exit 1
fi

if [ ! -f "$USERS_FILE" ]; then
    log_error "Fichier $USERS_FILE introuvable. Exécutez d'abord create-test-users.sh"
    exit 1
fi

# Créer le dossier de résultats
mkdir -p "$RESULTS_DIR"

# Lire les utilisateurs
log_info "Chargement de $NUM_USERS utilisateurs depuis $USERS_FILE"
USERS=$(jq -r ".[0:$NUM_USERS]" "$USERS_FILE")
TOTAL_USERS=$(echo "$USERS" | jq 'length')

if [ "$TOTAL_USERS" -lt "$NUM_USERS" ]; then
    log_warning "Seulement $TOTAL_USERS utilisateurs disponibles dans le fichier"
    NUM_USERS=$TOTAL_USERS
fi

log_info "Test de charge avec $NUM_USERS utilisateurs simultanés"
log_info "API URL: $API_URL"

# Initialiser le fichier de résultats
echo "[]" > "$RESULTS_FILE"

# Fonction pour simuler le chargement du dashboard d'un utilisateur
simulate_dashboard_load() {
    local user_index=$1
    local user=$(echo "$USERS" | jq -r ".[$user_index]")
    local email=$(echo "$user" | jq -r '.email')
    local access_token=$(echo "$user" | jq -r '.accessToken')
    local portfolio_id=$(echo "$user" | jq -r '.portfolioId')
    
    local start_time=$(date +%s.%N)
    local errors=0
    local api_calls=0
    
    # Simuler les appels API du dashboard
    # 1. GET /portfolios
    local portfolios_start=$(date +%s.%N)
    local portfolios_response=$(curl -s -w "\n%{http_code}" -L -X GET "$API_URL/portfolios" \
        -H "Authorization: Bearer $access_token" \
        -H "Content-Type: application/json" 2>&1)
    local portfolios_http_code=$(echo "$portfolios_response" | tail -n1)
    local portfolios_body=$(echo "$portfolios_response" | sed '$d')
    local portfolios_end=$(date +%s.%N)
    local portfolios_time=$(echo "$portfolios_end - $portfolios_start" | bc)
    ((api_calls++))
    
    if [ "$portfolios_http_code" != "200" ]; then
        ((errors++))
    fi
    
    # 2. GET /portfolios/:id/holdings
    local holdings_start=$(date +%s.%N)
    local holdings_response=$(curl -s -w "\n%{http_code}" -L -X GET "$API_URL/portfolios/$portfolio_id/holdings" \
        -H "Authorization: Bearer $access_token" \
        -H "Content-Type: application/json" 2>&1)
    local holdings_http_code=$(echo "$holdings_response" | tail -n1)
    local holdings_body=$(echo "$holdings_response" | sed '$d')
    local holdings_end=$(date +%s.%N)
    local holdings_time=$(echo "$holdings_end - $holdings_start" | bc)
    ((api_calls++))
    
    if [ "$holdings_http_code" != "200" ]; then
        ((errors++))
    fi
    
    # 3. GET /portfolios/forecasts
    local forecasts_start=$(date +%s.%N)
    local forecasts_response=$(curl -s -w "\n%{http_code}" -L -X GET "$API_URL/portfolios/forecasts" \
        -H "Authorization: Bearer $access_token" \
        -H "Content-Type: application/json" 2>&1)
    local forecasts_http_code=$(echo "$forecasts_response" | tail -n1)
    local forecasts_body=$(echo "$forecasts_response" | sed '$d')
    local forecasts_end=$(date +%s.%N)
    local forecasts_time=$(echo "$forecasts_end - $forecasts_start" | bc)
    ((api_calls++))
    
    if [ "$forecasts_http_code" != "200" ]; then
        ((errors++))
    fi
    
    # 4. GET /portfolios/strategies (optionnel)
    local strategies_start=$(date +%s.%N)
    local strategies_response=$(curl -s -w "\n%{http_code}" -L -X GET "$API_URL/portfolios/strategies" \
        -H "Authorization: Bearer $access_token" \
        -H "Content-Type: application/json" 2>&1)
    local strategies_http_code=$(echo "$strategies_response" | tail -n1)
    local strategies_body=$(echo "$strategies_response" | sed '$d')
    local strategies_end=$(date +%s.%N)
    local strategies_time=$(echo "$strategies_end - $strategies_start" | bc)
    ((api_calls++))
    
    if [ "$strategies_http_code" != "200" ]; then
        ((errors++))
    fi
    
    local end_time=$(date +%s.%N)
    local total_time=$(echo "$end_time - $start_time" | bc)
    
    # Calculer le temps moyen par appel API
    local avg_time=$(echo "scale=3; $total_time / $api_calls" | bc)
    
    # Créer le résultat JSON
    local result=$(jq -n \
        --arg email "$email" \
        --arg user_index "$user_index" \
        --arg total_time "$total_time" \
        --arg avg_time "$avg_time" \
        --arg portfolios_time "$portfolios_time" \
        --arg holdings_time "$holdings_time" \
        --arg forecasts_time "$forecasts_time" \
        --arg strategies_time "$strategies_time" \
        --arg portfolios_http_code "$portfolios_http_code" \
        --arg holdings_http_code "$holdings_http_code" \
        --arg forecasts_http_code "$forecasts_http_code" \
        --arg strategies_http_code "$strategies_http_code" \
        --argjson errors "$errors" \
        --argjson api_calls "$api_calls" \
        '{
            userIndex: ($user_index | tonumber),
            email: $email,
            totalTime: ($total_time | tonumber),
            avgTimePerCall: ($avg_time | tonumber),
            apiCalls: $api_calls,
            errors: $errors,
            endpoints: {
                portfolios: {
                    time: ($portfolios_time | tonumber),
                    httpCode: ($portfolios_http_code | tonumber),
                    success: ($portfolios_http_code == "200")
                },
                holdings: {
                    time: ($holdings_time | tonumber),
                    httpCode: ($holdings_http_code | tonumber),
                    success: ($holdings_http_code == "200")
                },
                forecasts: {
                    time: ($forecasts_time | tonumber),
                    httpCode: ($forecasts_http_code | tonumber),
                    success: ($forecasts_http_code == "200")
                },
                strategies: {
                    time: ($strategies_time | tonumber),
                    httpCode: ($strategies_http_code | tonumber),
                    success: ($strategies_http_code == "200")
                }
            }
        }')
    
    # Ajouter au fichier de résultats
    local temp_file=$(mktemp)
    jq --argjson new_result "$result" '. + [$new_result]' "$RESULTS_FILE" > "$temp_file"
    mv "$temp_file" "$RESULTS_FILE"
    
    if [ $errors -eq 0 ]; then
        echo "✅ User $user_index ($email): ${total_time}s"
    else
        echo "❌ User $user_index ($email): ${total_time}s ($errors erreurs)"
    fi
}

# Fonction pour analyser les résultats
analyze_results() {
    log_info "Analyse des résultats..."
    
    local results=$(cat "$RESULTS_FILE")
    local total_users=$(echo "$results" | jq 'length')
    
    # Calculer les statistiques
    local total_time=$(echo "$results" | jq '[.[].totalTime] | add')
    local avg_time=$(echo "$results" | jq '[.[].totalTime] | add / length')
    local min_time=$(echo "$results" | jq '[.[].totalTime] | min')
    local max_time=$(echo "$results" | jq '[.[].totalTime] | max')
    
    # Calculer les percentiles
    local sorted_times=$(echo "$results" | jq -r '[.[].totalTime] | sort | .[]')
    local p50_index=$(echo "scale=0; ($total_users * 0.5) + 0.5" | bc | cut -d. -f1)
    local p95_index=$(echo "scale=0; ($total_users * 0.95) + 0.5" | bc | cut -d. -f1)
    local p99_index=$(echo "scale=0; ($total_users * 0.99) + 0.5" | bc | cut -d. -f1)
    
    # S'assurer que les indices ne dépassent pas le nombre d'utilisateurs
    [ "$p50_index" -gt "$total_users" ] && p50_index=$total_users
    [ "$p95_index" -gt "$total_users" ] && p95_index=$total_users
    [ "$p99_index" -gt "$total_users" ] && p99_index=$total_users
    
    local p50=$(echo "$sorted_times" | sed -n "${p50_index}p")
    local p95=$(echo "$sorted_times" | sed -n "${p95_index}p")
    local p99=$(echo "$sorted_times" | sed -n "${p99_index}p")
    
    # Compter les erreurs
    local total_errors=$(echo "$results" | jq '[.[].errors] | add')
    local success_rate=$(echo "scale=2; ($total_users - $total_errors) / $total_users * 100" | bc)
    
    # Statistiques par endpoint
    local portfolios_avg=$(echo "$results" | jq '[.[].endpoints.portfolios.time] | add / length')
    local holdings_avg=$(echo "$results" | jq '[.[].endpoints.holdings.time] | add / length')
    local forecasts_avg=$(echo "$results" | jq '[.[].endpoints.forecasts.time] | add / length')
    local strategies_avg=$(echo "$results" | jq '[.[].endpoints.strategies.time] | add / length')
    
    local portfolios_errors=$(echo "$results" | jq '[.[].endpoints.portfolios.success] | map(select(. == false)) | length')
    local holdings_errors=$(echo "$results" | jq '[.[].endpoints.holdings.success] | map(select(. == false)) | length')
    local forecasts_errors=$(echo "$results" | jq '[.[].endpoints.forecasts.success] | map(select(. == false)) | length')
    local strategies_errors=$(echo "$results" | jq '[.[].endpoints.strategies.success] | map(select(. == false)) | length')
    
    # Créer le résumé
    cat > "$SUMMARY_FILE" << EOF
========================================
RÉSULTATS DU TEST DE CHARGE - DASHBOARD
========================================
Date: $(date)
API URL: $API_URL
Nombre d'utilisateurs: $total_users
Concurrence: Simultanée

TEMPS DE RÉPONSE GLOBAL
------------------------
Temps total: ${total_time}s
Temps moyen: ${avg_time}s
Temps minimum: ${min_time}s
Temps maximum: ${max_time}s
P50 (médiane): ${p50}s
P95: ${p95}s
P99: ${p99}s

TAUX DE RÉUSSITE
-----------------
Erreurs totales: $total_errors
Taux de succès: ${success_rate}%

STATISTIQUES PAR ENDPOINT
--------------------------
Portfolios:
  - Temps moyen: ${portfolios_avg}s
  - Erreurs: $portfolios_errors

Holdings:
  - Temps moyen: ${holdings_avg}s
  - Erreurs: $holdings_errors

Forecasts:
  - Temps moyen: ${forecasts_avg}s
  - Erreurs: $forecasts_errors

Strategies:
  - Temps moyen: ${strategies_avg}s
  - Erreurs: $strategies_errors

FICHIERS DE RÉSULTATS
---------------------
Résultats détaillés: $RESULTS_FILE
Résumé: $SUMMARY_FILE
EOF

    cat "$SUMMARY_FILE"
    log_success "Résultats sauvegardés dans $RESULTS_DIR/"
}

# Fonction principale
main() {
    log_info "Démarrage du test de charge..."
    log_info "Concurrence: $NUM_USERS utilisateurs simultanés"
    
    local start_time=$(date +%s.%N)
    
    # Lancer les tests en parallèle
    local pids=()
    for i in $(seq 0 $((NUM_USERS - 1))); do
        simulate_dashboard_load $i &
        pids+=($!)
    done
    
    # Attendre que tous les processus se terminent
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    local end_time=$(date +%s.%N)
    local total_test_time=$(echo "$end_time - $start_time" | bc)
    
    log_info "Test terminé en ${total_test_time}s"
    
    # Analyser les résultats
    analyze_results
}

# Exécuter le test
main

