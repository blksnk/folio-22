import {WindowData} from "@/utils/layout.types";

export const initObserver = (cb: IntersectionObserverCallback) => {
  const observer = new IntersectionObserver(cb, {
    root: document.getElementById('page__index'),
    threshold: [ 0, 0.25, 0.5, 0.75, 1 ],
  })

  const windows = document.querySelectorAll(".window");
  windows.forEach(window => observer.observe(window));

  return observer;

}

export const updateObserverTargets = (observer: IntersectionObserver, reset: () => void, windowsToObserve: WindowData[]) => {
  observer.disconnect()
  reset()
  windowsToObserve
    .map(({ id }) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null)
    .forEach((el) => observer.observe(el))
}