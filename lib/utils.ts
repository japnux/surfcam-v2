import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatting utilities for forecast data
export function formatWaveHeight(height: number | null | undefined): string {
  if (height === null || height === undefined) return 'N/A'
  return `${height.toFixed(1)}m`
}

export function formatWindSpeed(speed: number | null | undefined): string {
  if (speed === null || speed === undefined) return 'N/A'
  return `${Math.round(speed)} km/h`
}

export function formatTemperature(temp: number | null | undefined): string {
  if (temp === null || temp === undefined) return 'N/A'
  return `${Math.round(temp)}°`
}

export function formatPeriod(period: number | null | undefined): string {
  if (period === null || period === undefined) return 'N/A'
  return `${Math.round(period)}s`
}

export function formatDirection(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) return 'N/A'
  
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']
  const index = Math.round(degrees / 22.5) % 16
  return `${directions[index]} (${Math.round(degrees)}°)`
}

export function getWindDirectionArrow(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) return '○'
  
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘']
  const index = Math.round(degrees / 45) % 8
  return arrows[index]
}

export function formatSwellPower(power: number | null | undefined): string {
  if (power === null || power === undefined || power === 0) return ''
  
  if (power < 500) return '⚡ Faible'
  if (power < 1000) return '⚡⚡ Moyen'
  if (power < 2000) return '⚡⚡⚡ Fort'
  return '⚡⚡⚡⚡ Très fort'
}

export function getTidePhase(
  currentHeight: number,
  nextHighHeight?: number,
  nextLowHeight?: number
): string {
  if (!nextHighHeight && !nextLowHeight) return 'Marée inconnue'
  
  // If we have both high and low, determine phase based on current height
  if (nextHighHeight && nextLowHeight) {
    const midPoint = (nextHighHeight + nextLowHeight) / 2
    return currentHeight < midPoint ? 'Montante' : 'Descendante'
  }
  
  // If we only have high, we're going towards it (rising)
  if (nextHighHeight) return 'Montante'
  
  // If we only have low, we're going towards it (falling)
  return 'Descendante'
}

// Debounce utility
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
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// Slugify utility
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
