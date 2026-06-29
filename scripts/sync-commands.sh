#!/usr/bin/env bash
set -euo pipefail

PROMPTS_DIR="documentation/prompts"
SKILLS_DIR=".codex/skills"
OUT_DIRS=(
  ".cursor/commands"
  ".claude/commands"
  ".opencode/commands"
)

# Garante que existem prompts
shopt -s nullglob
PROMPTS=( "$PROMPTS_DIR"/*.md )
if (( ${#PROMPTS[@]} == 0 )); then
  echo "No prompts found in '$PROMPTS_DIR/*.md'"
  exit 1
fi

# Cria pastas de saída
for dir in "${OUT_DIRS[@]}"; do
  mkdir -p "$dir"
done

mkdir -p "$SKILLS_DIR"

# Função: tenta criar symlink; se não der, copia
link_or_copy() {
  local src="$1"
  local dest="$2"

  # Caminho relativo do dest -> src (assumindo repo root)
  # dest fica em .cursor/commands ou .opencode/commands (2 níveis)
  local rel_src="../../$src"

  # Remove arquivo antigo (ou symlink) pra não dar conflito
  rm -f "$dest"

  # Tenta symlink (Linux/macOS/Git Bash). Se falhar, copia.
  if ln -s "$rel_src" "$dest" 2>/dev/null; then
    echo "linked:  $dest -> $rel_src"
  else
    # Fallback: copia conteúdo
    {
      echo "<!-- Auto-generated from $src (symlink not available) -->"
      echo
      cat "$src"
    } > "$dest"
    echo "copied:  $dest <- $src"
  fi
}

extract_description() {
  local src="$1"

  awk '
    NR == 1 && $0 == "---" {
      in_frontmatter = 1
      next
    }
    in_frontmatter && $0 == "---" {
      exit
    }
    in_frontmatter && $0 ~ /^description:[[:space:]]*/ {
      sub(/^description:[[:space:]]*/, "", $0)
      print
      exit
    }
  ' "$src"
}

write_skill() {
  local src="$1"
  local name="$2"
  local skill_dir="$SKILLS_DIR/$name"
  local dest="$skill_dir/SKILL.md"
  local description

  mkdir -p "$skill_dir"
  description="$(extract_description "$src")"

  {
    echo "---"
    echo "name: $name"
    if [[ -n "$description" ]]; then
      echo "description: >"
      echo "  $description"
    fi
    echo "---"
    echo
    awk '
      NR == 1 && $0 == "---" {
        in_frontmatter = 1
        next
      }
      in_frontmatter && $0 == "---" {
        in_frontmatter = 0
        next
      }
      !in_frontmatter {
        print
      }
    ' "$src"
  } > "$dest"

  echo "skill:   $dest"
}

for src in "${PROMPTS[@]}"; do
  filename="$(basename "$src")"
  name="${filename%.md}"

  # Remove "-prompt" do final (se existir)
  if [[ "$name" == *-prompt ]]; then
    name="${name%-prompt}"
  fi

  for dir in "${OUT_DIRS[@]}"; do
    dest="$dir/$name.md"
    link_or_copy "$src" "$dest"
  done

  write_skill "$src" "$name"
done
