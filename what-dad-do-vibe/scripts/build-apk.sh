#!/bin/bash
export JAVA_HOME=/tmp/jdk17/Contents/Home
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
cd "$(dirname "$0")/../android"
rm -rf .gradle
JAVA_TOOL_OPTIONS="-Djava.net.useSystemProxies=false" ./gradlew assembleRelease --no-daemon -Dhttp.proxyHost="" -Dhttps.proxyHost=""
