import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fromArrayBuffer } from 'geotiff'

const SIZE = 65
const areas = JSON.parse(
  readFileSync(new URL('../../terrainAreas.json', import.meta.url), 'utf8'),
)
const ENVELOPE = areas.envelope
const DEFAULT_BBOX = areas.national
const ROIS = areas.rois
const COVERAGES = {
  1000: 'Elevacion4258_1000',
  500: 'Elevacion4258_500',
  200: 'Elevacion4258_200',
  25: 'Elevacion4258_25',
}
const WCS = 'https://servicios.idee.es/wcs-inspire/mdt'

function arg(name, fallback) {
  const prefix = `--${name}=`
  const found = process.argv.find((value) => value.startsWith(prefix))
  return found ? found.slice(prefix.length) : fallback
}

const force = process.argv.includes('--force')
const skipRoi = process.argv.includes('--skip-roi')
const concurrency = Number(arg('concurrency', 6))
const outDir = arg('out', 'public/terrain')

const levelsArg = arg('levels', '0-10')
const [levelFrom, levelTo] = levelsArg.split('-').map(Number)
const bboxArg = arg('bbox', null)
const bbox = bboxArg
  ? (([west, south, east, north]) => ({ west, south, east, north }))(
      bboxArg.split(',').map(Number),
    )
  : DEFAULT_BBOX

function coverageFor(level) {
  if (level <= 5) return COVERAGES[1000]
  if (level === 6) return COVERAGES[500]
  if (level <= 10) return COVERAGES[200]
  return COVERAGES[25]
}

function tileRange(level, area) {
  const width = 180 / 2 ** level
  const xMin = Math.max(0, Math.floor((area.west + 180) / width))
  const xMax = Math.min(2 ** (level + 1) - 1, Math.floor((area.east + 180) / width))
  const yMin = Math.max(0, Math.floor((90 - area.north) / width))
  const yMax = Math.min(2 ** level - 1, Math.floor((90 - area.south) / width))
  return { xMin, xMax, yMin, yMax, width }
}

function tileBounds(level, x, y) {
  const width = 180 / 2 ** level
  const west = -180 + x * width
  const east = west + width
  const north = 90 - y * width
  return { west, east, north, south: north - width }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchTiff(url, attempt = 0) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(90_000) })
    if (response.status === 400) return null
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const type = response.headers.get('content-type') ?? ''
    if (!type.includes('tiff') && !type.includes('octet-stream')) return null
    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    if (attempt >= 3) throw error
    await sleep(400 * 2 ** attempt)
    return fetchTiff(url, attempt + 1)
  }
}

async function readCoverage(coverage, area, width, height) {
  const url =
    `${WCS}?service=WCS&version=2.0.1&request=GetCoverage` +
    `&CoverageId=${coverage}` +
    `&subset=Lat(${area.south.toFixed(6)},${area.north.toFixed(6)})` +
    `&subset=Long(${area.west.toFixed(6)},${area.east.toFixed(6)})` +
    `&format=GEOTIFFINT16`

  const buffer = await fetchTiff(url)
  if (!buffer) return null

  const tiff = await fromArrayBuffer(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  )
  const image = await tiff.getImage()
  const rasters = await image.readRasters({
    width,
    height,
    resampleMethod: 'bilinear',
  })
  return rasters[0]
}

