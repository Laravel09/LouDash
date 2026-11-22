export const SIMULATION_FPS = 60
import type { CharacterDef } from "./types"

export const LANDING_RECOVERY_FRAMES = 18
export const MIN_REACTION_FRAMES = 55

export interface JumpClearance {
  airtimeFrames: number
  peakRise: number
  worldDistance: number
}

export function getJumpVelocity(character: CharacterDef): number {
  return -Math.sqrt(2 * character.gravity * character.jumpRise)
}

export function getJumpClearance(
  worldSpeed: number,
  character: CharacterDef,
): JumpClearance {
  const velocity = getJumpVelocity(character)
  const airtimeFrames = Math.ceil((Math.abs(velocity) * 2) / character.gravity)
  return {
    airtimeFrames,
    peakRise: (velocity * velocity) / (2 * character.gravity),
    worldDistance: worldSpeed * airtimeFrames,
  }
}

export function getSafeSequenceGap(
  worldSpeed: number,
  character: CharacterDef,
): number {
  const jump = getJumpClearance(worldSpeed, character)
  return Math.ceil(
    Math.max(420, jump.worldDistance + worldSpeed * LANDING_RECOVERY_FRAMES),
  )
}

export function getBurstDuration(powerStars: number): number {
  return 10 + (powerStars - 3) * 1.5
}

export function getSafeGroupGap(
  worldSpeed: number,
  configuredGap: number,
): number {
  return Math.ceil(Math.max(configuredGap, worldSpeed * MIN_REACTION_FRAMES))
}
