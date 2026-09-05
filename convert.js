const fs = require('fs');
const path = require('path');
const { ClassicLevel } = require('classic-level');

const CHUNKS_DIR = './captured_chunks';
const OUTPUT_WORLD = './rescued_world/db';

async function convertChunks() {
  if (!fs.existsSync(CHUNKS_DIR)) {
    console.log('[!] Error: No captured_chunks folder found. Run npm start first to capture data.');
    return;
  }

  const files = fs.readdirSync(CHUNKS_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('[!] No JSON chunk files found inside ./captured_chunks/');
    return;
  }

  console.log(`[+] Found ${files.length} chunk files. Opening LevelDB database...`);

  // Open or create LevelDB storage
  const db = new ClassicLevel(OUTPUT_WORLD, { valueEncoding: 'binary' });
  await db.open();

  for (const file of files) {
    const rawData = fs.readFileSync(path.join(CHUNKS_DIR, file));
    const chunk = JSON.parse(rawData);

    // Build standard LevelDB coordinate key: [X (4 bytes LE)] [Z (4 bytes LE)]
    const xBuffer = Buffer.alloc(4);
    const zBuffer = Buffer.alloc(4);
    xBuffer.writeInt32LE(chunk.x, 0);
    zBuffer.writeInt32LE(chunk.z, 0);

    // Tag 0x31 = Version Tag, Tag 0x2F = SubChunk Data
    const versionKey = Buffer.concat([xBuffer, zBuffer, Buffer.from([0x31])]);
    const chunkKey = Buffer.concat([xBuffer, zBuffer, Buffer.from([0x2F, 0x00])]);
    const payload = Buffer.from(chunk.payload.data || chunk.payload);

    await db.put(versionKey, Buffer.from([40])); // Version 40 (modern Bedrock format)
    await db.put(chunkKey, payload);

    console.log(`[+] Converted Chunk X: ${chunk.x}, Z: ${chunk.z}`);
  }

  await db.close();
  console.log(`\n[***] Conversion complete! LevelDB saved to ${OUTPUT_WORLD} [***]`);
  console.log('[+] Copy the rescued_world folder into your Minecraft worlds directory to play.');
}

convertChunks().catch(console.error);