"use client";

import { useEffect } from "react";

/**
 * Registers the <pwa-action-sheet>/<pwa-camera-modal> custom elements that
 * @capacitor/camera's web fallback renders into when there's no native runtime
 * (i.e. testing in a regular browser). No-op inside the native iOS app, where
 * the plugin talks to the real camera directly.
 */
export function PwaElementsInit() {
  useEffect(() => {
    import("@ionic/pwa-elements/loader").then(({ defineCustomElements }) => defineCustomElements(window));
  }, []);
  return null;
}
