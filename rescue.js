const bedrock = require('bedrock-protocol');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('====================================================');
console.log('   MINECRAFT BEDROCK WORLD RESUCE & CHUNK DUMPER    ');
console.log('====================================================\n');

rl.question('Enter Phone IP Address (e.g. 192.168.0.10): ', (targetIp) => {
  if (!targetIp.trim()) {
    console.error('[!] Error: IP Address is required.');
    process.exit(1);
  }

  const outputDir = './captured_chunks';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  console.log(`\n[+] Initializing relay targeting ${targetIp}:19132...`);
  console.log('[+] Prepare to complete Microsoft authentication if prompted.\n');

  const proxy = new bedrock.Relay({
    host: '0.0.0.0',
    port: 19132,
    offline: false,
    profilesFolder: './.auth_cache',
    destination: {
      host: targetIp.trim(),
      port: 19132,
      offline: false
    }
  });

  proxy.on('connect', (player) => {
    console.log('\n[***] SESSION ESTABLISHED WITH HOST [***]');
    console.log('[+] Intercepting inbound map payloads...\n');

    player.client.on('clientbound', ({ name, params }) => {
      if (name === 'level_chunk') {
        const fileName = `${outputDir}/chunk_${params.x}_${params.z}.json`;
        fs.writeFileSync(fileName, JSON.stringify(params));
        console.log(`[Captured Chunk] X: ${params.x}, Z: ${params.z}`);
      }
    });
  });

  proxy.listen();
  console.log('[+] Local Proxy running on 127.0.0.1:19132');
  console.log('[+] Open Minecraft on PC and join server address: 127.0.0.1:19132\n');
  
  rl.close();
});