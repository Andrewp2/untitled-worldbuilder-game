import Phaser from 'phaser';
import '@fontsource-variable/nunito-sans';
import './style.css';
import { GameScene, type Mode, type ViewState } from './view/GameScene';
import { icon, mapFlag, blueprintIcon, resourceIcon, cargoSlots, costIcons, actionArt, treeCargoIcon } from './view/hud-art';
import { attackEnergy, BATTERY_CAPACITY, MOVE_ENERGY, TRANSFER_ENERGY, TERRAIN_ENERGY, blueprintNames, supportsCargo, supportsAction, isMobile, usesBattery, unitKinds, describeCost, describeSupplies, load, recipes, type Blueprint } from './core/catalog';
import { GameAudio, type AudioState } from './audio/GameAudio';
import { missions, type WorldId } from './levels/missions';
import { Campaign, PROGRESS_KEY, type ProgressStorage } from './core/campaign';
import { WorldMapScene } from './view/WorldMapScene';
import { worlds } from './levels/world-map';
import { TOY_BACKGROUND } from './view/toy-art';
import { attachHoldToConfirm } from './view/hold-to-confirm';

let progressStorage: ProgressStorage | undefined;
try { progressStorage = window.localStorage; } catch { /* A blocked store does not prevent play. */ }
const campaign = new Campaign(missions.map(mission => mission.id), progressStorage);
let selectedWorld: WorldId = missions.find(mission => !campaign.completed.has(mission.id))?.world ?? 'open-sea';
document.body.dataset.screen = 'world';

