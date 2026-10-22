import {
  BoundingSphere,
  Cartesian3,
  HeadingPitchRange,
  Math as CesiumMath,
} from 'cesium'
import type { Quake } from '../data/types'
import { viewerRef } from './viewerRef'

const SPAIN = { lon: -3.7, lat: 39.9, height: 1_350_000 }

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function flyToQuake(
  quake: Quake,
  options: { duration?: number; exaggeration?: number } = {},
): void {
  const viewer = viewerRef.current
  if (!viewer) return

  const exaggeration = options.exaggeration ?? 1
  const depth = quake.depthKm * 1000 * exaggeration
  const base = Math.min(520_000, Math.max(220_000, 520_000 - quake.mag * 60_000))
  const range = Math.max(base, depth + 180_000)
  const center = Cartesian3.fromDegrees(quake.lon, quake.lat, -depth * 0.5)

  viewer.camera.flyToBoundingSphere(new BoundingSphere(center, 0), {
    offset: new HeadingPitchRange(0, CesiumMath.toRadians(-55), range),
    duration: prefersReducedMotion() ? 0 : (options.duration ?? 1.6),
  })
}

export function flyToSpain(duration = 1.6): void {
  const viewer = viewerRef.current
  if (!viewer) return

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(SPAIN.lon, SPAIN.lat, SPAIN.height),
    orientation: {
      heading: 0,
      pitch: CesiumMath.toRadians(-70),
      roll: 0,
    },
    duration: prefersReducedMotion() ? 0 : duration,
  })
}
