#!/bin/bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

# android/ 已不入库（EAS managed 流程），本地构建前先用 prebuild 重新生成
cd "$(dirname "$0")/.."
if [ ! -d android ]; then
  echo "android/ 不存在，运行 expo prebuild 生成..."
  npx expo prebuild -p android --no-install
fi
cd android
rm -rf .gradle
JAVA_TOOL_OPTIONS="-Djava.net.useSystemProxies=false" ./gradlew assembleRelease --no-daemon -Dhttp.proxyHost="" -Dhttps.proxyHost=""

# 将生成的 APK 复制到桌面
APK_SOURCE="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_SOURCE" ]; then
  DEST="$HOME/Desktop/app-release.apk"
  cp "$APK_SOURCE" "$DEST"
  echo "APK 已复制到桌面: $DEST"
else
  echo "警告：未找到 APK 文件 ($APK_SOURCE)，请检查构建是否成功"
fi
