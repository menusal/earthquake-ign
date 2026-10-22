import { Cartesian3, Color, type Entity, type Viewer } from 'cesium'
import { fetchFaults } from '../data/faults'

const DEPTH = -15_000

function colorForSlip(slipRate: number): string {
  if (slipRate >= 5) return '#f05a28'
  if (slipRate >= 1) return '#ff9f43'
  return '#ffd166'
}

export class FaultsLayer {
  private readonly viewer: Viewer
  private entities: Entity[] = []
  private loaded = false
  private token = 0

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  async show(): Promise<void> {
    const token = ++this.token

    if (!this.loaded) {
      const faults = await fetchFaults()
      if (token !== this.token) return
      this.build(faults)
      this.loaded = true
      return
    }

    for (const entity of this.entities) entity.show = true
  }

  private build(faults: Awaited<ReturnType<typeof fetchFaults>>): void {
    for (const fault of faults) {
      const color = Color.fromCssColorString(colorForSlip(fault.slipRate))

      for (const line of fault.lines) {
        if (line.length < 2) continue

        this.entities.push(
          this.viewer.entities.add({
            name: fault.name,
            polyline: {
              positions: line.map(([lon, lat]) => Cartesian3.fromDegrees(lon, lat)),
              width: 1.5,
              material: color.withAlpha(0.85),
              clampToGround: true,
            },
          }),
        )

        this.entities.push(
          this.viewer.entities.add({
            name: fault.name,
            wall: {
              positions: line.map(([lon, lat]) =>
                Cartesian3.fromDegrees(lon, lat, 0),
              ),
              minimumHeights: new Array(line.length).fill(DEPTH),
              material: color.withAlpha(0.22),
            },
          }),
        )
      }
    }
  }

  clear(): void {
    this.token++
    for (const entity of this.entities) {
      this.viewer.entities.remove(entity)
    }
    this.entities = []
  }

  destroy(): void {
    this.clear()
  }
}
