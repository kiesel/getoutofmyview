import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { SwayIpc, SwayWorkspaces } from './sway-ipc.js';
import { Container, Point, Vertex, WindowEvent, Workspace } from './sway.js';

type StrategyToken = 'clockwise' | 'counterclockwise' | 'horizontal' | 'vertical';
const STRATEGY: Record<StrategyToken, Map<Vertex, Vertex>> = {
  clockwise: new Map()
    .set(Vertex.BOTTOM_LEFT, Vertex.TOP_LEFT)
    .set(Vertex.BOTTOM_RIGHT, Vertex.BOTTOM_LEFT)
    .set(Vertex.TOP_RIGHT, Vertex.BOTTOM_RIGHT)
    .set(Vertex.TOP_LEFT, Vertex.TOP_RIGHT),

  counterclockwise: new Map()
    .set(Vertex.TOP_LEFT, Vertex.BOTTOM_LEFT)
    .set(Vertex.BOTTOM_LEFT, Vertex.BOTTOM_RIGHT)
    .set(Vertex.BOTTOM_RIGHT, Vertex.TOP_RIGHT)
    .set(Vertex.TOP_RIGHT, Vertex.TOP_LEFT),

  horizontal: new Map()
    .set(Vertex.TOP_LEFT, Vertex.TOP_RIGHT)
    .set(Vertex.TOP_RIGHT, Vertex.TOP_LEFT)
    .set(Vertex.BOTTOM_LEFT, Vertex.BOTTOM_RIGHT)
    .set(Vertex.BOTTOM_RIGHT, Vertex.BOTTOM_LEFT),

  vertical: new Map()
    .set(Vertex.BOTTOM_LEFT, Vertex.TOP_LEFT)
    .set(Vertex.TOP_LEFT, Vertex.BOTTOM_LEFT)
    .set(Vertex.BOTTOM_RIGHT, Vertex.TOP_RIGHT)
    .set(Vertex.TOP_RIGHT, Vertex.BOTTOM_RIGHT),
};

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

function applyAvoidanceStrategy(container: Container, workspace: Workspace, strategy: StrategyToken) {
  const nearestVertex = nearestWorkspaceVertex(container, workspace);
  return computeNextPosition(container, workspace, STRATEGY[strategy].get(nearestVertex)!);
}

interface ProgramArgs {
  strategy: StrategyToken;
  refocus: boolean;
}

async function main(args: ProgramArgs) {
  const listener = new SwayIpc();

  const ws = new SwayWorkspaces(listener);
  await ws.initialize();

  let focussedWindow: Container;
  listener.on('window', async (event: WindowEvent) => {
    if (event.change !== 'focus') {
      return;
    }

    if (isFloatingWindow(event.container)) {
      const moveTo = applyAvoidanceStrategy(event.container, ws.current(), args.strategy);

      await listener.moveWindow(event.container.id, moveTo);
      if (args.refocus && focussedWindow) {
        await listener.focusWindow(focussedWindow.id);
      }
    } else {
      // Remember previous focussed window for later
      focussedWindow = event.container;
    }
  });

  listener.on('error', (data: any) => {
    console.log(data);
  });

  listener.listen();
}

const args = await yargs(hideBin(process.argv))
  .options('strategy', {
    default: 'clockwise',
    choices: ['clockwise', 'counterclockwise', 'horizontal', 'vertical'],
    description: 'Set the avoidance strategy',
  })
  .options('refocus', {
    default: true,
    description: 'Whether to automatically refocus previous window when moving',
  })
  .parse();

await main(args);
