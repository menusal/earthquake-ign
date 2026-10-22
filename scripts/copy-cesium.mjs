import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const source = join(root, 'node_modules/cesium/Build/Cesium')
const target = join(root, 'public/cesium')
const folders = ['Assets', 'Workers', 'Widgets', 'ThirdParty']

if (!existsSync(source)) {
  console.error('No se encontró cesium. Ejecuta pnpm install.')
  process.exit(1)
}

mkdirSync(target, { recursive: true })

for (const folder of folders) {
  rmSync(join(target, folder), { recursive: true, force: true })
  cpSync(join(source, folder), join(target, folder), { recursive: true })
}

console.log(`Cesium: ${folders.length} carpetas copiadas a public/cesium`)
