import { translateFrame } from "./layout";

export const onRouteLeave = (frameId: string) => () =>
  new Promise((resolve, reject) => {
    const el = document.getElementById(frameId);
    if (el) {
      console.log(el);
      translateFrame(el, 0);
      setTimeout(() => resolve(true), 1000);
    } else resolve(false);
  });

export const onRouteUpdate = (frameId: string) => () =>
  new Promise<boolean>((resolve, reject) => {
    const el = document.getElementById(frameId);
    if (el) {
      console.log(el);
      translateFrame(el, 1);
      setTimeout(() => resolve(true), 1000);
    } else resolve(false);
  });