const plans: Blueprint[] = [...unitKinds, 'relay'];
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="topbar">
    <nav aria-label="Game controls">
      <button id="world-map" class="header-button" aria-label="World map" title="World map" hidden>${icon('map')}</button>
      <button id="license-toggle" class="header-button license-toggle" aria-label="Builder’s license" title="Builder’s license" aria-controls="license-dialog"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 3h22v26H5z" fill="#ffdc59" stroke="#173558" stroke-width="2"/><path d="m16 7 2 4 4 .6-3 3 .7 4.4-3.7-2-3.7 2 .7-4.4-3-3 4-.6z" fill="#173558"/><path d="M10 24h12" stroke="#173558" stroke-width="2"/></svg></button>
      <button id="menu-toggle" class="header-button" aria-label="Game menu" title="Game menu" aria-expanded="false" aria-controls="game-menu">${icon('settings')}</button>
      <div id="game-menu" class="game-menu" hidden>
      <div class="menu-options">
      <button id="music-toggle" class="header-button audio-button" aria-label="Music" title="Enable music" aria-pressed="false">${icon('musicOff')}</button>
      <button id="sound-toggle" class="header-button audio-button" aria-label="Sound effects" title="Enable sound effects" aria-pressed="false">${icon('soundOff')}</button>
      <button id="restart" class="header-button" aria-label="Restart" title="Restart mission" hidden>${icon('restart')}</button>
      <button id="help-toggle" class="header-button" aria-label="Show controls" title="How to play" aria-expanded="false" aria-controls="help-panel">${icon('help')}</button>
      </div>
      <button id="reset-progress" class="reset-progress" aria-label="Reset progress" aria-describedby="reset-progress-hint" title="Hold for 3 seconds to clear completed missions and bonus stars">
        ${icon('restart')}<span>Reset progress<small id="reset-progress-hint" class="hold-hint">Hold 3s</small></span><i class="hold-meter" aria-hidden="true"></i>
      </button>
      </div>
      <button id="pause" class="header-button" aria-label="Pause" title="Pause" aria-pressed="false" hidden>${icon('pause')}</button>
    </nav>
  </header>
  <section id="world-screen" aria-label="World map">
    <div id="world-game-host" class="world-stage">
      <div id="game" tabindex="0" role="application" aria-label="Island map. Click a unit then a destination. Space chooses its cargo or work action. Escape cancels targeting. Numbers 1–9 select units. F centers the selection."><p class="loading">Preparing the island…</p></div>
      <div class="world-heading"><h1 id="world-name">Meadow Isles</h1>
        <nav class="world-navigation" aria-label="Worlds">
          <button id="previous-world" class="header-button" aria-label="Previous world" title="Previous world">${icon('left')}</button>
          <button id="next-world" class="header-button" aria-label="Next world" title="Next world">${icon('right')}</button>
          <span id="world-progress" class="world-progress" aria-live="polite"></span>
        </nav>
      </div>
      <nav class="mission-locations" aria-label="Missions" hidden>${worlds.flatMap(world => world.locations).map(location => {
        const mission = missions.find(mission => mission.id === location.id)!;
        return `<button id="location-${mission.id}" class="mission-location" data-mission="${mission.id}" aria-label="Play ${mission.name}"><span class="location-marker">${icon('question')}</span><span class="location-order" aria-hidden="true">${missions.indexOf(mission) + 1}</span><span class="location-name">${mission.name}</span></button>`;
      }).join('')}</nav>
    </div>
  </section>
  <main id="mission-screen" hidden>
    <aside class="sidebar" aria-label="Mission and rovers">
      <section class="mission">
        <h1 id="mission-name">Hollow Reach</h1>
        <p id="mission-goal" class="mission-objective" aria-live="polite">Reach the Shore flag</p>
        <div id="objective-progress" class="objective-progress" aria-label="Goal progress"></div>
      </section>
      <div class="control-dock">
      <section id="blueprint-drawer" class="build-tray" aria-label="Blueprints">
        <h2>Blueprints</h2>
        <div class="plans">${plans.map(plan => `<button class="plan ${plan}" id="build-${plan}" ${plan === 'warden' ? 'hidden' : ''} aria-pressed="false" aria-label="Build ${blueprintNames[plan]}: ${describeCost(recipes[plan])}" title="${blueprintNames[plan]} · ${describeCost(recipes[plan])}"><span class="plan-picture">${blueprintIcon(plan)}</span><b class="plan-stock" aria-hidden="true"></b><span class="plan-cost" aria-hidden="true">${costIcons(recipes[plan])}</span></button>`).join('')}
          <button id="mode-dismantle" class="plan salvage" aria-label="Take apart tool" title="Take apart a relay or stopped rover" aria-pressed="false">${icon('dismantle')}</button>
        </div>
      </section>
      <section class="selected-panel" aria-label="Selected object">
        <div class="selected-heading"><h2 id="selected-name">Hauler</h2><span id="selected-state" role="img"></span><button id="unit-info" class="icon-button" aria-label="Unit information" title="Unit information" aria-expanded="false" aria-controls="unit-details">${icon('info')}</button></div>
        <div id="unit-details" class="detail-panel" hidden><p id="selected-description"></p><dl><div><dt>Status</dt><dd id="state-description"></dd></div><div><dt>Position</dt><dd id="position"></dd></div><div id="order-row"><dt>Order</dt><dd id="order"></dd></div></dl></div>
        <div id="cargo-row" class="cargo-row" role="img" aria-label="Cargo: empty, 0 of 4"><span class="cargo-symbol">${icon('cargo')}</span><div id="cargo" class="cargo-slots"></div><span id="cargo-count">0/4</span></div>
        <div id="battery-panel" class="battery-panel"><progress id="battery-meter" max="${BATTERY_CAPACITY}" value="${BATTERY_CAPACITY}" aria-label="Installed battery charge"></progress><button id="replace-battery" class="icon-button" aria-label="Replace battery" title="Replace battery">${icon('swap')}</button></div>
        <div class="command-strip"><div id="rover-actions" class="cargo-actions" role="group" aria-label="Rover actions">
          <button id="mode-move" title="Move to a tile" aria-pressed="true">${actionArt('move')}<span>Move</span></button>
          <button id="mode-pickup" title="Pick up parts" aria-pressed="false">${actionArt('pickup')}<span>Pick up</span></button>
          <button id="mode-drop" title="Drop off cargo" aria-pressed="false">${actionArt('drop')}<span>Drop off</span></button>
        </div>
        <div id="terrain-actions" class="terrain-actions" role="group" aria-label="Scoop terrain actions" hidden>
          <button id="mode-dig" title="Dig land to collect dirt" aria-pressed="false">${actionArt('dig')}<span>Dig</span></button>
          <button id="mode-fill" title="Fill water with dirt" aria-pressed="false">${actionArt('fill')}<span>Fill</span></button>
        </div>
        <div id="obstacle-actions" class="terrain-actions" role="group" aria-label="Obstacle work" hidden>
          <button id="mode-push" title="Push a boulder or pile one tile away" aria-pressed="false">${actionArt('push')}<span>Push</span></button>
          <button id="mode-uproot" title="Uproot a tree" aria-pressed="false">${actionArt('uproot')}<span>Uproot</span></button>
          <button id="mode-plant" title="Plant the carried tree" aria-pressed="false">${actionArt('plant')}<span>Plant</span></button>
        </div>
        </div>
        <div class="unit-actions"><button id="focus" class="icon-button" aria-label="Focus" title="Center selection (F)">${icon('focus')}</button><button id="stop" class="icon-button" aria-label="Stop" title="Stop after this step">${icon('stop')}</button><button id="take-apart" class="icon-button" aria-label="Take apart" title="Take apart: recover all parts and cargo">${icon('dismantle')}</button></div>
      </section>
      </div>
    </aside>
    <section class="play-area" aria-label="Island map">
      <div id="mission-game-host" class="map-stage">
        <div id="paused-label" hidden>Paused</div>
        <div class="camera-controls" aria-label="Camera controls">
          <button id="zoom-out" aria-label="Zoom out" title="Zoom out">${icon('minus')}</button><output id="zoom-level" aria-label="Zoom level">100%</output><button id="zoom-in" aria-label="Zoom in" title="Zoom in">${icon('plus')}</button>
          <span class="control-divider"></span><button id="camera-focus" aria-label="Center selected rover" title="Center selection (F)">${icon('focus')}</button><button id="overview" aria-label="Show whole island" title="Show whole island (Home)">${icon('overview')}</button>
        </div>
        <div class="mode-readout" id="mode-readout" hidden><span id="mode-symbol"></span><strong id="mode-name"></strong><button id="cancel-mode" class="icon-button" aria-label="Cancel action" title="Cancel (Esc)">${icon('close')}</button></div>
        <p id="tile-info" hidden></p>
        <div class="message-wrap"><p id="message" role="status" aria-live="polite" hidden></p></div>
      </div>
    </section>
  </main>
  <dialog id="completion-dialog" aria-labelledby="completion-title" aria-describedby="completion-mission">
    <div class="completion-flag" aria-hidden="true">${mapFlag(false)}</div>
    <h2 id="completion-title">Mission complete</h2>
    <p id="completion-mission"></p>
    <p id="completion-bonus" hidden></p>
    <button id="completion-map" class="completion-primary" autofocus>${icon('map')}World map</button>
    <button id="keep-exploring" class="completion-secondary">Keep exploring</button>
  </dialog>
  <dialog id="license-dialog" class="license-dialog" aria-labelledby="license-title">
    <button id="license-close" class="icon-button license-close" aria-label="Close license">${icon('close')}</button>
    <h2 id="license-title">Builder’s license</h2>
    <div id="license-portrait" class="license-portrait" aria-hidden="true"></div>
    <strong id="license-class" class="license-class"></strong>
    <p id="license-stars" class="license-stars"></p>
    <div id="license-worlds" class="license-worlds"></div>
    <p id="license-next" class="license-next"></p>
    <button id="license-print" class="completion-primary">Print license</button>
  </dialog>
  <section id="help-panel" class="help-panel" aria-label="Controls" hidden>
    <div class="help-heading"><h2>How to play</h2><button id="help-close" aria-label="Close controls">${icon('close')}</button></div>
    <p id="mission-brief" hidden></p>
    <div class="resource-key"><span>${resourceIcon('red')}Red</span><span>${resourceIcon('blue')}Blue</span><span>${resourceIcon('yellow')}Yellow</span><span>${resourceIcon('green')}Green</span><span>${resourceIcon('tires')}Tires</span><span>${resourceIcon('battery')}Battery</span><span>${resourceIcon('soil')}Dirt</span></div>
    <dl>
      <div><dt>Audio</dt><dd>Music and sound effects start off. Use the note and speaker buttons in Game menu to enable them for this tab.</dd></div>
      <div><dt>Move</dt><dd>Click a rover (or press 1–9), then its destination. It keeps going when you select another rover.</dd></div>
      <div><dt>Pick up / Drop off</dt><dd>Choose an action, then a pile or drop-off tile. The rover drives beside it to transfer cargo. Space chooses Pick up when empty or Drop off when loaded.</dd></div>
      <div><dt>Cargo</dt><dd>Hauler carries 4 parts; Scout carries 2. Pick up fills free space, taking red, blue, yellow and green parts, then tires and batteries. Each tire takes one cargo slot. Drop off unloads everything.</dd></div>
      <div><dt>Scoop</dt><dd>Dig clear grass or sand to collect 1 dirt and leave water. Fill water to turn it into land. Scoop drives beside the target first; each action costs ${TERRAIN_ENERGY} charge. Space chooses Dig when empty or Fill when loaded. Its bucket is for terrain work; use a Hauler for cargo.</dd></div>
      <div><dt>Build</dt><dd>Walk a mobile model onto a blue ground plan to collect a blueprint. Choose its picture in the toolbox, then a clear tile the model can use. Build boats and Fish in water; Marina needs shallow water. Parts must be on the ground within the 3×3 square centered on the site, including diagonals. No unit is needed nearby. Wheeled vehicles also need four tires. Each successful build uses one blueprint; taking it apart does not restore that blueprint.</dd></div>
      <div><dt>Whirlpools</dt><dd>Swirls are shallow water. Enter one to jump to its linked exit with your cargo and battery intact. Moving into the entry costs one charge; the jump costs nothing extra. Leave the exit before entering it again to jump back. A blocked exit prevents entry.</dd></div>
      <div><dt>Licenses</dt><dd>Bonus stars earn builder classes: Class 2 at 12 stars, Class 3 at 24, and Class 4 at all 36. Open the yellow license beside Game menu to view or print it. Completed worlds stamp the license; resetting progress clears it too.</dd></div>
      <div><dt>Combat</dt><dd>Move Warden beside a creature: it attacks automatically, spending ${attackEnergy('warden')} charge per hit. Creatures wander, then chase nearby rovers. Scout and Hauler cannot fight. Enemy hits drain the rover’s battery. A hit that empties it destroys the rover, leaving its parts, cargo, and an empty installed battery. Batteries carried as cargo keep their charge.</dd></div>
      <div><dt>Missions</dt><dd>Choose a location on the world map, then complete its main objective. Finishing pauses the mission: return to the world map or try the bonus. Each level has one main flag. Only after reaching it does the bonus star and its objective appear. Choose Try bonus to continue. Beat missions in map order to unlock the next one. Completed locations and earned stars are saved in this browser. Revisiting or restarting begins a fresh mission.</dd></div>
      <div><dt>Batteries</dt><dd>Charge powers movement and absorbs damage. Each rover needs a battery. Empty batteries work for building, but cannot power movement or actions. Full charge is ${BATTERY_CAPACITY}; moving costs ${MOVE_ENERGY} per tile, and each pickup or drop-off costs ${TRANSFER_ENERGY}. Using the last charge leaves an intact, powerless rover.</dd></div>
      <div><dt>Replace battery</dt><dd>Drop a battery with more charge within the rover’s 3×3 area. Stop the rover, then choose Replace battery. The old battery returns to the ground. Carried batteries keep their charge; rebuilding a rover does not refill its battery.</dd></div>
      <div><dt>Take apart</dt><dd>Select a relay or stopped rover, then Take apart to recover all parts and cargo. Or choose Take apart in the blueprint tray, then click the object.</dd></div>
      <div><dt>Stop and cancel</dt><dd>Stop ends a rover’s order after its current step. Esc cancels targeting; press it again to clear selection.</dd></div>
      <div><dt>Camera</dt><dd>Drag, WASD or arrows to pan. Scroll to zoom. F centers the selection; Home shows the whole island.</dd></div>
    </dl>
    <p>Pause stops movement and combat. You can still build and transfer cargo beside stopped rovers. Restart resets the mission.</p>
  </section>
