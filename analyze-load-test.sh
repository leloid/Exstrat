#!/bin/bash

# Script pour analyser les résultats des tests de charge
# Usage: ./analyze-load-test.sh [results_file.json]

set -e

RESULTS_FILE="${1:-load-test-results/results_*.json}"
RESULTS_FILE=$(ls -t $RESULTS_FILE 2>/dev/null | head -1)

if [ -z "$RESULTS_FILE" ] || [ ! -f "$RESULTS_FILE" ]; then
    echo "❌ Aucun fichier de résultats trouvé"
    echo "Usage: ./analyze-load-test.sh [results_file.json]"
    exit 1
fi

echo "📊 Analyse du fichier: $RESULTS_FILE"
echo ""

# Vérifier que jq est installé
if ! command -v jq &> /dev/null; then
    echo "❌ jq n'est pas installé. Installez-le: brew install jq"
    exit 1
fi

# Lire les résultats
RESULTS=$(cat "$RESULTS_FILE")
TOTAL_USERS=$(echo "$RESULTS" | jq 'length')

echo "=========================================="
echo "ANALYSE DÉTAILLÉE DES RÉSULTATS"
echo "=========================================="
echo "Nombre d'utilisateurs: $TOTAL_USERS"
echo ""

# Statistiques globales
echo "📈 STATISTIQUES GLOBALES"
echo "------------------------"
TOTAL_TIME=$(echo "$RESULTS" | jq '[.[].totalTime] | add')
AVG_TIME=$(echo "$RESULTS" | jq '[.[].totalTime] | add / length')
MIN_TIME=$(echo "$RESULTS" | jq '[.[].totalTime] | min')
MAX_TIME=$(echo "$RESULTS" | jq '[.[].totalTime] | max')

echo "Temps total: ${TOTAL_TIME}s"
echo "Temps moyen: ${AVG_TIME}s"
echo "Temps minimum: ${MIN_TIME}s"
echo "Temps maximum: ${MAX_TIME}s"
echo ""

# Percentiles
echo "📊 PERCENTILES"
echo "--------------"
SORTED_TIMES=$(echo "$RESULTS" | jq -r '[.[].totalTime] | sort | .[]')
P50_INDEX=$(echo "scale=0; ($TOTAL_USERS * 0.5) + 0.5" | bc | cut -d. -f1)
P75_INDEX=$(echo "scale=0; ($TOTAL_USERS * 0.75) + 0.5" | bc | cut -d. -f1)
P90_INDEX=$(echo "scale=0; ($TOTAL_USERS * 0.90) + 0.5" | bc | cut -d. -f1)
P95_INDEX=$(echo "scale=0; ($TOTAL_USERS * 0.95) + 0.5" | bc | cut -d. -f1)
P99_INDEX=$(echo "scale=0; ($TOTAL_USERS * 0.99) + 0.5" | bc | cut -d. -f1)

# S'assurer que les indices ne dépassent pas le nombre d'utilisateurs
[ "$P50_INDEX" -gt "$TOTAL_USERS" ] && P50_INDEX=$TOTAL_USERS
[ "$P75_INDEX" -gt "$TOTAL_USERS" ] && P75_INDEX=$TOTAL_USERS
[ "$P90_INDEX" -gt "$TOTAL_USERS" ] && P90_INDEX=$TOTAL_USERS
[ "$P95_INDEX" -gt "$TOTAL_USERS" ] && P95_INDEX=$TOTAL_USERS
[ "$P99_INDEX" -gt "$TOTAL_USERS" ] && P99_INDEX=$TOTAL_USERS

P50=$(echo "$SORTED_TIMES" | sed -n "${P50_INDEX}p")
P75=$(echo "$SORTED_TIMES" | sed -n "${P75_INDEX}p")
P90=$(echo "$SORTED_TIMES" | sed -n "${P90_INDEX}p")
P95=$(echo "$SORTED_TIMES" | sed -n "${P95_INDEX}p")
P99=$(echo "$SORTED_TIMES" | sed -n "${P99_INDEX}p")

echo "P50 (médiane): ${P50}s"
echo "P75: ${P75}s"
echo "P90: ${P90}s"
echo "P95: ${P95}s"
echo "P99: ${P99}s"
echo ""

# Taux de réussite
echo "✅ TAUX DE RÉUSSITE"
echo "-------------------"
TOTAL_ERRORS=$(echo "$RESULTS" | jq '[.[].errors] | add')
SUCCESS_RATE=$(echo "scale=2; ($TOTAL_USERS - $TOTAL_ERRORS) / $TOTAL_USERS * 100" | bc)
echo "Erreurs totales: $TOTAL_ERRORS"
echo "Taux de succès: ${SUCCESS_RATE}%"
echo ""

# Statistiques par endpoint
echo "🔌 STATISTIQUES PAR ENDPOINT"
echo "-----------------------------"

