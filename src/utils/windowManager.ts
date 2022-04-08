import { Transform, Vector2 } from "@/utils/layout";

interface Window {
  transform: Transform;
}

interface WindowManagerOptions {
  windows: Window[];
}

export default class WindowManager {
  windows: Window[];

  constructor(options: WindowManagerOptions) {
    this.windows = options.windows;
  }
}
