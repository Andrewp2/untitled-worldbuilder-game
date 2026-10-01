const HOLD_MS = 3000;

/** A fresh, continuous hold confirms once; cancellation discards elapsed time. */
export class HoldToConfirm {
  private held = false;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(private confirm: () => void, private display: (holding: boolean) => void = () => {}) {}
  start(): void {
    if (this.held) return;
    this.held = true; this.display(true);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.display(false); this.confirm();
    }, HOLD_MS);
  }
  cancel(): void {
    if (!this.held) return;
    clearTimeout(this.timer); this.timer = undefined;
    this.held = false; this.display(false);
  }
}

export function attachHoldToConfirm(button: HTMLButtonElement, confirm: () => void): { cancel: () => void; dispose: () => void } {
  let pointer: number | null = null, key: string | null = null;
  const hint = button.querySelector<HTMLElement>('.hold-hint')!;
  button.style.setProperty('--hold-duration', `${HOLD_MS}ms`);
  const hold = new HoldToConfirm(confirm, active => {
    button.classList.toggle('holding', active);
    hint.textContent = active ? 'Keep holding…' : 'Hold 3s';
  });
  const cancel = () => { hold.cancel(); pointer = null; key = null; };
  const bindings: [EventTarget, string, EventListener][] = [];
  const on = (target: EventTarget, name: string, listener: EventListener) => {
    target.addEventListener(name, listener); bindings.push([target, name, listener]);
  };
  on(button, 'pointerdown', event => {
    const e = event as PointerEvent;
    if (!e.isPrimary || e.button !== 0 || pointer !== null || key !== null) return;
    pointer = e.pointerId; hold.start();
  });
  on(button, 'pointermove', event => {
    const e = event as PointerEvent;
    if (e.pointerId !== pointer) return;
    const rect = button.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) cancel();
  });
  on(button, 'pointerleave', () => { if (pointer !== null) cancel(); });
  for (const name of ['pointerup', 'pointercancel']) on(document, name, event => {
    if ((event as PointerEvent).pointerId === pointer) cancel();
  });
  on(button, 'keydown', event => {
    const e = event as KeyboardEvent;
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault(); e.stopPropagation();
    if (e.repeat || pointer !== null || key !== null) return;
    key = e.key; hold.start();
  });
  on(button, 'keyup', event => {
    const e = event as KeyboardEvent;
    if (e.key === key) { e.preventDefault(); e.stopPropagation(); cancel(); }
  });
  on(button, 'click', event => event.preventDefault());
  on(button, 'blur', cancel);
  on(window, 'blur', cancel);
  on(document, 'keydown', event => { if ((event as KeyboardEvent).key === 'Escape') cancel(); });
  on(document, 'visibilitychange', () => { if (document.hidden) cancel(); });
  return { cancel, dispose: () => { cancel(); for (const [target, name, listener] of bindings) target.removeEventListener(name, listener); } };
}
