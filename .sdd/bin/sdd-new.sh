#!/usr/bin/env bash
# Crea la carpeta de una feature nueva con su spec.md a partir de la plantilla.
# Ejecutar desde la raíz del proyecto (donde están specs/ y .sdd/).
#
# Uso:
#   .sdd/bin/sdd-new.sh "Solicitar vacaciones" [--branch]
#
#   --branch  crea además la rama git feat/NNN-slug
set -euo pipefail

TITLE="${1:-}"
BRANCH="${2:-}"
if [ -z "$TITLE" ]; then
  echo "Uso: $0 \"Título de la feature\" [--branch]" >&2
  exit 1
fi

TEMPLATE=".sdd/templates/spec.md"
[ -f "$TEMPLATE" ] || { echo "No encuentro $TEMPLATE. ¿Estás en la raíz del proyecto?" >&2; exit 1; }
mkdir -p specs

# Número: el reservado en el roadmap si el título coincide; si no, el siguiente libre
# entre las carpetas de specs/ y los números del roadmap.
ROADMAP="specs/roadmap.md"
NUM=""
if [ -f "$ROADMAP" ]; then
  NUM="$(TITLE="$TITLE" perl -ne 'if (/^\|\s*(\d{3})\s*\|\s*([^|]*?)\s*\|/ && lc($2) eq lc($ENV{TITLE})) { print $1; exit }' "$ROADMAP")"
fi
if [ -z "$NUM" ]; then
  LAST="$( { ls -1 specs 2>/dev/null | grep -E '^[0-9]{3}-' | cut -c1-3; \
             [ -f "$ROADMAP" ] && grep -oE '^\|[[:space:]]*[0-9]{3}[[:space:]]*\|' "$ROADMAP" | grep -oE '[0-9]{3}'; } \
           | sort | tail -n1 || true)"
  if [ -z "$LAST" ]; then NUM="001"; else NUM="$(printf '%03d' $((10#$LAST + 1)))"; fi
  [ -f "$ROADMAP" ] && echo "Aviso: \"$TITLE\" no está en el roadmap. Añádela con /sdd-roadmap."
fi
if ls -d specs/"$NUM"-* >/dev/null 2>&1; then
  echo "Ya existe una carpeta para la spec $NUM: $(ls -d specs/"$NUM"-*)" >&2; exit 1
fi

# Slug: sin tildes, minúsculas, guiones, máx. 40 caracteres
SLUG="$(printf '%s' "$TITLE" \
  | perl -CS -MUnicode::Normalize -pe '$_ = NFD($_); s/\pM//g; $_ = lc; s/[^a-z0-9]+/-/g; s/^-+|-+$//g' \
  | cut -c1-40 | sed 's/-*$//')"

DIR="specs/$NUM-$SLUG"
mkdir -p "$DIR"
TODAY="$(date +%Y-%m-%d)"
AUTHOR="$(git config user.name 2>/dev/null || echo '')"

TITLE="$TITLE" NUM="$NUM" TODAY="$TODAY" AUTHOR="$AUTHOR" perl -pe '
  s/^id: NNN/id: $ENV{NUM}/;
  s/^titulo: .*/titulo: $ENV{TITLE}/;
  s/^autor: .*/autor: $ENV{AUTHOR}/;
  s/^creada: .*/creada: $ENV{TODAY}/;
  s/^# Spec NNN · .*/# Spec $ENV{NUM} · $ENV{TITLE}/;
' "$TEMPLATE" > "$DIR/spec.md"

echo "Creada $DIR/spec.md"

if [ "$BRANCH" = "--branch" ]; then
  git checkout -b "feat/$NUM-$SLUG"
fi
