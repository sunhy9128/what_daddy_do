#!/bin/bash
# 将 bili-cli 加入 shell 配置
cat >> ~/.zshrc << 'EOF'

# bili-cli (B站 CLI 工具)
export PATH="/tmp/bili-bin:$PATH"
EOF
echo "✅ 已添加到 ~/.zshrc"
echo "运行以下命令立即生效："
echo "  source ~/.zshrc"
