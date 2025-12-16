#!/bin/bash

GIT_DIR=$(git rev-parse --git-dir)
PROJECT_ROOT=$(git rev-parse --show-toplevel)

if [ -z "$GIT_DIR" ]; then
    echo "Ошибка: не найден git репозиторий"
    exit 1
fi

echo "Установка git hooks..."
HOOK_PATH="$GIT_DIR/hooks/pre-commit"

cat > "$HOOK_PATH" << EOF
#!/bin/bash

echo "Генерация changelog перед коммитом..."

# Переходим в корень проекта для корректного выполнения скриптов
cd "$PROJECT_ROOT"

if [ -f "./scripts/generate-changelog.sh" ]; then
    ./scripts/generate-changelog.sh
else
    echo "Предупреждение: скрипт ./scripts/generate-changelog.sh не найден"
fi

if git diff --cached --quiet CHANGELOG.md && git diff --quiet CHANGELOG.md && ! git ls-files --others --exclude-standard | grep -q "CHANGELOG.md"; then
    echo "Changelog не изменился"
else
    echo "Changelog обновлен, добавляем в коммит..."
    git add CHANGELOG.md static/CHANGELOG.md
fi

exit 0
EOF

chmod +x "$HOOK_PATH"

echo "Git hooks установлены!"
echo "Теперь changelog будет автоматически генерироваться перед каждым коммитом"
 