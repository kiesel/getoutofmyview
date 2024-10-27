import { SwayEventListener, SwayWorkspaces } from './sway-listener.js';
import { Container, WindowEvent, Workspace } from './sway.js';

enum Position {
  TOP_LEFT = 'TOP_LEFT',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
}

function isFloatingWindow(container: Container): boolean {
  return container.type === 'floating_con' && container.sticky === true && container.visible === true;
}

function deriveMonitorCorner(container: Container, workspace: Workspace): Position {
  const distances: [Position, number][] = [
    [Position.TOP_LEFT, container.rect.topleft().distance(workspace.rect.topleft())],
    [Position.TOP_RIGHT, container.rect.topright().distance(workspace.rect.topright())],
    [Position.BOTTOM_LEFT, container.rect.bottomleft().distance(workspace.rect.bottomleft())],
    [Position.BOTTOM_RIGHT, container.rect.bottomright().distance(workspace.rect.bottomright())],
  ];

  let nearest: [Position, number] = [Position.TOP_LEFT, Infinity];
  for (const d of distances) {
    console.log(d);

    if (d[1] < nearest[1]) {
      nearest = d;
    }
  }

  console.log('Nearest: ', nearest);
  return nearest[0];
}

async function main() {
  const ws = new SwayWorkspaces();
  await ws.readWorkspaces();

  const listener = new SwayEventListener();

  listener.on('window', (event: WindowEvent) => {
    console.log(event);
    if (event.change !== 'focus') {
      return;
    }

    if (isFloatingWindow(event.container)) {
      deriveMonitorCorner(event.container, ws.current());
    }
  });

  listener.on('error', (data: any) => {
    console.log(data);
  });

  return listener.run();
}

await main();
