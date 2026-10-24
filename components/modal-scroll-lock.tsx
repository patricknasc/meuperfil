"use client";

import { useEffect } from "react";

/**
 * Render inside an open modal: freezes the page and the dashboard <main>
 * scroller so wheel/touch scrolling only moves the modal.
 */
export function ModalScrollLock() {
  useEffect(() => {
    const targets = [document.documentElement, document.body, ...Array.from(document.querySelectorAll("main"))];
    const previous = targets.map((el) => el.style.overflow);
    targets.forEach((el) => {
      el.style.overflow = "hidden";
    });
    return () => {
      targets.forEach((el, i) => {
        el.style.overflow = previous[i];
      });
    };
  }, []);

  return null;
}
