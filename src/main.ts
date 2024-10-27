import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { SwayIpc, SwayWorkspaces } from './sway-ipc.js';
import { Container, WindowEvent, Workspace } from './sway.js';
import { applyAvoidanceStrategy, isFloatingWindow, StrategyToken } from './logic.js';

interface ProgramArgs {
  strategy: string;
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
      const moveTo = applyAvoidanceStrategy(event.container, ws.current(), args.strategy as StrategyToken);

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
