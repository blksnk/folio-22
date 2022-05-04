import gsap, { Power2 } from "gsap";

export const onIndexEnter = () =>
  new Promise<boolean>((resolve, reject) => {
    const tl = gsap.timeline({
      onComplete: () => resolve(true),
      onInterrupt: () => reject(true),
    });
    tl.fromTo(
      "#page__index",
      {
        x: -window.innerWidth,
        opacity: 0,
        scale: 0.7,
      },
      {
        x: 0,
        opacity: 1,
        scale: 0.7,
        duration: 0.8,
        ease: Power2.easeOut,
      }
    );
    tl.to("#page__index", {
      scale: 1,
      duration: 0.6,
      delay: 0.3,
      ease: Power2.easeInOut,
    });
  });

export const onIndexLeave = () =>
  new Promise<boolean>((resolve, reject) => {
    const tl = gsap.timeline({
      onComplete: () => resolve(true),
      onInterrupt: () => reject(true),
    });
    tl.to("#page__index", {
      scale: 0.7,
      duration: 0.6,
      ease: Power2.easeInOut,
    });
    tl.fromTo(
      "#page__index",
      {
        x: 0,
        opacity: 1,
      },
      {
        x: -window.innerWidth,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: Power2.easeIn,
      }
    );
  });

export const onInfoEnter = () =>
  new Promise<boolean>((resolve, reject) => {
    const tl = gsap.timeline({
      onComplete: () => resolve(true),
      onInterrupt: () => reject(true),
    });
    tl.fromTo(
      "#page__info",
      {
        x: window.innerWidth,
        opacity: 0,
        scale: 0.7,
      },
      {
        x: 0,
        opacity: 1,
        scale: 0.7,
        duration: 0.8,
        ease: Power2.easeOut,
      }
    );
    tl.to("#page__info", {
      scale: 1,
      duration: 0.6,
      delay: 0.3,
      ease: Power2.easeInOut,
    });
  });

export const onInfoLeave = () =>
  new Promise<boolean>((resolve, reject) => {
    const tl = gsap.timeline({
      onComplete: () => resolve(true),
      onInterrupt: () => reject(true),
    });
    tl.to("#page__info", {
      scale: 0.7,
      duration: 0.6,
      ease: Power2.easeInOut,
    });
    tl.fromTo(
      "#page__info",
      {
        x: 0,
        opacity: 1,
      },
      {
        x: window.innerWidth,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: Power2.easeIn,
      }
    );
  });
