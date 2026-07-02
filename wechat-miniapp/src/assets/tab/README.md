# tabBar 图标占位

微信小程序 tabBar 需要 8 张 PNG（4 个 tab × 2 状态：默认/选中），
尺寸 81×81px (3x) 或 27×27px (1x)，透明背景。

需要的文件：

- home.png / home-active.png
- tasks.png / tasks-active.png
- community.png / community-active.png
- profile.png / profile-active.png

颜色：
- 默认：#8A8A8A (colors.muted)
- 选中：#1F3A5F (colors.accent)

可在 `app.config.ts` 中替换为图标字体方案（iconfont / SVG）以避免 PNG 维护。