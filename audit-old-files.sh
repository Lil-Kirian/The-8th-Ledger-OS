#!/bin/bash

echo "=========================================="
echo "  8TH LEDGER — OLD FILE AUDIT"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FOUND=0
TO_DELETE=()

check_file() {
    if [ -f "$1" ]; then
        echo -e "${RED}[DELETE]${NC} $1"
        TO_DELETE+=("$1")
        ((FOUND++))
    else
        echo -e "${GREEN}[GONE]${NC} $1"
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${RED}[DELETE DIR]${NC} $1"
        TO_DELETE+=("$1")
        ((FOUND++))
    else
        echo -e "${GREEN}[GONE]${NC} $1"
    fi
}

echo -e "${YELLOW}--- API Routes to Delete ---${NC}"
check_file "app/api/var/route.ts"
check_file "app/api/var/[id]/route.ts"
check_file "app/api/var/stats/route.ts"
check_file "app/api/admin/surplus/route.ts"
check_file "app/api/admin/vsr/route.ts"
check_file "app/api/vin/records/route.ts"
check_file "app/api/migration/tac-to-pac/route.ts"
check_file "app/api/predictions/route.ts"
check_file "app/api/predictions/[id]/route.ts"
check_file "app/api/predictions/[id]/bet/route.ts"
check_file "app/api/predictions/country/route.ts"
check_file "app/api/halls/[id]/messages/route.ts"
check_file "app/api/halls/[id]/messages/[messageId]/route.ts"

echo ""
echo -e "${YELLOW}--- Components to Delete ---${NC}"
check_file "components/halls/sovereign-chat.tsx"
check_file "components/halls/pac-card.tsx"
check_file "components/halls/invite-modal.tsx"
check_file "components/halls/tribunal-card.tsx"
check_file "components/halls/impeach-button.tsx"
check_file "components/halls/ban-modal.tsx"
check_file "components/halls/proposal-card.tsx"
check_file "components/marketplace/escrow-modal.tsx"
check_file "components/marketplace/sales-leaderboard.tsx"
check_file "components/marketplace/share-forge.tsx"
check_file "components/marketplace/marketplace-card.tsx"
check_file "lib/insurance.ts"

echo ""
echo -e "${YELLOW}--- Old Vertical Pages (propvin, autovin, etc.) ---${NC}"
check_dir "app/(dashboard)/verticals/propvin"
check_dir "app/(dashboard)/verticals/autovin"
check_dir "app/(dashboard)/verticals/techvin"
check_dir "app/(dashboard)/verticals/eduvin"
check_dir "app/(dashboard)/verticals/healthvin"
check_dir "app/(dashboard)/verticals/bizvin"
check_dir "app/(dashboard)/verticals/travelvin"
check_dir "app/(dashboard)/verticals/agrivin"
check_dir "app/(dashboard)/verticals/energyvin"
check_dir "app/(dashboard)/verticals/accessvin"

echo ""
echo -e "${YELLOW}--- Legacy Files with *vin References ---${NC}"
find . -type f \( -name "*vin*" -o -name "*vinculum*" -o -name "*VIN-*" \) \
    ! -path "./node_modules/*" \
    ! -path "./.next/*" \
    ! -path "./prisma/migrations/*" \
    -print 2>/dev/null | while read f; do
    echo -e "${RED}[LEGACY]${NC} $f"
    TO_DELETE+=("$f")
    ((FOUND++))
done

echo ""
echo -e "${YELLOW}--- Files with Old Text References ---${NC}"
grep -rl "vinculum\|VIN-\|surplus\|VSR\|VAR\|TAC\|Commitment model" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" \
    . 2>/dev/null | grep -v node_modules | grep -v .next | grep -v prisma/migrations | while read f; do
    echo -e "${YELLOW}[CHECK]${NC} $f"
done

echo ""
echo "=========================================="
echo -e "TOTAL FILES TO DELETE: ${RED}$FOUND${NC}"
echo "=========================================="

if [ ${#TO_DELETE[@]} -gt 0 ]; then
    echo ""
    echo "To delete all found files, run:"
    echo ""
    echo "rm -f \\"
    for f in "${TO_DELETE[@]}"; do
        if [ -f "$f" ]; then
            echo "  $f \\"
        fi
    done
    echo ""
    echo "To delete directories:"
    for f in "${TO_DELETE[@]}"; do
        if [ -d "$f" ]; then
            echo "rm -rf $f"
        fi
    done
fi