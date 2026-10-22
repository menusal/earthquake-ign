import {
  Cartesian3,
  Color,
  NearFarScalar,
  PointPrimitiveCollection,
  type Viewer,
} from 'cesium'
import { fetchStations } from '../data/stations'

export class StationsLayer {
  private readonly viewer: Viewer
  private readonly collection = new PointPrimitiveCollection()
  private loaded = false
  private token = 0

  constructor(viewer: Viewer) {
    this.viewer = viewer
    viewer.scene.primitives.add(this.collection)
  }

  async show(): Promise<void> {
    const token = ++this.token

    if (!this.loaded) {
      const stations = await fetchStations()
      if (token !== this.token) return

      for (const station of stations) {
        this.collection.add({
          position: Cartesian3.fromDegrees(station.lon, station.lat, 0),
          color: Color.fromCssColorString('#8fd0ff'),
          pixelSize: 6,
          outlineColor: Color.fromCssColorString('#05070d'),
          outlineWidth: 1,
          id: `station:${station.id}`,
          scaleByDistance: new NearFarScalar(20_000, 1.2, 4_000_000, 0.5),
        })
      }
      this.loaded = true
      return
    }

    this.collection.show = true
  }

  clear(): void {
    this.token++
    this.collection.show = false
  }

  destroy(): void {
    this.viewer.scene.primitives.remove(this.collection)
  }
}
