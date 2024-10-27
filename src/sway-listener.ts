import child_process from 'child_process';
import EventEmitter from 'events';
import { Container, WindowEvent as WindowEvent, Workspace, WorkspaceEvent } from './sway.js';

export declare interface SwayListener {
  on(event: 'window', listener: (event: WindowEvent) => void): this;
  on(event: 'workspace', listener: (event: WorkspaceEvent) => void): this;
}

export class SwayEventListener extends EventEmitter {
  eventNames(): (string | symbol)[] {
    return ['window', 'workspace'];
  }

  async run() {
    console.log('Spawning swaymsg...');
    const process = child_process.spawn('swaymsg', ['--monitor', '--type', 'subscribe', '["window", "workspace"]']);

    process.stdout.on('data', (chunk: any) => {
      if (chunk instanceof Buffer) {
        try {
          const data = this.readSwayObject(chunk);

          switch (data.type) {
            case 'WindowEvent': {
              this.emit('window', data);
              break;
            }

            case 'WorkspaceEvent': {
              this.emit('workspace', data);
              break;
            }

            default: {
              this.emit('error', data);
              break;
            }
          }
        } catch (err: unknown) {
          console.error(err);
        }
      }
    });

    process.stderr.on('data', (chunk: any) => {
      console.error(chunk);
    });

    return process;
  }

  private readSwayObject(chunk: Buffer): WindowEvent | WorkspaceEvent {
    const data = JSON.parse(chunk.toString());
    if (this.isWindowEvent(data)) {
      return { type: 'WindowEvent', change: data.change, container: new Container(data.container) };
    }

    if (this.isWorkspaceEvent(data)) {
      return {
        type: 'WorkspaceEvent',
        change: data.change,
        old: data.old ? new Workspace(data.old) : data.old,
        current: data.current ? new Workspace(data.current) : data.current,
      };
    }

    throw new Error('Trying to read unsupported object');
  }

  private isWindowEvent(data: any): boolean {
    return 'object' === typeof data && data !== null && data['change'] !== undefined && data['container'] !== undefined;
  }

  private isWorkspaceEvent(data: any): boolean {
    return (
      'object' === typeof data &&
      data !== null &&
      data['change'] !== undefined &&
      data['old'] !== undefined &&
      data['current'] !== undefined
    );
  }
}

export class SwayWorkspaces {
  private workspaces?: Record<number, Workspace> = undefined;

  async readWorkspaces() {
    return new Promise<void>((resolve, reject) => {
      const process = child_process.spawn('swaymsg', ['--type', 'get_workspaces']);

      let strBuf = '';
      process.stdout.on('data', (chunk: any) => {
        if (chunk instanceof Buffer) {
          strBuf += chunk.toString();
        }
      });

      process.once('exit', (code: number) => {
        if (code !== 0) {
          reject(new Error(`Exit code: ${code}`));
        }

        const workspaces = JSON.parse(strBuf);
        if (!Array.isArray(workspaces)) {
          reject(new Error('Not reading array'));
        }

        this.workspaces = {};
        for (let workspace of workspaces) {
          this.workspaces[workspace.id] = new Workspace(workspace);
        }

        resolve();
      });
    });
  }

  workspace(id: number): Workspace | undefined {
    if (this.workspaces === undefined) {
      throw new Error('Not initialized');
    }

    return this.workspaces[id];
  }

  current(): Workspace {
    if (this.workspaces === undefined) {
      throw new Error('Not initialized');
    }

    const workspace = Object.values(this.workspaces).find((workspace) => workspace.focused === true);
    if (undefined === workspace) {
      throw new Error('No current workspace?');
    }

    return workspace;
  }
}
