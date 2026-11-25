#!/usr/bin/env bash
set -eo pipefail

echo "==================================================================="
echo "  SCRIPT DE DÉPLOIEMENT EN CONTINU - BOUTIQUE PRO SAAS"
echo "==================================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
cd "$INFRA_DIR"

if [ ! -f .env ]; then
  echo "[-] ERREUR: Le fichier $INFRA_DIR/.env est manquant."
  echo "    Copiez $INFRA_DIR/.env.example vers $INFRA_DIR/.env et complétez les valeurs."
  exit 1
fi

echo "[+] Étape 1/4 : Sauvegarde automatique de sûreté avant mise à jour..."
chmod +x "$SCRIPT_DIR/backup-db.sh"
"$SCRIPT_DIR/backup-db.sh" || {
  echo "[!] Avertissement : Le backup a échoué (la base est peut-être en premier démarrage)."
}

echo "[+] Étape 2/4 : Construction de l'image Docker de l'API NestJS..."
docker compose build backend

echo "[+] Étape 3/4 : Redémarrage à chaud du service backend..."
docker compose up -d --no-deps backend

echo "[+] Étape 4/4 : Nettoyage des images résiduelles..."
docker image prune -f

echo "==================================================================="
echo "  DÉPLOIEMENT TERMINÉ AVEC SUCCÈS - SYSTÈME OPÉRATIONNEL"
echo "==================================================================="
