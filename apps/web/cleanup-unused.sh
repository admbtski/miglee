#!/bin/bash

# 🧹 Skrypt do czyszczenia nieużywanego kodu w Miglee Web
# Użycie: ./cleanup-unused.sh [--dry-run]

set -e

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN MODE - żadne zmiany nie zostaną zapisane"
fi

FIXED_COUNT=0

# Funkcja do usuwania nieużywanego importu
remove_unused_import() {
  local file=$1
  local import_name=$2
  
  if [ "$DRY_RUN" = true ]; then
    echo "  [DRY-RUN] Usunąłbym import '$import_name' z $file"
  else
    # Usuń cały wiersz z importem
    sed -i.bak "/import.*$import_name.*from/d" "$file"
    # Usuń z destructured importów
    sed -i.bak "s/, *$import_name//g" "$file"
    sed -i.bak "s/$import_name, *//g" "$file"
    rm -f "$file.bak"
    echo "  ✅ Usunięto import '$import_name' z $file"
    ((FIXED_COUNT++))
  fi
}

# Funkcja do usuwania nieużywanej zmiennej
remove_unused_variable() {
  local file=$1
  local var_name=$2
  local line_num=$3
  
  if [ "$DRY_RUN" = true ]; then
    echo "  [DRY-RUN] Usunąłbym zmienną '$var_name' z $file:$line_num"
  else
    echo "  ⚠️  Wymaga ręcznej weryfikacji: $file:$line_num ($var_name)"
  fi
}

echo "🧹 Rozpoczynam czyszczenie nieużywanego kodu..."
echo ""

# ============================================================================
# PRIORYTET 1: Nieużywane ikony z lucide-react
# ============================================================================

echo "📦 Czyszczenie nieużywanych ikon z lucide-react..."

remove_unused_import "src/app/account/intents/_components/my-intent-card.tsx" "Calendar"
remove_unused_import "src/app/account/intents/_components/my-intent-card.tsx" "Eye"
remove_unused_import "src/app/account/intents/_components/my-intent-card.tsx" "ListOrdered"

remove_unused_import "src/app/account/plans-and-bills/_components/edit-card-modal.tsx" "ChevronDown"

remove_unused_import "src/app/admin/comments/page.tsx" "Search"

remove_unused_import "src/app/admin/intents/_components/intent-detail-modal.tsx" "Star"

remove_unused_import "src/app/admin/intents/_components/tabs/settings-tab.tsx" "UserCog"

remove_unused_import "src/app/u/[name]/_components/reviews-tab.tsx" "ChevronRight"

remove_unused_import "src/app/u/[name]/_components/stats-tab.tsx" "TrendingUp"
remove_unused_import "src/app/u/[name]/_components/stats-tab.tsx" "Sparkles"

remove_unused_import "src/features/intents/components/privacy-step.tsx" "Info"

echo ""

# ============================================================================
# PRIORYTET 2: Nieużywane importy komponentów
# ============================================================================

echo "🔧 Czyszczenie nieużywanych importów komponentów..."

remove_unused_import "src/app/account/plans-and-bills/_components/edit-card-modal.tsx" "Select"

remove_unused_import "src/app/admin/notifications/page.tsx" "Role"

remove_unused_import "src/app/admin/intents/_components/tabs/settings-tab.tsx" "useAdminChangeIntentOwnerMutation"

remove_unused_import "src/features/intents/components/create-edit-intent-modal-connect.tsx" "useIntentCoverUpload"

echo ""

# ============================================================================
# PRIORYTET 3: Proste nieużywane zmienne (bezpieczne do usunięcia)
# ============================================================================

echo "🗑️  Czyszczenie prostych nieużywanych zmiennych..."

# Te wymagają ręcznej weryfikacji, więc tylko informujemy
echo "  ⚠️  Następujące pliki wymagają ręcznej weryfikacji:"
echo "     - src/components/forms/location-combobox.tsx:52 (error)"
echo "     - src/components/layout/user-menu.tsx:39 (AVATAR_FALLBACK)"
echo "     - src/features/intents/components/join-question-editor.tsx (multiple)"
echo "     - src/app/account/plans-and-bills/page.tsx (handlers)"

echo ""

# ============================================================================
# Podsumowanie
# ============================================================================

echo "✨ Czyszczenie zakończone!"
echo ""
echo "📊 Statystyki:"
echo "   - Naprawiono automatycznie: $FIXED_COUNT"
echo "   - Wymaga ręcznej weryfikacji: ~20"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "🔍 To był DRY RUN - uruchom bez --dry-run aby zastosować zmiany"
else
  echo "✅ Zmiany zostały zastosowane"
  echo "💡 Uruchom 'npm run typecheck' aby sprawdzić czy wszystko działa"
fi

