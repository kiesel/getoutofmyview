export enum Vertex {
  TOP_LEFT = 'TOP_LEFT',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
}

// see sway-ipc(7)
export interface WindowEvent {
  type: 'WindowEvent';
  change: 'new' | 'close' | 'focus' | 'title' | 'fullscreen_mode' | 'move' | 'floating' | 'urgent' | 'mark';
  container: Container;
}

export interface WorkspaceEvent {
  type: 'WorkspaceEvent';
  change: 'init' | 'empty' | 'focus' | 'move' | 'rename' | 'urgent' | 'reload';
  old: Workspace | null;
  current: Workspace;
}

export class Container {
  id!: number;
  type!: string;
  orientation!: string;
  percent!: number;
  urgent!: boolean;
  marks!: any[];
  focused!: boolean;
  layout!: string;
  border!: string;
  current_border_width!: number;
  rect!: Rect;
  deco_rect!: Rect;
  window_rect!: Rect;
  geometry!: Rect;
  name!: string;
  window!: null;
  nodes!: any[];
  floating_nodes!: any[];
  focus!: any[];
  fullscreen_mode!: number;
  sticky!: boolean;
  pid!: number;
  app_id!: string;
  visible!: boolean;
  max_render_time!: number;
  shell!: string;
  inhibit_idle!: boolean;
  idle_inhibitors!: IdleInhibitors;

  constructor(input: any) {
    Object.assign(this, {
      ...input,
      rect: input.rect ? new Rect(input.rect) : input.rect,
      deco_rect: input.deco_rect ? new Rect(input.deco_rect) : input.deco_rect,
      window_rect: input.window_rect ? new Rect(input.window_rect) : input.window_rect,
      geometry: input.geometry ? new Rect(input.geometry_rect) : input.geometry,
    });
  }
}

export class Point {
  constructor(public x: number, public y: number) {}

  distance(to: Point): number {
    // Pythagoras
    return Math.sqrt(Math.pow(to.x - this.x, 2) + Math.pow(to.y - this.y, 2));
  }
}

export class Rect {
  x!: number;
  y!: number;
  width!: number;
  height!: number;

  constructor(input: object) {
    Object.assign(this, input);
  }

  topleft(): Point {
    return new Point(this.x, this.y);
  }

  topright(): Point {
    return new Point(this.x + this.width, this.y);
  }

  bottomleft(): Point {
    return new Point(this.x, this.y + this.height);
  }

  bottomright(): Point {
    return new Point(this.x + this.width, this.y + this.height);
  }

  byVertex(vertex: Vertex) {
    switch (vertex) {
      case Vertex.TOP_LEFT:
        return this.topleft();
      case Vertex.TOP_RIGHT:
        return this.topright();
      case Vertex.BOTTOM_LEFT:
        return this.bottomleft();
      case Vertex.BOTTOM_RIGHT:
        return this.bottomright();
    }
  }
}

export interface IdleInhibitors {
  user: string;
  application: string;
}

export class Workspace {
  id!: number;
  type!: string;
  orientation!: string;
  percent!: null;
  urgent!: boolean;
  marks!: any[];
  layout!: string;
  border!: string;
  current_border_width!: number;
  rect!: Rect;
  deco_rect!: Rect;
  window_rect!: Rect;
  geometry!: Rect;
  name!: string;
  window!: null;
  nodes!: any[];
  floating_nodes!: any[];
  focus!: number[];
  fullscreen_mode!: number;
  sticky!: boolean;
  num!: number;
  output!: string;
  representation!: string;
  focused!: boolean;
  visible!: boolean;

  constructor(input: any) {
    Object.assign(this, {
      ...input,
      rect: new Rect(input.rect),
      deco_rect: new Rect(input.deco_rect),
      window_rect: new Rect(input.window_rect),
      geometry: new Rect(input.geometry_rect),
    });
  }
}
