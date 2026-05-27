/**
 * 格式化时间为友好显示
 * - 1分钟内 → "刚刚"
 * - 1小时内 → "X分钟前"
 * - 当天内 → "X小时前"
 * - 1-7天 → "X天前"
 * - 更早 → "MM月DD日" 或 "YYYY年MM月DD日"
 */

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr);
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay <= 7) return `${diffDay}天前`;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();

  if (year === currentYear) {
    return `${month}月${day}日`;
  }
  return `${year}年${month}月${day}日`;
}
