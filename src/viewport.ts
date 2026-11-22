export function getVisibleViewport() {
  const viewport = window.visualViewport

  return {
    width: viewport?.width ?? document.documentElement.clientWidth,
    height: viewport?.height ?? document.documentElement.clientHeight,
  }
}

export function isPortraitViewport() {
  const { width, height } = getVisibleViewport()
  return height > width
}
