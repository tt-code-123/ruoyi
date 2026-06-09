/**
 * 跟后台逻辑一致
 * @param str 数字
 * @returns 安全数内返回number类型 否则返回原字符串
 */
export function safeParseNumber(str: string): number | string {
  const num = Number(str);
  return Number.isSafeInteger(num) ? num : str;
}
