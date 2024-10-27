import child_process from 'child_process';
import EventEmitter from 'events';
import { Container, Point, WindowEvent as WindowEvent, Workspace, WorkspaceEvent } from './sway.js';

export declare interface SwayEventListener {
  on(event: 'window', listener: (event: WindowEvent) => void): this;
  on(event: 'workspace', listener: (event: WorkspaceEvent) => void): this;
  on(event: 'error', listener: (error: any) => void): this;
}

export class SwayEventListener extends EventEmitter {
  private handle?: child_process.ChildProcessWithoutNullStreams;

  eventNames(): (string | symbol)[] {
    return ['window', 'workspace', 'error'];
  }

  listen() {
    this.handle = child_process.spawn('swaymsg', ['--monitor', '--type', 'subscribe', '["window", "workspace"]']);

    this.handle.stdout.on('data', (chunk: any) => {
      if (chunk instanceof Buffer) {
        try {
          const data = this.readSwayObject(chunk);
          console.log(data);

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

    this.handle.stderr.on('data', (chunk: any) => {
      console.error(chunk);
    });

    this.handle.once('exit', (code) => {
      this.handle = undefined;
    });
  }

  close() {
    this.handle?.kill('SIGINT');
  }

  async moveWindow(id: number, position: Point) {
    return this.swayCommand(`[con_id = ${id}] move position ${position.x} px ${position.y} px`);
  }

  async focusWindow(id: number) {
    return this.swayCommand(`[con_id = ${id}] focus`);
  }

  private swayCommand(cmd: string) {
    return child_process.spawn('swaymsg', [cmd]);
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
        old: Workspace.from(data.old),
        current: Workspace.from(data.current)!,
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
  private _workspaces?: Record<number, Workspace> = undefined;

  constructor(private eventListener: SwayEventListener) {}

  async initialize() {
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

        this._workspaces = {};
        for (let workspace of workspaces) {
          this._workspaces[workspace.id] = new Workspace(workspace);
        }

        this.eventListener.on('workspace', this.update.bind(this));

        resolve();
      });
    });
  }

  private update(event: WorkspaceEvent) {
    this.workspaces[event.current.id] = event.current;
  }

  private get workspaces(): Record<number, Workspace> {
    if (this._workspaces === undefined) {
      throw new Error('Not initialized');
    }
    return this._workspaces;
  }

  workspace(id: number): Workspace | undefined {
    return this.workspaces[id];
  }

  current(): Workspace {
    const workspace = Object.values(this.workspaces).find((workspace) => workspace.focused === true);
    if (undefined === workspace) {
      throw new Error('No current workspace?');
    }

    return workspace;
  }
}
