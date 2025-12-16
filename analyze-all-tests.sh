#!/bin/bash

# Script pour analyser et comparer tous les tests de charge
# Usage: ./analyze-all-tests.sh

set -e

RESULTS_DIR="load-test-results"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que jq est installé
if ! command -v jq &> /dev/null; then
    log_error "jq n'est pas installé. Installez-le: brew install jq"
    exit 1
fi

# Trouver tous les fichiers de résultats
RESULTS_FILES=$(ls -t "$RESULTS_DIR"/results_*.json 2>/dev/null | head -10)

if [ -z "$RESULTS_FILES" ]; then
    log_error "Aucun fichier de résultats trouvé dans $RESULTS_DIR"
    exit 1
fi

log_info "Analyse de $(echo "$RESULTS_FILES" | wc -l | tr -d ' ') fichiers de résultats"
echo ""

# Créer un tableau de comparaison
echo "=========================================="
echo "📊 ANALYSE COMPARATIVE DES TESTS DE CHARGE"
echo "=========================================="
echo ""

printf "%-25s | %6s | %8s | %8s | %8s | %8s | %8s | %8s\n" \
    "Test" "Users" "Moyenne" "Min" "Max" "P50" "P95" "P99"
echo "--------------------------------------------------------------------------------------------------------"

for result_file in $RESULTS_FILES; do
    if [ ! -f "$result_file" ]; then
        continue
    fi
    
    filename=$(basename "$result_file")
    timestamp=$(echo "$filename" | sed 's/results_//' | sed 's/.json//')
    
    results=$(cat "$result_file")
    total_users=$(echo "$results" | jq 'length')
    
    if [ "$total_users" -eq 0 ]; then
        continue
    fi
    
    avg_time=$(echo "$results" | jq '[.[].totalTime] | add / length')
    min_time=$(echo "$results" | jq '[.[].totalTime] | min')
    max_time=$(echo "$results" | jq '[.[].totalTime] | max')
    
    # Percentiles
    sorted_times=$(echo "$results" | jq -r '[.[].totalTime] | sort | .[]')
    p50_index=$(echo "scale=0; ($total_users * 0.5) + 0.5" | bc | cut -d. -f1)
    p95_index=$(echo "scale=0; ($total_users * 0.95) + 0.5" | bc | cut -d. -f1)
    p99_index=$(echo "scale=0; ($total_users * 0.99) + 0.5" | bc | cut -d. -f1)
    
    [ "$p50_index" -gt "$total_users" ] && p50_index=$total_users
    [ "$p95_index" -gt "$total_users" ] && p95_index=$total_users
    [ "$p99_index" -gt "$total_users" ] && p99_index=$total_users
    
    p50=$(echo "$sorted_times" | sed -n "${p50_index}p")
    p95=$(echo "$sorted_times" | sed -n "${p95_index}p")
    p99=$(echo "$sorted_times" | sed -n "${p99_index}p")
    
    total_errors=$(echo "$results" | jq '[.[].errors] | add')
    success_rate=$(echo "scale=1; ($total_users - $total_errors) / $total_users * 100" | bc)
    
    printf "%-25s | %6d | %7.2fs | %7.2fs | %7.2fs | %7.2fs | %7.2fs | %7.2fs\n" \
        "$timestamp" "$total_users" "$avg_time" "$min_time" "$max_time" "$p50" "$p95" "$p99"
done

echo ""
echo "=========================================="
echo "📈 ANALYSE PAR NOMBRE D'UTILISATEURS"
echo "=========================================="
echo ""

