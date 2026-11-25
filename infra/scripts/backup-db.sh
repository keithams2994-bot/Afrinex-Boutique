#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$INFRA_DIR/backups"
DATE_TAG=$(date +"%Y%m%d_%H%M%S")
FILENAME="saas_db_backup_${DATE_TAG}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[*] Démarrage du dump compressé PostgreSQL 16..."

if [ -f "$INFRA_DIR/.env" ]; then
  # Charger les variables du .env sans écraser l'environnement courant
  export $(grep -v '^#' "$INFRA_DIR/.env" | xargs)
fi

DB_USER="${DB_USER:-saas_admin}"
DB_NAME="${DB_NAME:-saas_core_db}"

docker compose -f "$INFRA_DIR/docker-compose.yml" exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

echo "[+] Sauvegarde réussie : $BACKUP_DIR/$FILENAME ($(du -h "$BACKUP_DIR/$FILENAME" | cut -f1))"

# Rétention : Purger les sauvegardes vieilles de plus de 30 jours
find "$BACKUP_DIR" -type f -name "saas_db_backup_*.sql.gz" -mtime +30 -delete
echo "[+] Nettoyage des sauvegardes archivées (> 30 jours) effectué."
