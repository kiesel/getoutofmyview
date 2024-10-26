import child_process from 'child_process';
import EventEmitter from 'events';
import { Container, ContainerEvent } from './sway.js';

export declare interface SwayListener {
  on(event: 'new', listener: (container: Container) => void): this;
  on(event: 'close', listener: (container: Container) => void): this;
  on(event: 'focus', listener: (container: Container) => void): this;
  on(event: 'title', listener: (container: Container) => void): this;
  on(event: 'fullscreen_mode', listener: (container: Container) => void): this;
  on(event: 'move', listener: (container: Container) => void): this;
  on(event: 'floating', listener: (container: Container) => void): this;
  on(event: 'urgent', listener: (container: Container) => void): this;
  on(event: 'mark', listener: (container: Container) => void): this;
  on(event: 'error', listener: (data: any) => void): this;
}

export class SwayListener extends EventEmitter {
  eventNames(): (string | symbol)[] {
    return ['new', 'close', 'focus', 'title', 'fullscreen_mode', 'move', 'floating', 'urgent', 'mark'];
  }

  async run() {
    console.log('Spawning swaymsg...');
    const process = child_process.spawn('swaymsg', ['--monitor', '--type', 'subscribe', '["window"]']);

    process.stdout.on('data', (chunk: any) => {
      if (chunk instanceof Buffer) {
        try {
          const data = JSON.parse(chunk.toString());
          if (this.isContainerEvent(data)) {
            this.emit(data.change, data.container);
          } else {
            this.emit('error', data);
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

  private isContainerEvent(data: any): data is ContainerEvent {
    return 'object' === typeof data && data !== null && data['change'] !== undefined && data['container'] !== undefined;
  }
}