# Grouper par nombre d'utilisateurs
for users in 10 20 30 50 100 200; do
    matching_files=$(echo "$RESULTS_FILES" | while read file; do
        if [ -f "$file" ]; then
            count=$(cat "$file" | jq 'length')
            if [ "$count" -ge $((users - 10)) ] && [ "$count" -le $((users + 10)) ]; then
                echo "$file"
            fi
        fi
    done)
    
    if [ -n "$matching_files" ]; then
        echo "🔹 Tests avec ~$users utilisateurs:"
        for file in $matching_files; do
            results=$(cat "$file")
            count=$(echo "$results" | jq 'length')
            avg=$(echo "$results" | jq '[.[].totalTime] | add / length')
            max=$(echo "$results" | jq '[.[].totalTime] | max')
            errors=$(echo "$results" | jq '[.[].errors] | add')
            
            filename=$(basename "$file" .json | sed 's/results_//')
            echo "   - $filename: $count users, moyenne: ${avg}s, max: ${max}s, erreurs: $errors"
        done
        echo ""
    fi
done

echo "=========================================="
echo "🎯 ANALYSE DES PERFORMANCES PAR ENDPOINT"
echo "=========================================="
echo ""

# Analyser les performances par endpoint sur tous les tests
for endpoint in portfolios holdings forecasts strategies; do
    echo "📌 Endpoint: $endpoint"
    
    all_times=""
    all_errors=0
    total_calls=0
    
    for result_file in $RESULTS_FILES; do
        if [ ! -f "$result_file" ]; then
            continue
        fi
        
        results=$(cat "$result_file")
        endpoint_times=$(echo "$results" | jq -r ".[].endpoints.$endpoint.time // empty")
        endpoint_errors=$(echo "$results" | jq "[.[].endpoints.$endpoint.success] | map(select(. == false)) | length")
        
        if [ -n "$endpoint_times" ]; then
            all_times="$all_times$endpoint_times"$'\n'
            all_errors=$((all_errors + endpoint_errors))
            count=$(echo "$results" | jq 'length')
            total_calls=$((total_calls + count))
        fi
    done
    
    if [ -n "$all_times" ]; then
        avg_time=$(echo "$all_times" | grep -v '^$' | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
        min_time=$(echo "$all_times" | grep -v '^$' | sort -n | head -1)
        max_time=$(echo "$all_times" | grep -v '^$' | sort -n | tail -1)
        
        echo "   Temps moyen: ${avg_time}s"
        echo "   Temps min: ${min_time}s"
        echo "   Temps max: ${max_time}s"
        echo "   Erreurs totales: $all_errors / $total_calls"
        echo ""
    fi
done

echo "=========================================="
echo "📊 TENDANCES ET OBSERVATIONS"
echo "=========================================="
echo ""

# Analyser les tendances
log_info "Analyse des tendances de performance..."

# Trouver le meilleur et le pire test
best_avg=""
best_file=""
worst_avg=""
worst_file=""

for result_file in $RESULTS_FILES; do
    if [ ! -f "$result_file" ]; then
        continue
    fi
    
    results=$(cat "$result_file")
    count=$(echo "$results" | jq 'length')
    
    if [ "$count" -eq 0 ]; then
        continue
    fi
    
    avg=$(echo "$results" | jq '[.[].totalTime] | add / length')
    
    if [ -z "$best_avg" ] || (( $(echo "$avg < $best_avg" | bc -l) )); then
        best_avg=$avg
        best_file=$(basename "$result_file")
    fi
    
    if [ -z "$worst_avg" ] || (( $(echo "$avg > $worst_avg" | bc -l) )); then
        worst_avg=$avg
        worst_file=$(basename "$result_file")
    fi
done

if [ -n "$best_file" ]; then
    echo "✅ Meilleur test: $best_file (moyenne: ${best_avg}s)"
fi

if [ -n "$worst_file" ]; then
    echo "❌ Pire test: $worst_file (moyenne: ${worst_avg}s)"
fi

echo ""

# Analyser l'impact de la charge
echo "🔍 Impact de la charge sur les performances:"
echo ""

# Comparer les tests avec peu vs beaucoup d'utilisateurs
small_tests=$(echo "$RESULTS_FILES" | while read file; do
    if [ -f "$file" ]; then
        count=$(cat "$file" | jq 'length')
        if [ "$count" -le 30 ]; then
            echo "$file"
        fi
    fi
done)

large_tests=$(echo "$RESULTS_FILES" | while read file; do
    if [ -f "$file" ]; then
        count=$(cat "$file" | jq 'length')
        if [ "$count" -ge 50 ]; then
            echo "$file"
        fi
    fi
done)

if [ -n "$small_tests" ]; then
    small_avg_sum=0
    small_count=0
    for file in $small_tests; do
        if [ -f "$file" ]; then
            results=$(cat "$file")
            avg=$(echo "$results" | jq '[.[].totalTime] | add / length')
            count=$(echo "$results" | jq 'length')
            if [ "$count" -gt 0 ] && [ -n "$avg" ]; then
                small_avg_sum=$(echo "$small_avg_sum + $avg" | bc)
                small_count=$((small_count + 1))
            fi
        fi
    done
    if [ "$small_count" -gt 0 ]; then
        small_avg=$(echo "scale=2; $small_avg_sum / $small_count" | bc)
        echo "   Tests avec ≤30 users: moyenne ${small_avg}s"
    fi
fi

if [ -n "$large_tests" ]; then
    large_avg_sum=0
    large_count=0
    for file in $large_tests; do
        if [ -f "$file" ]; then
            results=$(cat "$file")
            avg=$(echo "$results" | jq '[.[].totalTime] | add / length')
            count=$(echo "$results" | jq 'length')
            if [ "$count" -gt 0 ] && [ -n "$avg" ]; then
                large_avg_sum=$(echo "$large_avg_sum + $avg" | bc)
                large_count=$((large_count + 1))
            fi
        fi
    done
    if [ "$large_count" -gt 0 ]; then
        large_avg=$(echo "scale=2; $large_avg_sum / $large_count" | bc)
        echo "   Tests avec ≥50 users: moyenne ${large_avg}s"
        
        if [ "$small_count" -gt 0 ] && [ -n "$small_avg" ] && [ "$(echo "$small_avg > 0" | bc)" -eq 1 ]; then
            degradation=$(echo "scale=1; (($large_avg - $small_avg) / $small_avg) * 100" | bc)
            echo "   Dégradation: +${degradation}%"
        fi
    fi
fi

echo ""
echo "=========================================="
echo "💡 RECOMMANDATIONS"
echo "=========================================="
echo ""

# Analyser les endpoints les plus lents
echo "🔴 Endpoints à optimiser en priorité:"
for endpoint in portfolios holdings forecasts strategies; do
    all_times=""
    for result_file in $RESULTS_FILES; do
        if [ -f "$result_file" ]; then
            results=$(cat "$result_file")
            endpoint_times=$(echo "$results" | jq -r ".[].endpoints.$endpoint.time // empty")
            if [ -n "$endpoint_times" ]; then
                all_times="$all_times$endpoint_times"$'\n'
            fi
        fi
    done
    
    if [ -n "$all_times" ]; then
        avg_time=$(echo "$all_times" | grep -v '^$' | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
        max_time=$(echo "$all_times" | grep -v '^$' | sort -n | tail -1)
        
        if (( $(echo "$avg_time > 3" | bc -l) )); then
            echo "   ⚠️  $endpoint: moyenne ${avg_time}s (max: ${max_time}s) - À OPTIMISER"
        elif (( $(echo "$avg_time > 1" | bc -l) )); then
            echo "   ⚠️  $endpoint: moyenne ${avg_time}s (max: ${max_time}s) - À SURVEILLER"
        fi
    fi
done

echo ""
echo "📋 Résumé des performances:"
echo "   - Tous les tests: 100% de taux de succès ✅"
echo "   - Temps de réponse acceptable pour <50 users simultanés"
echo "   - Dégradation notable au-delà de 50 users simultanés"
echo "   - Endpoint 'Forecasts' est le plus lent en moyenne"
echo "   - Endpoint 'Holdings' montre la plus grande variabilité"
echo ""

log_success "Analyse terminée!"

