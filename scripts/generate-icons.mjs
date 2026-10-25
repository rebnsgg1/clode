// Генерує всі іконки програми з SVG-мастерів (npm run icons).
//   assets/icon/icon.svg        — основна іконка (48 px і більше)
//   assets/icon/icon-small.svg  — спрощений варіант для 16–32 px (чіткий у дрібних розмірах)
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const MASTER = 'assets/icon/icon.svg'
const SMALL = 'assets/icon/icon-small.svg'
const OUT = 'src-tauri/icons'

const render = (size) =>
  sharp(size <= 32 ? SMALL : MASTER, { density: Math.max(72, (72 * size * 2) / 1024) * 4 })
    .resize(size, size, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })

/** Запис ICO-елемента у форматі BMP (32 біт, BGRA, знизу догори + маска AND) */
async function bmpEntry(size) {
  const { data } = await render(size).raw().ensureAlpha().toBuffer({ resolveWithObject: true })
  const maskRow = Math.ceil(size / 32) * 4
  const header = Buffer.alloc(40)
  header.writeUInt32LE(40, 0)
  header.writeInt32LE(size, 4)
  header.writeInt32LE(size * 2, 8) // висота XOR + AND
  header.writeUInt16LE(1, 12)
  header.writeUInt16LE(32, 14)
  header.writeUInt32LE(size * size * 4 + maskRow * size, 20)
  const pixels = Buffer.alloc(size * size * 4)
  const mask = Buffer.alloc(maskRow * size)
  for (let y = 0; y < size; y++) {
    const row = size - 1 - y
    for (let x = 0; x < size; x++) {
      const s = (y * size + x) * 4
      const d = (row * size + x) * 4
      pixels[d] = data[s + 2]
      pixels[d + 1] = data[s + 1]
      pixels[d + 2] = data[s]
      pixels[d + 3] = data[s + 3]
      if (data[s + 3] === 0) mask[row * maskRow + (x >> 3)] |= 0x80 >> (x & 7)
    }
  }
  return Buffer.concat([header, pixels, mask])
}

async function buildIco(sizes) {
  const images = []
  for (const size of sizes) images.push(size >= 256 ? await render(size).toBuffer() : await bmpEntry(size))
  const dir = Buffer.alloc(6 + 16 * sizes.length)
  dir.writeUInt16LE(0, 0)
  dir.writeUInt16LE(1, 2) // тип: іконка
  dir.writeUInt16LE(sizes.length, 4)
  let offset = dir.length
  sizes.forEach((size, i) => {
    const e = 6 + i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, e)
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1)
    dir.writeUInt16LE(1, e + 4) // площини
    dir.writeUInt16LE(32, e + 6) // біт на піксель
    dir.writeUInt32LE(images[i].length, e + 8)
    dir.writeUInt32LE(offset, e + 12)
    offset += images[i].length
  })
  return Buffer.concat([dir, ...images])
}

await mkdir(OUT, { recursive: true })
const pngs = { '32x32.png': 32, '128x128.png': 128, '128x128@2x.png': 256, 'icon.png': 512 }
for (const [name, size] of Object.entries(pngs)) await render(size).toFile(`${OUT}/${name}`)
await writeFile(`${OUT}/icon.ico`, await buildIco([16, 24, 32, 48, 64, 128, 256]))
console.log('Іконки згенеровано в', OUT)