`;

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
function updateAudioControls(state: AudioState): void {
  for (const [id, enabled, name, picture] of [
    ['music-toggle', state.musicEnabled, 'music', 'music'],
    ['sound-toggle', state.effectsEnabled, 'sound effects', 'sound'],
  ] as const) {
    const button = el<HTMLButtonElement>(id);
    button.setAttribute('aria-pressed', String(enabled));
    button.title = !state.available ? 'Audio unavailable in this browser' : `${enabled ? 'Mute' : 'Enable'} ${name}`;
    button.disabled = !state.available;
    const pictureName = enabled ? picture : `${picture}Off`;
    // Activation runs on pointerdown. Replacing an unchanged SVG there removes
    // the pressed target before pointerup and can swallow the button's click.
    if (button.dataset.audioPicture !== pictureName) {
      button.innerHTML = icon(pictureName);
      button.dataset.audioPicture = pictureName;
    }
  }
}
const audio = new GameAudio({ onChange: updateAudioControls });
updateAudioControls(audio.state);
audio.setHidden(document.hidden);
const unlockAudio = (event: Event) => {
  if (event.isTrusted) void audio.unlock();
};
const audioVisibility = () => { audio.setHidden(document.hidden); document.body.dataset.hidden = String(document.hidden); };
audioVisibility();
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('keydown', unlockAudio, { capture: true });
document.addEventListener('visibilitychange', audioVisibility);
el('menu-toggle').addEventListener('click', () => {
  const open = el('game-menu').hidden; el('game-menu').hidden = !open;
  el('menu-toggle').setAttribute('aria-expanded', String(open));
  if (!open) progressReset.cancel();
});
const labels: Record<string, string> = { idle: 'Ready', moving: 'Moving', waiting: 'Waiting for a route', fighting: 'Fighting', depleted: 'Empty battery', paused: 'Paused' };
const statusIcons: Record<string, string> = { idle:'check', moving:'move', waiting:'wait', fighting:'shield', depleted:'emptyBattery', paused:'pause' };
const displayStatus = (state: ViewState, unit: ViewState['units'][number]) => state.paused && ['moving','waiting','fighting'].includes(unit.status) ? 'paused' : unit.status;
let lastState = '', missionSignature = '';
let pausedBeforeCompletion = false;
let changingScreen = false;
let licensePromotion = '';
let pausedBeforeLicense = false;
function renderWorldProgress(): void {
  const world = worlds.find(world => world.id === selectedWorld)!;
  renderLicense();
  el('world-name').textContent = world.name;
  if (campaign.screen === 'world') document.title = `${world.name} · Untitled`;
  el('world-progress').textContent = `${world.locations.filter(pin => campaign.completed.has(pin.id)).length} / 12`;
  el('world-progress').setAttribute('aria-label', `${world.locations.filter(pin => campaign.completed.has(pin.id)).length} of 12 missions completed in ${world.name}`);
  const index = worlds.indexOf(world);
  el<HTMLButtonElement>('previous-world').disabled = index === 0;
  el<HTMLButtonElement>('next-world').disabled = index === worlds.length - 1;
  for (const [direction, target] of [['previous', worlds[index - 1]], ['next', worlds[index + 1]]] as const) {
    const button = el(`${direction}-world`);
    button.title = target?.name ?? `${direction === 'previous' ? 'First' : 'Last'} world`;
    button.setAttribute('aria-label', target ? `Show ${target.name}` : `${direction === 'previous' ? 'First' : 'Last'} world`);
  }
  for (const mission of missions) {
    const button = el<HTMLButtonElement>(`location-${mission.id}`), done = campaign.completed.has(mission.id);
    button.hidden = mission.world !== selectedWorld;
    const unlocked = campaign.isUnlocked(mission.id), bonus = campaign.bonuses.has(mission.id);
    const picture = !unlocked ? 'lock' : done ? `flag-${bonus}` : 'question';
    button.classList.toggle('locked', !unlocked);
    button.setAttribute('aria-disabled', String(!unlocked));
    button.classList.toggle('complete', done);
    if (button.dataset.picture !== picture) {
      button.querySelector('.location-marker')!.innerHTML = !unlocked ? icon('lock') : done ? mapFlag(bonus) : icon('question');
      button.dataset.picture = picture;
    }
    button.setAttribute('aria-label', `${unlocked ? done ? 'Replay' : 'Play' : 'Locked'} ${mission.name}${done ? ', completed' : ''}${bonus ? ', bonus star earned' : ''}`);
    const prerequisite = missions.slice(0, missions.indexOf(mission)).find(previous => !campaign.completed.has(previous.id));
    button.title = !unlocked ? `${mission.name} · Finish ${prerequisite!.name} first` : done ? `${mission.name} · Completed${bonus ? ' · Bonus star earned' : ''} · Play again` : `${mission.name} · ${mission.goal}`;
  }
  worldScene.setWorld(selectedWorld); worldScene.setProgress(campaign.completed);
}
function updateHud(state: ViewState): void {
  if (changingScreen || campaign.screen === 'world' || campaign.currentMission !== state.mission.id) return;
  audio.setSceneState(state.paused, state.moving);
  const signature = JSON.stringify(state);
  if (signature === lastState) return;
  lastState = signature;
  if (missionSignature !== state.mission.id) {
    missionSignature = state.mission.id;
    document.title = `${state.mission.name} · Untitled`;
    el('mission-name').textContent = state.mission.name;
    el('mission-goal').textContent = state.mission.goal;
    el('mission-brief').textContent = state.mission.brief;
    el('objective-progress').innerHTML = state.mission.goals.map(goal => `<span id="goal-${goal.id}" class="goal-marker" role="img" aria-label="${goal.name}: not reached" title="${goal.name}">${icon('flag')}</span>${goal.cargo ? `<span class="goal-manifest" role="img" aria-label="Arrive carrying ${describeCost({ ...goal.cargo, battery: goal.cargo.chargedBatteries })}${goal.cargo.chargedBatteries ? ' with charge remaining' : ''}">${costIcons({ ...goal.cargo, battery: goal.cargo.chargedBatteries })}</span>` : ''}`).join('') + `<span id="bonus-marker" class="goal-marker bonus-marker" role="img">${icon('star')}</span><span id="progress"></span>`;
    for (const plan of plans) el(`build-${plan}`).hidden = state.mission.blueprints[plan] === undefined;
  }
  const u = state.units.find(u => u.id === state.selected), relay = state.selectedRelay;
  const status = u ? displayStatus(state, u) : 'idle';
  el('selected-name').textContent = relay ? 'Signal relay' : u?.name ?? 'Select a rover';
  el('selected-state').hidden = !u;
  el('selected-state').innerHTML = icon(statusIcons[status]);
  el('selected-state').setAttribute('aria-label', labels[status]);
  el('selected-state').title = labels[status];
  el('selected-state').classList.toggle('depleted', status === 'depleted');
  el<HTMLButtonElement>('unit-info').disabled = !u && !relay;
  el('selected-description').textContent = relay ? describeCost(recipes.relay) : u?.description ?? 'Click a rover or relay.';
  el('state-description').textContent = relay ? 'Built' : u ? labels[status] : '—';
  el('position').textContent = relay?.position ?? u?.position ?? '—';
  el('order-row').hidden = !u;
  el('order').textContent = u?.order ?? 'None';
  el('cargo-row').hidden = !relay && (!u || load(u.cargo) === 0 && !u.carryingTree);
  const cargoLabel = relay ? `Returns ${describeCost(recipes.relay)}` : u?.carryingTree ? 'Carrying one tree' : u ? `Cargo: ${describeSupplies(u.cargo)}, ${load(u.cargo)} of ${u.capacity} slots` : '';
  el('cargo-row').setAttribute('aria-label', cargoLabel);
  el('cargo-row').title = cargoLabel;
  el('cargo').innerHTML = relay ? costIcons(recipes.relay) : u?.carryingTree ? treeCargoIcon() : u ? cargoSlots(u.cargo, u.capacity) : '';
  el('cargo-count').textContent = u?.carryingTree ? '1 tree' : u?.capacity ? `${load(u.cargo)}/${u.capacity}` : '';
  el('battery-panel').hidden = !u || !usesBattery(u.kind);
  el<HTMLProgressElement>('battery-meter').value = u?.battery ?? 0;
  el('battery-meter').title = `Battery: ${u?.battery ?? 0}/${BATTERY_CAPACITY}`;
  el('battery-meter').setAttribute('aria-valuetext', `${u?.battery ?? 0} of ${BATTERY_CAPACITY} charge`);
  el('battery-panel').classList.toggle('empty-battery', u?.battery === 0);
  el<HTMLButtonElement>('replace-battery').disabled = !u || !u.stationary;
  el('replace-battery').classList.toggle('available', u?.replacementCharge != null);
  el('replace-battery').title = u?.replacementCharge != null ? `Replace battery with nearby ${u.replacementCharge}/${BATTERY_CAPACITY} battery` : 'Replace battery: drop one with more charge within the surrounding 3×3 tiles';
  el('rover-actions').hidden = !u || !isMobile(u.kind);
  el('mode-move').hidden = !u || !isMobile(u.kind);
  el('stop').hidden = !u || !isMobile(u.kind);
  el<HTMLButtonElement>('stop').disabled = !u || u.stationary;
  el<HTMLButtonElement>('focus').disabled = !u && !relay;
  el<HTMLButtonElement>('camera-focus').disabled = !u && !relay;
  el('camera-focus').setAttribute('aria-label', relay ? 'Center selected relay' : 'Center selected rover');
  el<HTMLButtonElement>('take-apart').disabled = !relay && (!u || !u.stationary);
  el<HTMLButtonElement>('mode-pickup').disabled = !u || u.battery < TRANSFER_ENERGY || load(u.cargo) >= u.capacity;
  el<HTMLButtonElement>('mode-drop').disabled = !u || u.battery < TRANSFER_ENERGY || !load(u.cargo);
  el('mode-pickup').title = u && u.battery < TRANSFER_ENERGY ? `Pick up: needs ${TRANSFER_ENERGY} charge` : 'Pick up: choose a pile to collect';
  el('mode-drop').title = u && u.battery < TRANSFER_ENERGY ? `Drop off: needs ${TRANSFER_ENERGY} charge` : 'Drop off: choose a tile to unload on';
  el('mode-pickup').hidden = !u || !supportsCargo(u.kind);
  el('mode-drop').hidden = !u || !supportsCargo(u.kind);
  el('terrain-actions').hidden = u?.kind !== 'scoop';
  el('obstacle-actions').hidden = !u || !['dozer', 'arborbot'].includes(u.kind);
  for (const action of ['push', 'uproot', 'plant'] as const) {
    el(`mode-${action}`).hidden = !u || !supportsAction(u.kind, action);
    el<HTMLButtonElement>(`mode-${action}`).disabled = !u || u.battery < TERRAIN_ENERGY || action === 'uproot' && u.carryingTree || action === 'plant' && !u.carryingTree;
  }
  el('rover-actions').classList.toggle('with-terrain', u?.kind === 'scoop');
  el<HTMLButtonElement>('mode-dig').disabled = !u || u.battery < TERRAIN_ENERGY || !!load(u.cargo);
  el<HTMLButtonElement>('mode-fill').disabled = !u || u.battery < TERRAIN_ENERGY || !u.cargo.soil;
  for (const mode of ['move', 'pickup', 'drop', 'dig', 'fill', 'push', 'uproot', 'plant', 'dismantle']) el(`mode-${mode}`).setAttribute('aria-pressed', String(state.mode === mode));
  for (const plan of plans) {
    const button = el<HTMLButtonElement>(`build-${plan}`), left = state.blueprints[plan] ?? 0;
    button.hidden = state.blueprints[plan] === undefined;
    button.disabled = left === 0;
    button.querySelector('.plan-stock')!.textContent = String(left);
    button.title = `${blueprintNames[plan]} · ${left} left · ${describeCost(recipes[plan])}`;
    button.setAttribute('aria-label', `Build ${blueprintNames[plan]}, ${left} blueprint${left === 1 ? '' : 's'} left: ${describeCost(recipes[plan])}`);
    button.setAttribute('aria-pressed', String(state.mode === 'build' && state.blueprint === plan));
  }
  el('mode-readout').hidden = state.mode === 'move';
  el('mode-symbol').innerHTML = state.mode === 'build' ? blueprintIcon(state.blueprint) : icon(state.mode);
  el('mode-name').textContent = ({ move:'Move', pickup:'Pick up', drop:'Drop off', dig:'Dig', fill:'Fill', push:'Push', uproot:'Uproot', plant:'Plant', build:blueprintNames[state.blueprint], dismantle:'Take apart' })[state.mode];
  el('tile-info').hidden = !state.context;
  el('tile-info').textContent = state.context;
  el('mission-goal').textContent = state.bonus.unlocked ? state.bonus.reached ? 'Bonus star earned' : state.bonus.description : state.mission.goal;
  document.querySelectorAll<HTMLElement>('.goal-manifest').forEach(manifest => { manifest.hidden = state.complete; });
  el('bonus-marker').hidden = !state.bonus.unlocked;
  el('bonus-marker').classList.toggle('complete', state.bonus.reached);
  el('bonus-marker').title = `${state.bonus.name}: ${state.bonus.reached ? 'bonus star earned' : state.bonus.description}`;
  el('bonus-marker').setAttribute('aria-label', el('bonus-marker').title);
  el('zoom-level').textContent = `${state.zoom}%`;
  el('paused-label').hidden = !state.paused;
  el('pause').setAttribute('aria-pressed', String(state.paused));
  el('pause').setAttribute('aria-label', state.paused ? 'Resume' : 'Pause');
  el('pause').title = state.paused ? 'Resume' : 'Pause';
  el('pause').innerHTML = icon(state.paused ? 'play' : 'pause');
  el('progress').textContent = `${state.visited.length} / ${state.mission.goals.length}`;
  el('progress').setAttribute('aria-label', `${state.visited.length} of ${state.mission.goals.length} flags reached`);
  for (const { id, name } of state.mission.goals) {
    const done = state.visited.includes(id), marker = el(`goal-${id}`);
    marker.classList.toggle('complete', done);
    marker.innerHTML = icon(done ? 'check' : 'flag');
    marker.setAttribute('aria-label', `${name}: ${done ? 'reached' : 'not reached'}`);
    marker.title = marker.getAttribute('aria-label')!;
  }
  if (state.ready) document.querySelector('.loading')?.remove();
  if (state.ready && state.complete && campaign.finish(state.mission.id)) {
    pausedBeforeCompletion = state.paused;
    renderWorldProgress();
  }
  if (state.ready && state.bonus.reached) {
    const previousClass = campaign.license.class;
    if (campaign.earnBonus(state.mission.id)) {
      licensePromotion = campaign.license.class > previousClass ? `Class ${campaign.license.class} builder’s license earned!` : '';
      renderWorldProgress();
    }
  }
  if (state.ready && state.complete && !state.celebrating && (campaign.screen === 'complete' || campaign.screen === 'bonus-complete') && !el<HTMLDialogElement>('completion-dialog').open) {
    const bonusComplete = campaign.screen === 'bonus-complete';
    el('completion-title').textContent = bonusComplete ? 'Bonus complete' : 'Mission complete';
    el('completion-mission').textContent = state.mission.name;
    el('completion-bonus').hidden = false;
    el('completion-bonus').textContent = bonusComplete ? licensePromotion || 'Bonus star earned' : 'Bonus objective unlocked';
    el('keep-exploring').hidden = bonusComplete;
    el('keep-exploring').textContent = 'Try bonus';
    document.querySelector('.completion-flag')!.innerHTML = mapFlag(bonusComplete);
    el<HTMLDialogElement>('completion-dialog').showModal();
    scene.setPaused(true);
    game.scene.pause('island');
  }
}

function renderLicense(): void {
  const license = campaign.license;
  el('license-class').textContent = `Class ${license.class} Builder`;
  el('license-portrait').innerHTML = blueprintIcon(license.model);
  el('license-stars').innerHTML = `${icon('star')}<span>${license.earnedStars} / 36 bonus stars</span>`;
  el('license-next').textContent = license.nextStars === null ? 'Every bonus mastered.' : `${license.nextStars - license.earnedStars} more stars to Class ${license.class + 1}`;
  el('license-worlds').innerHTML = worlds.map(world => {
    const complete = world.locations.every(pin => campaign.completed.has(pin.id));
    return `<span class="license-stamp${complete ? ' earned' : ''}" title="${complete ? 'Completed' : 'Finish all 12 missions in'} ${world.name}">${icon(complete ? 'check' : 'map')}<span>${world.name}</span></span>`;
  }).join('');
  el('license-toggle').title = `Builder’s license · Class ${license.class} · ${license.earnedStars} bonus stars`;
}
el('license-toggle').addEventListener('click', () => {
  campaign.refresh(); renderLicense();
  pausedBeforeLicense = el('pause').getAttribute('aria-pressed') === 'true';
  if (campaign.screen === 'mission') scene.setPaused(true);
  el<HTMLDialogElement>('license-dialog').showModal();
});
el('license-close').addEventListener('click', () => el<HTMLDialogElement>('license-dialog').close());
el<HTMLDialogElement>('license-dialog').addEventListener('close', () => {
  if (!changingScreen && campaign.screen === 'mission') scene.setPaused(pausedBeforeLicense);
  focusMap();
});
el('license-print').addEventListener('click', () => window.print());

let messageTimer: ReturnType<typeof setTimeout> | undefined;
const scene = new GameScene({
  state: updateHud,
  sound: cue => audio.play(cue),
  message: (text, error = false) => {
    clearTimeout(messageTimer);
    if (error) { el('message').hidden = true; audio.play('error'); return; }
    el('message').textContent = text;
    el('message').hidden = false;
    messageTimer = setTimeout(() => { el('message').hidden = true; }, 3500);
  },
});
const worldScene = new WorldMapScene(points => {
  document.querySelector<HTMLElement>('.mission-locations')!.hidden = false;
  for (const point of points) {
    const button = el(`location-${point.id}`);
    button.style.left = `${point.x}px`; button.style.top = `${point.y}px`;
  }
  document.querySelector('.loading')?.remove();
});
worldScene.setWorld(selectedWorld);
const game = new Phaser.Game({
  type: Phaser.AUTO, parent:'game', backgroundColor:TOY_BACKGROUND, antialias:true,
  scale:{mode:Phaser.Scale.RESIZE, width:'100%', height:'100%', autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:[worldScene, scene], input:{mouse:{preventDefaultWheel:true}}, render:{roundPixels:false},
  audio:{noAudio:true}, // GameAudio owns the Web Audio context.
});
game.events.once('toy-art-ready', () => {
  for (const plan of plans) {
    const button = el('build-' + plan);
    button.querySelector('.plan-picture')!.innerHTML = blueprintIcon(plan);
    button.querySelector('.plan-cost')!.innerHTML = costIcons(recipes[plan]);
  }
  document.querySelector('.resource-key .resource-battery')!.outerHTML = resourceIcon('battery');
  document.querySelector('#help-panel .resource-key')!.innerHTML = ['red', 'blue', 'yellow', 'green', 'tires', 'battery', 'soil'].map(kind => `<span>${resourceIcon(kind as Parameters<typeof resourceIcon>[0])}${kind === 'soil' ? 'Dirt' : kind[0].toUpperCase() + kind.slice(1)}</span>`).join('');
  renderLicense();
  for (const action of ['move', 'pickup', 'drop', 'dig', 'fill', 'push', 'uproot', 'plant'] as const) el('mode-' + action).innerHTML = actionArt(action) + '<span>' + ({move:'Move',pickup:'Pick up',drop:'Drop off',dig:'Dig',fill:'Fill',push:'Push',uproot:'Uproot',plant:'Plant'}[action]) + '</span>';
});

const focusMap = () => el('game').focus({preventScroll:true});
function closeMissionPanels(): void {
  progressReset.cancel();
  clearTimeout(messageTimer); el('message').hidden = true;
  el('unit-details').hidden = true; el('help-panel').hidden = true;
  el('game-menu').hidden = true; el('menu-toggle').setAttribute('aria-expanded', 'false');
  for (const id of ['unit-info', 'help-toggle']) el(id).setAttribute('aria-expanded', 'false');
  el<HTMLDialogElement>('completion-dialog').close();
  el<HTMLDialogElement>('license-dialog').close();
}
function showScreen(screen: 'world' | 'mission'): void {
  document.body.dataset.screen = screen;
  el('world-screen').hidden = screen !== 'world'; el('mission-screen').hidden = screen !== 'mission';
  el('mission-brief').hidden = screen !== 'mission';
  for (const id of ['world-map', 'pause', 'restart']) el(id).hidden = screen === 'world';
  el(`${screen === 'world' ? 'world' : 'mission'}-game-host`).prepend(el('game'));
  el('game').setAttribute('role', screen === 'world' ? 'img' : 'application');
  el('game').tabIndex = screen === 'world' ? -1 : 0;
  el('game').setAttribute('aria-label', screen === 'world' ? 'Island world. Choose a mission using the pictured markers.' : 'Island map. Click a rover then a destination. Space targets cargo, or Dig / Fill for Scoop. Escape cancels targeting. Numbers select rovers. F centers the selection.');
  game.canvas.style.cursor = screen === 'world' ? 'default' : 'crosshair';
  // RESIZE uses cached parent bounds. Refresh them after moving the shared canvas
  // so cameras and native map markers see the new host's dimensions immediately.
  game.scale.getParentBounds();
  game.scale.refresh();
}
function startMission(id: string): void {
  if (!campaign.start(id)) return;
  closeMissionPanels();
  if (game.scene.isActive('world')) game.scene.sleep('world');
  changingScreen = true; showScreen('mission'); changingScreen = false;
  lastState = '';
  scene.loadMission(id);
  if (!game.scene.isActive('island')) game.scene.run('island');
  document.title = `${missions.find(mission => mission.id === id)!.name} · Untitled`;
  focusMap();
}
function returnToWorld(): void {
  const lastMission = campaign.currentMission;
  closeMissionPanels(); campaign.returnToMap();
  if (game.scene.isPaused('island')) game.scene.resume('island');
  game.scene.sleep('island'); showScreen('world'); game.scene.run('world'); worldScene.fit();
  audio.setSceneState(false, 0); renderWorldProgress();
  document.title = `${worlds.find(world => world.id === selectedWorld)!.name} · Untitled`;
  el(`location-${lastMission ?? worlds.find(world => world.id === selectedWorld)!.locations[0].id}`).focus({preventScroll:true});
}
function changeWorld(offset: number): void {
  const next = worlds[worlds.findIndex(world => world.id === selectedWorld) + offset];
  if (!next || campaign.screen !== 'world') return;
  selectedWorld = next.id; renderWorldProgress();
  document.title = `${next.name} · Untitled`;
}
el('previous-world').onclick = () => changeWorld(-1);
el('next-world').onclick = () => changeWorld(1);
function keepExploring(): void {
  if (!campaign.keepExploring()) return;
  el<HTMLDialogElement>('completion-dialog').close();
  el<HTMLDialogElement>('license-dialog').close();
  scene.resumeExploration();
  game.scene.resume('island'); scene.setPaused(pausedBeforeCompletion);
  if (!el<HTMLDialogElement>('completion-dialog').open) focusMap();
}
el('world-screen').onclick = event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-mission]');
  if (button) startMission(button.dataset.mission!);
};
el('world-map').onclick = returnToWorld;
el('completion-map').onclick = returnToWorld;
el('keep-exploring').onclick = keepExploring;
el<HTMLDialogElement>('completion-dialog').oncancel = event => { event.preventDefault(); if (campaign.screen === 'bonus-complete') returnToWorld(); else keepExploring(); };
renderWorldProgress();
el('game').setAttribute('role','img');
el('game').tabIndex = -1;
el('game').setAttribute('aria-label','Island world. Choose a mission using the pictured markers.');
for (const mode of ['move','pickup','drop','dig','fill','push','uproot','plant','dismantle'] as Mode[]) el(`mode-${mode}`).onclick = () => { scene.setMode(mode); focusMap(); };
for (const plan of plans) el(`build-${plan}`).onclick = () => { scene.setMode('build',plan); focusMap(); };
el('cancel-mode').onclick = () => { scene.setMode('move'); focusMap(); };
el('replace-battery').onclick = () => { scene.replaceSelectedBattery(); focusMap(); };
el('take-apart').onclick = () => { scene.dismantleSelected(); focusMap(); };
el('focus').onclick = () => scene.focusSelected();
el('camera-focus').onclick = () => scene.focusSelected();
el('stop').onclick = () => scene.stopSelected();
el('pause').onclick = () => scene.togglePause();
el('restart').onclick = () => { if (campaign.currentMission) startMission(campaign.currentMission); };
el('music-toggle').onclick = () => audio.setMusic(!audio.state.musicEnabled);
el('sound-toggle').onclick = () => audio.setEffects(!audio.state.effectsEnabled);
const progressReset = attachHoldToConfirm(el<HTMLButtonElement>('reset-progress'), () => {
  campaign.reset(); selectedWorld = 'meadow-isles'; returnToWorld();
});
el('zoom-in').onclick = () => scene.zoomBy(1.2);
el('zoom-out').onclick = () => scene.zoomBy(1/1.2);
el('overview').onclick = () => scene.overview();
function toggleDetails(buttonId: string, panelId: string): void {
  const open = el(panelId).hidden;
  el(panelId).hidden = !open;
  el(buttonId).setAttribute('aria-expanded',String(open));
}
el('unit-info').onclick = () => toggleDetails('unit-info','unit-details');
function setHelp(open: boolean): void {
  el('help-panel').hidden = !open;
  el('help-toggle').setAttribute('aria-expanded',String(open));
  if (open) el('help-close').focus(); else el('help-toggle').focus();
}
el('help-toggle').onclick = () => setHelp(el('help-panel').hidden);
el('help-close').onclick = () => setHelp(false);
const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !el('help-panel').hidden) setHelp(false);
};
document.addEventListener('keydown',onEscape);
const onProgress = (event: StorageEvent) => {
  if (event.key === PROGRESS_KEY) {
    campaign.refresh();
    if (campaign.currentMission && !campaign.isUnlocked(campaign.currentMission)) returnToWorld();
    else renderWorldProgress();
  }
};
window.addEventListener('storage', onProgress);
if (import.meta.hot) import.meta.hot.dispose(() => {
  progressReset.dispose();
  clearTimeout(messageTimer); document.removeEventListener('keydown',onEscape);
  document.removeEventListener('pointerdown', unlockAudio, { capture: true });
  document.removeEventListener('keydown', unlockAudio, { capture: true });
  document.removeEventListener('visibilitychange', audioVisibility);
  window.removeEventListener('storage', onProgress);
  audio.dispose(); game.destroy(true);
});
