const bedrock = require('bedrock-protocol');
const fs = require('fs');

if (!fs.existsSync('./captured_chunks')) {
  fs.mkdirSync('./captured_chunks');
}

console.log('Starting Raw Stream Interceptor Proxy...');

const proxy = new bedrock.Relay({
  host: '0.0.0.0',
  port: 19132,
  offline: false,
  destination: {
    host: '192.168.0.10', // Phone IP
    port: 19132,
    offline: false
  }
});

proxy.on('connect', (player) => {
  console.log('--- LINK ESTABLISHED WITH PHONE ---');

  // Intercept raw inbound packets directly from phone host
  player.inbound.on('packet', (buf) => {
    // Suppress packet parsing errors to prevent session crash
  });

  player.outbound.on('packet', (buf) => {
    // Intercept clientbound raw level_chunk packets
    player.client.on('clientbound', ({ name, params }) => {
      if (name === 'level_chunk') {
        const fileName = `./captured_chunks/chunk_${params.x}_${params.z}.json`;
        fs.writeFileSync(fileName, JSON.stringify(params));
        console.log(`[SAVED CHUNK] X: ${params.x}, Z: ${params.z}`);
      }
    });
  });
});

proxy.listen();
console.log('Proxy active on 127.0.0.1:19132. Join from PC Minecraft!');