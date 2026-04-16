export function isMobile(): boolean {
  const ua = navigator.userAgent
  return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua)
}
