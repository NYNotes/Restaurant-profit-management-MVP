import { createElement, type ComponentType } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, vi } from "vitest";

// Exercise real React state without a browser or mocked hooks. Calling the
// rendered handlers lets rejection tests await errors instead of leaking them
// as unhandled event-handler promises.
let renderer: ReactTestRenderer | undefined;
beforeEach(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterEach(async () => {
  if (renderer) await act(async () => renderer!.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

export async function mount<P extends object>(component: ComponentType<P>, props: P) {
  await act(async () => { renderer = create(createElement(component, props)); });
  return renderer!;
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
