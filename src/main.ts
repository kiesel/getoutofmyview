import child_process from 'child_process';

async function main() {
  console.log('Spawning swaymsg...');
  const spawn = child_process.spawn('swaymsg', ['--monitor', '--type', 'subscribe', '["window"]']);

  spawn.stdout.on('data', (chunk: any) => {
    if (chunk instanceof Buffer) {
      try {
        const data = JSON.parse(chunk.toString());
        console.log(data);
      } catch (err: unknown) {
        console.error(err);
      }
    }
  });

  spawn.stderr.on('data', (chunk: any) => {
    console.error(chunk);
  });

  return spawn;
}

await main();
