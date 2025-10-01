import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWindDirectionArrow(degrees: number): string {
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘']
  const index = Math.round(degrees / 45) % 8
  return arrows[index]
}

export function getSwellDirectionArrow(degrees: number): string {
  return getWindDirectionArrow(degrees)
}

export function formatWaveHeight(meters: number): string {
  return `${meters.toFixed(1)}m`
}

export function formatWindSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`
}

export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°C`
}

export function formatPeriod(seconds: number): string {
  return `${Math.round(seconds)}s`
}

export function getTidePhase(height: number, nextHigh?: number, nextLow?: number): string {
  if (!nextHigh || !nextLow) return 'Inconnue'
  
  const midpoint = (nextHigh + nextLow) / 2
  if (height > midpoint) {
    return height > nextHigh * 0.9 ? 'Haute' : 'Montante'
  } else {
    return height < nextLow * 1.1 ? 'Basse' : 'Descendante'
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