async function buildTile(level, x, y, skipped) {
  if (level > 0 && skipped.has(`${level - 1}/${x >> 1}/${y >> 1}`)) {
    skipped.add(`${level}/${x}/${y}`)
    return 'skip'
  }

  const path = join(outDir, String(level), String(x), `${y}.bin`)
  if (!force) {
    try {
      const { statSync } = await import('node:fs')
      statSync(path)
      return 'exists'
    } catch {
      /* generate */
    }
  }

  const bounds = tileBounds(level, x, y)
  const west = Math.max(bounds.west, ENVELOPE.west)
  const east = Math.min(bounds.east, ENVELOPE.east)
  const south = Math.max(bounds.south, ENVELOPE.south)
  const north = Math.min(bounds.north, ENVELOPE.north)

  if (east - west < 1e-6 || north - south < 1e-6) {
    skipped.add(`${level}/${x}/${y}`)
    return 'skip'
  }

  const col0 = Math.min(SIZE - 1, Math.max(0, Math.round(((west - bounds.west) / (bounds.east - bounds.west)) * (SIZE - 1))))
  const col1 = Math.min(SIZE - 1, Math.max(0, Math.round(((east - bounds.west) / (bounds.east - bounds.west)) * (SIZE - 1))))
  const row0 = Math.min(SIZE - 1, Math.max(0, Math.round(((bounds.north - north) / (bounds.north - bounds.south)) * (SIZE - 1))))
  const row1 = Math.min(SIZE - 1, Math.max(0, Math.round(((bounds.north - south) / (bounds.north - bounds.south)) * (SIZE - 1))))

  const tile = new Int16Array(SIZE * SIZE)
  const isFullTile =
    Math.abs(west - bounds.west) < 1e-9 &&
    Math.abs(east - bounds.east) < 1e-9 &&
    Math.abs(south - bounds.south) < 1e-9 &&
    Math.abs(north - bounds.north) < 1e-9

  if (isFullTile) {
    const marginX = (east - west) / (SIZE - 1) / 2
    const marginY = (north - south) / (SIZE - 1) / 2
    const data = await readCoverage(
      coverageFor(level),
      {
        west: Math.max(ENVELOPE.west, west - marginX),
        east: Math.min(ENVELOPE.east, east + marginX),
        south: Math.max(ENVELOPE.south, south - marginY),
        north: Math.min(ENVELOPE.north, north + marginY),
      },
      SIZE,
      SIZE,
    )
    if (!data) {
      skipped.add(`${level}/${x}/${y}`)
      return 'skip'
    }
    for (let i = 0; i < tile.length; i++) {
      const raw = data[i]
      tile[i] = Number.isFinite(raw) && raw > -100 ? Math.round(raw) : 0
    }
  } else {
    const width = Math.max(1, col1 - col0 + 1)
    const height = Math.max(1, row1 - row0 + 1)
    const data = await readCoverage(
      coverageFor(level),
      { west, south, east, north },
      width,
      height,
    )
    if (!data) {
      skipped.add(`${level}/${x}/${y}`)
      return 'skip'
    }
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const raw = data[row * width + col]
        const value = Number.isFinite(raw) && raw > -100 ? Math.round(raw) : 0
        tile[(row0 + row) * SIZE + (col0 + col)] = value
      }
    }
  }

  let max = 0
  for (const value of tile) if (value > max) max = value
  if (max <= 2) {
    skipped.add(`${level}/${x}/${y}`)
    return 'skip'
  }

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, Buffer.from(tile.buffer, tile.byteOffset, tile.byteLength))
  return 'written'
}

function tilesForLevel(level, area) {
  const { xMin, xMax, yMin, yMax } = tileRange(level, area)
  const tiles = []
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) tiles.push({ level, x, y })
  }
  return tiles
}

async function runPool(tasks, worker) {
  let index = 0
  const results = { written: 0, skip: 0, exists: 0, failed: 0 }

  async function next() {
    while (index < tasks.length) {
      const task = tasks[index++]
      try {
        const result = await worker(task)
        results[result] = (results[result] ?? 0) + 1
      } catch (error) {
        results.failed++
        console.error(`\nError en ${task.level}/${task.x}/${task.y}:`, error.message)
      }
      const done = results.written + results.skip + results.exists + results.failed
      if (done % 100 === 0) {
        process.stdout.write(
          `\r  ${done}/${tasks.length} · nuevas ${results.written} · vacías ${results.skip} · fallos ${results.failed}`,
        )
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => next()))
  process.stdout.write('\n')
  return results
}

let totalWritten = 0
const skipped = new Set()

for (let level = levelFrom; level <= levelTo; level++) {
  const tasks =
    level >= 11 && !skipRoi
      ? ROIS.filter((roi) => level <= roi.maxLevel).flatMap((roi) =>
          tilesForLevel(level, roi),
        )
      : tilesForLevel(level, bbox)

  if (tasks.length === 0) continue

  console.log(`Nivel ${level}: ${tasks.length} teselas (${coverageFor(level)})`)
  const results = await runPool(tasks, (task) =>
    buildTile(task.level, task.x, task.y, skipped),
  )
  totalWritten += results.written
  console.log(
    `  nuevas ${results.written} · vacías ${results.skip} · existentes ${results.exists} · fallos ${results.failed}`,
  )
}

console.log(`\nTotal de teselas nuevas: ${totalWritten}`)
