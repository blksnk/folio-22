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
        scale: 0.7,
      },
      {
        x: 0,
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

export const onIndexLeave = (callback?: () => void) => () =>
  new Promise<boolean>((resolve, reject) => {
    const tl = gsap.timeline({
      onComplete: () => {
        if (callback) callback();
        resolve(true);
      },
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
      },
      {
        x: -window.innerWidth,
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
        scale: 0.7,
      },
      {
        x: 0,
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
      },
      {
        x: window.innerWidth,
        duration: 0.8,
        delay: 0.3,
        ease: Power2.easeIn,
      }
    );
  });

export const hideLoaderText = (onComplete: () => void) => {
  gsap.to("#loader__progress__text", {
    y: 200,
    duration: 0.6,
    delay: 0.6,
    ease: Power2.easeIn,
    onComplete,
  });
};

export const hideLoader = (onComplete: () => void) => {
  gsap.to("#loader", {
    opacity: 0,
    duration: 0.3,
    // ease: Power2.easeIn,
    onComplete,
  });
};

export const transitionToTutorial = (onComplete: () => void) => {
  const bg = document.getElementById("loader__background");
  if (bg) {
    const size = (window.innerWidth < 600 ? 150 : 250) * 0.6;
    gsap.to(bg, {
      width: size,
      height: size,
      borderRadius: 8,
      duration: 0.6,
      ease: Power2.easeInOut,
      onComplete,
    });
  }
};

export const hideTutorial = (onComplete?: () => void) => {
  const tl = gsap.timeline({
    onComplete,
  });
  tl.to("#tutorial__box", {
    scale: 0,
    duration: 0.6,
    ease: Power2.easeIn,
  });
  tl.to("#tutorial", {
    opacity: 0,
    duration: 1.2,
  });
};