# Portfolios
PORTFOLIOS_AVG=$(echo "$RESULTS" | jq '[.[].endpoints.portfolios.time] | add / length')
PORTFOLIOS_MIN=$(echo "$RESULTS" | jq '[.[].endpoints.portfolios.time] | min')
PORTFOLIOS_MAX=$(echo "$RESULTS" | jq '[.[].endpoints.portfolios.time] | max')
PORTFOLIOS_ERRORS=$(echo "$RESULTS" | jq '[.[].endpoints.portfolios.success] | map(select(. == false)) | length')

echo "📦 Portfolios (/portfolios):"
echo "   Temps moyen: ${PORTFOLIOS_AVG}s"
echo "   Temps min: ${PORTFOLIOS_MIN}s"
echo "   Temps max: ${PORTFOLIOS_MAX}s"
echo "   Erreurs: $PORTFOLIOS_ERRORS"
echo ""

# Holdings
HOLDINGS_AVG=$(echo "$RESULTS" | jq '[.[].endpoints.holdings.time] | add / length')
HOLDINGS_MIN=$(echo "$RESULTS" | jq '[.[].endpoints.holdings.time] | min')
HOLDINGS_MAX=$(echo "$RESULTS" | jq '[.[].endpoints.holdings.time] | max')
HOLDINGS_ERRORS=$(echo "$RESULTS" | jq '[.[].endpoints.holdings.success] | map(select(. == false)) | length')

echo "💼 Holdings (/portfolios/:id/holdings):"
echo "   Temps moyen: ${HOLDINGS_AVG}s"
echo "   Temps min: ${HOLDINGS_MIN}s"
echo "   Temps max: ${HOLDINGS_MAX}s"
echo "   Erreurs: $HOLDINGS_ERRORS"
echo ""

# Forecasts
FORECASTS_AVG=$(echo "$RESULTS" | jq '[.[].endpoints.forecasts.time] | add / length')
FORECASTS_MIN=$(echo "$RESULTS" | jq '[.[].endpoints.forecasts.time] | min')
FORECASTS_MAX=$(echo "$RESULTS" | jq '[.[].endpoints.forecasts.time] | max')
FORECASTS_ERRORS=$(echo "$RESULTS" | jq '[.[].endpoints.forecasts.success] | map(select(. == false)) | length')

echo "📊 Forecasts (/portfolios/forecasts):"
echo "   Temps moyen: ${FORECASTS_AVG}s"
echo "   Temps min: ${FORECASTS_MIN}s"
echo "   Temps max: ${FORECASTS_MAX}s"
echo "   Erreurs: $FORECASTS_ERRORS"
echo ""

# Strategies
STRATEGIES_AVG=$(echo "$RESULTS" | jq '[.[].endpoints.strategies.time] | add / length')
STRATEGIES_MIN=$(echo "$RESULTS" | jq '[.[].endpoints.strategies.time] | min')
STRATEGIES_MAX=$(echo "$RESULTS" | jq '[.[].endpoints.strategies.time] | max')
STRATEGIES_ERRORS=$(echo "$RESULTS" | jq '[.[].endpoints.strategies.success] | map(select(. == false)) | length')

echo "🎯 Strategies (/portfolios/strategies):"
echo "   Temps moyen: ${STRATEGIES_AVG}s"
echo "   Temps min: ${STRATEGIES_MIN}s"
echo "   Temps max: ${STRATEGIES_MAX}s"
echo "   Erreurs: $STRATEGIES_ERRORS"
echo ""

# Distribution des temps
echo "📈 DISTRIBUTION DES TEMPS"
echo "-------------------------"
echo "Temps < 0.5s: $(echo "$RESULTS" | jq '[.[].totalTime] | map(select(. < 0.5)) | length')"
echo "Temps 0.5-1s: $(echo "$RESULTS" | jq '[.[].totalTime] | map(select(. >= 0.5 and . < 1)) | length')"
echo "Temps 1-2s: $(echo "$RESULTS" | jq '[.[].totalTime] | map(select(. >= 1 and . < 2)) | length')"
echo "Temps 2-5s: $(echo "$RESULTS" | jq '[.[].totalTime] | map(select(. >= 2 and . < 5)) | length')"
echo "Temps >= 5s: $(echo "$RESULTS" | jq '[.[].totalTime] | map(select(. >= 5)) | length')"
echo ""

# Utilisateurs avec erreurs
ERROR_USERS=$(echo "$RESULTS" | jq -r '.[] | select(.errors > 0) | "\(.email) (\(.errors) erreurs)"')
if [ -n "$ERROR_USERS" ]; then
    echo "⚠️  UTILISATEURS AVEC ERREURS"
    echo "-----------------------------"
    echo "$ERROR_USERS"
    echo ""
fi

echo "=========================================="
echo "Analyse terminée!"
echo "Fichier analysé: $RESULTS_FILE"
echo "=========================================="

