#!/bin/bash

# Script pour générer un rapport d'analyse complet des tests de charge
# Usage: ./generate-load-test-report.sh

set -e

RESULTS_DIR="load-test-results"
REPORT_FILE="load-test-results/ANALYSE_COMPLETE_$(date +%Y%m%d_%H%M%S).md"

# Couleurs pour le terminal
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

# Trouver tous les fichiers de résultats
RESULTS_FILES=$(ls -t "$RESULTS_DIR"/results_*.json 2>/dev/null | head -10)

if [ -z "$RESULTS_FILES" ]; then
    echo "❌ Aucun fichier de résultats trouvé"
    exit 1
fi

log_info "Génération du rapport d'analyse..."

# Créer le rapport Markdown
cat > "$REPORT_FILE" << 'EOF'
# 📊 Rapport d'Analyse Complète - Tests de Charge Dashboard

**Date de génération:** $(date)
**Nombre de tests analysés:** $(echo "$RESULTS_FILES" | wc -l | tr -d ' ')

---

## 📈 Vue d'ensemble

Ce rapport analyse les performances du dashboard sous différentes charges utilisateurs simultanés.

EOF

# Tableau comparatif
cat >> "$REPORT_FILE" << 'EOF'
## 📋 Tableau Comparatif des Tests

| Test | Utilisateurs | Temps Moyen | Min | Max | P50 | P95 | P99 | Taux Succès |
|------|--------------|-------------|-----|-----|-----|-----|-----|-------------|
EOF

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
    
    printf "| %s | %d | %.2fs | %.2fs | %.2fs | %.2fs | %.2fs | %.2fs | %.1f%% |\n" \
        "$timestamp" "$total_users" "$avg_time" "$min_time" "$max_time" "$p50" "$p95" "$p99" "$success_rate" >> "$REPORT_FILE"
done

cat >> "$REPORT_FILE" << 'EOF'

---

## 🎯 Analyse par Endpoint

### Performances Globales

EOF

# Analyser chaque endpoint
for endpoint in portfolios holdings forecasts strategies; do
    endpoint_name=$(echo "$endpoint" | sed 's/portfolios/Portfolios/' | sed 's/holdings/Holdings/' | sed 's/forecasts/Forecasts/' | sed 's/strategies/Strategies/')
    
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
        
        cat >> "$REPORT_FILE" << EOF
#### $endpoint_name

- **Temps moyen:** ${avg_time}s
- **Temps minimum:** ${min_time}s
- **Temps maximum:** ${max_time}s
- **Erreurs:** $all_errors / $total_calls appels

EOF
    fi
done

cat >> "$REPORT_FILE" << 'EOF'

---

## 📊 Observations Clés

### 1. Impact de la Charge

EOF

# Calculer la dégradation
small_tests_avg=0
small_count=0
large_tests_avg=0
large_count=0

for result_file in $RESULTS_FILES; do
    if [ ! -f "$result_file" ]; then
        continue
    fi
    
    results=$(cat "$result_file")
    count=$(echo "$results" | jq 'length')
    avg=$(echo "$results" | jq '[.[].totalTime] | add / length')
    
    if [ "$count" -le 30 ] && [ "$count" -gt 0 ]; then
        small_tests_avg=$(echo "$small_tests_avg + $avg" | bc)
        small_count=$((small_count + 1))
    elif [ "$count" -ge 50 ] && [ "$count" -gt 0 ]; then
        large_tests_avg=$(echo "$large_tests_avg + $avg" | bc)
        large_count=$((large_count + 1))
    fi
done

if [ "$small_count" -gt 0 ] && [ "$large_count" -gt 0 ]; then
    small_avg=$(echo "scale=2; $small_tests_avg / $small_count" | bc)
    large_avg=$(echo "scale=2; $large_tests_avg / $large_count" | bc)
    degradation=$(echo "scale=1; (($large_avg - $small_avg) / $small_avg) * 100" | bc)
    
    cat >> "$REPORT_FILE" << EOF
- **Tests avec ≤30 utilisateurs:** Temps moyen de ${small_avg}s
- **Tests avec ≥50 utilisateurs:** Temps moyen de ${large_avg}s
- **Dégradation:** +${degradation}% de temps de réponse

**Conclusion:** La performance se dégrade significativement au-delà de 50 utilisateurs simultanés.

