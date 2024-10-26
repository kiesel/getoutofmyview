import { SwayListener } from './sway-listener.js';
import { Container } from './sway.js';

async function main() {
  const listener = new SwayListener();

  listener.on('focus', (container: Container) => {
    console.log(container);
  });

  listener.on('error', (data: any) => {
    console.log(data);
  });

  return listener.run();
}

await main();
