import { SwayEventListener, SwayWorkspaces } from './sway-listener.js';
import { Container, Point, Vertex, WindowEvent, Workspace } from './sway.js';

function isFloatingWindow(container: Container): boolean {
  return container.type === 'floating_con' && container.sticky === true && container.visible === true;
}

function nearestWorkspaceVertex(container: Container, workspace: Workspace): Vertex {
  const distances: [Vertex, number][] = [
    [Vertex.TOP_LEFT, container.rect.topleft().distance(workspace.rect.topleft())],
    [Vertex.TOP_RIGHT, container.rect.topright().distance(workspace.rect.topright())],
    [Vertex.BOTTOM_LEFT, container.rect.bottomleft().distance(workspace.rect.bottomleft())],
    [Vertex.BOTTOM_RIGHT, container.rect.bottomright().distance(workspace.rect.bottomright())],
  ];

  let nearest: [Vertex, number] = [Vertex.TOP_LEFT, Infinity];
  for (const d of distances) {
    if (d[1] < nearest[1]) {
      nearest = d;
    }
  }

  return nearest[0];
}

function nextVertex(position: Vertex): Vertex {
  const map = new Map<Vertex, Vertex>();
  map.set(Vertex.TOP_LEFT, Vertex.BOTTOM_LEFT);
  map.set(Vertex.BOTTOM_LEFT, Vertex.BOTTOM_RIGHT);
  map.set(Vertex.BOTTOM_RIGHT, Vertex.TOP_RIGHT);
  map.set(Vertex.TOP_RIGHT, Vertex.TOP_LEFT);

  return map.get(position)!;
}

function computeNextPosition(container: Container, workspace: Workspace, next: Vertex) {
  const vpoint = workspace.rect.byVertex(next);

  switch (next) {
    case Vertex.TOP_LEFT:
      return new Point(vpoint.x, vpoint.y);
    case Vertex.TOP_RIGHT:
      return new Point(vpoint.x - container.rect.width, vpoint.y);
    case Vertex.BOTTOM_LEFT:
      return new Point(vpoint.x, vpoint.y - container.rect.height);
    case Vertex.BOTTOM_RIGHT:
      return new Point(vpoint.x - container.rect.width, vpoint.y - container.rect.height);
  }
}

async function main() {
  const ws = new SwayWorkspaces();
  await ws.readWorkspaces();

  const listener = new SwayEventListener();

  listener.on('window', (event: WindowEvent) => {
    if (event.change !== 'focus') {
      return;
    }

    if (isFloatingWindow(event.container)) {
      const corner = nearestWorkspaceVertex(event.container, ws.current());
      const next = nextVertex(corner);
      const point = computeNextPosition(event.container, ws.current(), next);

      console.log('Next corner is', next);
      console.log('Next position is', point);
    }
  });

  listener.on('error', (data: any) => {
    console.log(data);
  });

  return listener.run();
}

await main();
