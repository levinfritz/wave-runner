/**
 * Minimal mock CanvasRenderingContext2D that tracks state changes.
 * Used to verify HUD/Screen rendering doesn't leak canvas state.
 */

export interface CtxCall {
  method: string;
  args: any[];
}

export function createMockCtx() {
  const calls: CtxCall[] = [];
  const state = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    font: '10px sans-serif',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalAlpha: 1,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowBlur: 0,
    lineWidth: 1,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
  };

  const stateStack: typeof state[] = [];

  const handler: ProxyHandler<any> = {
    get(_target, prop: string) {
      // Return state values
      if (prop in state) {
        return (state as any)[prop];
      }
      // save/restore
      if (prop === 'save') {
        return () => {
          stateStack.push({ ...state });
          calls.push({ method: 'save', args: [] });
        };
      }
      if (prop === 'restore') {
        return () => {
          const saved = stateStack.pop();
          if (saved) Object.assign(state, saved);
          calls.push({ method: 'restore', args: [] });
        };
      }
      // Return no-op function for all methods
      return (...args: any[]) => {
        calls.push({ method: prop, args });
      };
    },
    set(_target, prop: string, value) {
      if (prop in state) {
        (state as any)[prop] = value;
      }
      return true;
    },
  };

  const ctx = new Proxy({}, handler) as CanvasRenderingContext2D;

  return { ctx, calls, state };
}
