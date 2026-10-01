import { attachHoldToConfirm } from './hold-to-confirm';

/** One menu action: restart the level, or hold to clear the campaign on the map. */
export function attachResetControl(button: HTMLButtonElement, actions: {
  restartLevel: () => void;
  resetProgress: () => void;
}) {
  let screen: 'world' | 'mission';
  let hold: ReturnType<typeof attachHoldToConfirm> | undefined;
  const label = button.querySelector<HTMLElement>('.reset-label')!;
  const hint = button.querySelector<HTMLElement>('.hold-hint')!;
  const restart = () => { if (screen === 'mission') actions.restartLevel(); };
  button.addEventListener('click', restart);

  function setScreen(next: 'world' | 'mission'): void {
    hold?.dispose(); hold = undefined;
    screen = next;
    const world = screen === 'world';
    label.textContent = world ? 'Reset ALL progress' : 'Restart level';
    button.setAttribute('aria-label', label.textContent);
    button.title = world
      ? 'Hold for 3 seconds to clear all completed missions and bonus stars'
      : 'Restart this level; keep completed missions and bonus stars';
    hint.hidden = !world;
    if (world) {
      button.setAttribute('aria-describedby', hint.id);
      hold = attachHoldToConfirm(button, () => {
        if (screen === 'world') actions.resetProgress();
      });
    } else button.removeAttribute('aria-describedby');
  }
  setScreen('world');
  return {
    setScreen,
    cancel: () => hold?.cancel(),
    dispose: () => { hold?.dispose(); button.removeEventListener('click', restart); },
  };
}
