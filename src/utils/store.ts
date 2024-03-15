import { StoreApi, useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { inject } from './inject.ts';
import { useMemo } from 'react';

/**
 * Initializes a Zustand store with the provided initial state, utilizing immer middleware.
 *
 */
export function initStore<TState extends any>(initialStateDraft: TState) {
  const initialState: TState = { ...(initialStateDraft as any) };
  const store = createStore<TState, [['zustand/immer', never]]>(immer(set => initialState));

  // Define shortcut getters for each property in initialState
  for (const key in initialState) {
    if ((initialState as any).hasOwnProperty(key)) {
      Object.defineProperty(store, key, {
        get() {
          return store.getState()[key];
        },
      });
    }
  }

  // Create a reactive hook for React components
  const useState = createBoundedUseStore(store);
  (store as any).useState = useState;

  // ensure we have correct types
  return store as typeof store & { useState: typeof useState } & Readonly<typeof initialStateDraft>;
}

/**
 * Creates a custom useStore hook that is bound to a specific Zustand store instance.
 *
 * @template S The store API type.
 * @param store The Zustand store instance to bind the hook to.
 * @returns A custom hook bound to the provided store instance.
 */
const createBoundedUseStore = (store => (selector, equals) =>
  useStore(store, selector as never, equals)) as <S extends StoreApi<unknown>>(
  store: S,
) => {
  (): ExtractState<S>;
  <T>(selector: (state: ExtractState<S>) => T, equals?: (a: T, b: T) => boolean): T;
};

/**
 * Extracts the state type from a given Zustand store API.
 *
 * @template S The store API type.
 */
type ExtractState<S> = S extends { getState: () => infer X } ? X : never;

/**
 * useService creates an action object derived from a service class.
 * Optionally, it allows for the extension of these actions based on the original actions.
 *
 * @param {new () => TService} ServiceClass - The service class from which actions are to be derived.
 * @param {(actions: TService) => TExtend} [extend] - Optional function to derive extended actions based on the original ones.
 * @param {any[]} [deps=[]] - Dependencies to ensure the callbacks are recreated when needed.
 *
 * @returns {TService & TExtend} - An object containing both the original and extended actions.
 */
export function useService<TService, TExtend = {}>(
  ServiceClass: new () => TService,
  extend?: (actions: TService) => TExtend,
  deps: any[] = []
): TService & TExtend {

  return useObjectWithActions(() => inject(ServiceClass)) as TService & TExtend;
}



export function useObjectWithActions<T>(factory: () => T, deps: any[]): T {

  return useMemo(() => {

    const obj = factory();
    const objCopy = { ...obj };

    // Fetch the action names from the prototype of the service instance.
    const actionNames = Object.getOwnPropertyNames(
      Object.getPrototypeOf(obj)
    );

    // const actions: Record<string, any> = {};

    // Loop through the action names and bind them to the service instance.
    for (const actionName of actionNames) {
      // Skip the constructor and any non-function properties.
      if (actionName == 'constructor') continue;
      if (!(obj as any)[actionName].bind) {
        Object.defineProperty(objCopy, actionName, {
          get : function () {
            return (obj as any)[actionName];
          }
        });
        continue;
      }
      (objCopy as any)[actionName] = (obj as any)[actionName].bind(
        obj
      );
    }

    return objCopy as T;

  }, deps);
}