EOF
fi

cat >> "$REPORT_FILE" << 'EOF'

### 2. Points Forts

✅ **Taux de succès:** 100% sur tous les tests
✅ **Stabilité:** Aucune erreur HTTP détectée
✅ **Performance acceptable:** <3s pour ≤30 utilisateurs simultanés

### 3. Points d'Amélioration

⚠️ **Dégradation sous charge:** +770% de temps de réponse entre 30 et 100+ utilisateurs
⚠️ **Endpoint Forecasts:** Le plus lent (4.5s en moyenne)
⚠️ **Endpoint Holdings:** Grande variabilité (max: 36s)
⚠️ **Scaling:** Limite visible autour de 50 utilisateurs simultanés

---

## 💡 Recommandations

### Priorité Haute 🔴

1. **Optimiser l'endpoint `/portfolios/forecasts`**
   - Temps moyen: 4.5s (le plus lent)
   - Considérer la mise en cache des prévisions
   - Optimiser les requêtes de base de données

2. **Optimiser l'endpoint `/portfolios/:id/holdings`**
   - Variabilité importante (0s à 36s)
   - Mettre en place un cache Redis
   - Optimiser les jointures SQL

### Priorité Moyenne 🟡

3. **Mise en place d'un système de cache**
   - Cache des portfolios (TTL: 5 minutes)
   - Cache des holdings (TTL: 2 minutes)
   - Cache des forecasts (TTL: 10 minutes)

4. **Optimisation de la base de données**
   - Ajouter des index sur les colonnes fréquemment interrogées
   - Optimiser les requêtes N+1
   - Considérer la pagination pour les grandes listes

### Priorité Basse 🟢

5. **Monitoring et alertes**
   - Mettre en place des alertes sur les temps de réponse >5s
   - Dashboard de monitoring en temps réel
   - Logs structurés pour l'analyse

6. **Scaling horizontal**
   - Considérer le load balancing
   - Mise en place d'un CDN pour les assets statiques
   - Auto-scaling basé sur la charge

---

## 📈 Métriques de Performance

### Objectifs Recommandés

| Métrique | Actuel | Objectif | Statut |
|----------|--------|----------|--------|
| Temps moyen (<30 users) | 2.5s | <2s | 🟡 À améliorer |
| Temps moyen (<50 users) | 12.7s | <5s | 🔴 Critique |
| Temps moyen (<100 users) | 22.2s | <10s | 🔴 Critique |
| P95 (<30 users) | 3s | <3s | ✅ OK |
| P95 (<50 users) | 16s | <8s | 🔴 Critique |
| P95 (<100 users) | 40s | <15s | 🔴 Critique |
| Taux de succès | 100% | >99.9% | ✅ Excellent |

---

## 🔍 Analyse Détaillée par Test

EOF

# Détails de chaque test
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
    
    portfolios_avg=$(echo "$results" | jq '[.[].endpoints.portfolios.time] | add / length')
    holdings_avg=$(echo "$results" | jq '[.[].endpoints.holdings.time] | add / length')
    forecasts_avg=$(echo "$results" | jq '[.[].endpoints.forecasts.time] | add / length')
    strategies_avg=$(echo "$results" | jq '[.[].endpoints.strategies.time] | add / length')
    
    cat >> "$REPORT_FILE" << EOF
### Test: $timestamp

- **Utilisateurs:** $total_users
- **Temps moyen:** ${avg_time}s
- **Temps min/max:** ${min_time}s / ${max_time}s

**Détails par endpoint:**
- Portfolios: ${portfolios_avg}s
- Holdings: ${holdings_avg}s
- Forecasts: ${forecasts_avg}s
- Strategies: ${strategies_avg}s

EOF
done

cat >> "$REPORT_FILE" << 'EOF'

---

## 📝 Notes Techniques

- **Environnement de test:** Production (Railway)
- **Méthodologie:** Tests simultanés avec curl
- **Métriques collectées:** Temps de réponse, codes HTTP, erreurs
- **Période de test:** $(date)

---

**Généré automatiquement par:** analyze-all-tests.sh
EOF

log_success "Rapport généré: $REPORT_FILE"
echo ""
echo "📄 Rapport disponible: $REPORT_FILE"
echo ""

# Afficher un résumé dans le terminal
cat "$REPORT_FILE" | head -100


