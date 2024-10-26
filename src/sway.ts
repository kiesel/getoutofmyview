// see sway-ipc(7)
export interface ContainerEvent {
  change: 'new' | 'close' | 'focus' | 'title' | 'fullscreen_mode' | 'move' | 'floating' | 'urgent' | 'mark';
  container: Container;
}

export interface Container {
  id: number;
  type: string;
  orientation: string;
  percent: number;
  urgent: boolean;
  marks: any[];
  focused: boolean;
  layout: string;
  border: string;
  current_border_width: number;
  rect: Rect;
  deco_rect: Rect;
  window_rect: Rect;
  geometry: Rect;
  name: string;
  window: null;
  nodes: any[];
  floating_nodes: any[];
  focus: any[];
  fullscreen_mode: number;
  sticky: boolean;
  pid: number;
  app_id: string;
  visible: boolean;
  max_render_time: number;
  shell: string;
  inhibit_idle: boolean;
  idle_inhibitors: IdleInhibitors;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IdleInhibitors {
  user: string;
  application: string;
}
