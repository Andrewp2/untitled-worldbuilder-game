import { BATTERY_CAPACITY, materials, type Cost, type Material, type Supplies, type Blueprint } from '../core/catalog';
import { modelPortrait, partColors } from './toy-models';

const icons: Record<string, string> = {
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
  question: '<path d="M8 8a4 4 0 1 1 6 3.5c-1.5.8-2 1.5-2 3M12 20h.01"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  music: '<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
  musicOff: '<path d="M9 18v-6m0-6V5l11-2v13M14 7l6-1M3 3l18 18"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  soundOff: '<path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  restart: '<path d="M4 9a8 8 0 1 1 0 7M4 4v5h5"/>',
  focus: '<circle cx="12" cy="12" r="5"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  overview: '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"/>',
  minus: '<path d="M5 12h14"/>', plus: '<path d="M5 12h14M12 5v14"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .5-1.5 1-1.5 2M12 17h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  beacon: '<path d="M12 11v10M8 21h8M8 4a6 6 0 0 0 0 10m8-10a6 6 0 0 1 0 10"/><circle cx="12" cy="9" r="2"/>',
  flag: '<path d="M5 22V3m0 0 14 3-14 5"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.8 1.2 6.9-6.2-3.3-6.2 3.3L7 14.1 2 9.3l6.9-1z"/>',
  pickup: '<path d="M12 16V3m-5 5 5-5 5 5M4 14v7h16v-7"/>',
  drop: '<path d="M12 3v13m-5-5 5 5 5-5M4 14v7h16v-7"/>',
  dig: '<path d="m16 3-7 10M13 2l6 4M8 12l6 4-3 4c-2 3-8 0-7-3zM2 22h20"/>',
  fill: '<path d="m7 3 11 5-5 7-9-4zM13 16v4m-4-3v3m8-4v4M2 22h20"/>',
  push: '<path d="M3 12h12m-5-5 5 5-5 5M18 5h4v14h-4"/>',
  uproot: '<path d="M12 21V7m-5 5 5-5 5 5M4 20h3m10 0h3M5 5l7-3 7 3"/>',
  plant: '<path d="M12 3v14m-5-5 5 5 5-5M3 20h18"/>',
  move: '<path d="m5 3 14 9-7 2-3 7z"/>',
  dismantle: '<path d="m4 4 6 6m4 4 6 6M14 4a5 5 0 0 0-5 7l-6 6a3 3 0 0 0 4 4l6-6a5 5 0 0 0 7-5l-4 2-4-4z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
  wait: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  emptyBattery: '<rect x="3" y="6" width="16" height="12" rx="2"/><path d="M22 10v4M8 9l6 6m0-6-6 6"/>',
  swap: '<path d="M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4"/>',
  cargo: '<path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4m-9 4v10M7 5l10 5"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM12 7v9m-4-5h8"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="15" cy="17" r="3" fill="currentColor"/>',
  build: '<path d="m3 8 9-5 9 5-9 5zM3 8v9l9 5 9-5V8M12 13v9"/><path d="M8 6v5m8-5v5"/>',
};
export const icon = (name: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
export const mapFlag = (bonus: boolean) => `<svg class="map-flag" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M9 36V5" stroke="#f5ffd8" stroke-width="3" stroke-linecap="round"/><g class="flag-cloth"><path d="M10 7c8-4 13 5 22 1v18c-9 4-14-5-22-1z" fill="#ffda51"/>${bonus ? '<path d="m21 10 2 4 4.4.7-3.2 3.1.8 4.4-4-2.1-4 2.1.8-4.4-3.2-3.1 4.4-.7z" fill="#193960"/>' : ''}</g></svg>`;
const modelImage = (name: string, className: string) => '<img class="' + className + '" src="' + (modelPortrait(name) ?? import.meta.env.BASE_URL + 'art/toy-world/' + name + '.png') + '" alt="" aria-hidden="true" draggable="false" />';
export const roverIcon = (heavy: boolean) => modelImage(heavy ? 'hauler-se' : 'scout-se', 'rover-icon');
export const relayIcon = () => modelImage('relay', 'relay-icon');
export const wardenIcon = () => modelImage('warden-se', 'rover-icon');
export const blueprintIcon = (kind: Blueprint) => kind === 'relay' ? relayIcon() : modelImage(`${kind}-se`, 'rover-icon');
export const treeCargoIcon = () => `<span class="resource-icon" aria-hidden="true">${modelImage('tree-small', 'resource-picture')}</span>`;

export function actionArt(action: string): string {
  if (action === 'move') return '<svg class="action-pointer" viewBox="0 0 32 32" aria-hidden="true"><path d="m8 3 19 16-10 2-5 9z" fill="#ffe36a" stroke="#173558" stroke-width="2" stroke-linejoin="round"/></svg>';
  if (action === 'push') return `<span class="action-picture" aria-hidden="true">${modelImage('rocks', 'resource-picture')}${icon('push')}</span>`;
  if (action === 'uproot' || action === 'plant') return `<span class="action-picture" aria-hidden="true">${modelImage('tree-small', 'resource-picture')}${icon(action)}</span>`;
  const terrain = action === 'dig' || action === 'fill';
  const down = action === 'drop' || action === 'fill';
  return `<span class="action-picture" aria-hidden="true">${terrain ? resourceIcon('soil') : resourceIcon('red')}${terrain ? '' : resourceIcon('blue')}<svg viewBox="0 0 32 32"><path d="${down ? 'M12 3h8v14h7L16 29 5 17h7z' : 'M12 29h8V15h7L16 3 5 15h7z'}" fill="#ffe36a" stroke="#173558" stroke-width="1.5" stroke-linejoin="round"/></svg></span>`;
}

export function resourceIcon(kind: Material | 'battery' | 'soil', charge = BATTERY_CAPACITY): string {
  const fraction = Math.max(0, Math.min(1, charge / BATTERY_CAPACITY));
  const image = materials.includes(kind as Material) && !modelPortrait(kind)
    ? `<svg class="resource-picture" viewBox="0 0 32 32"><path d="m3 13 13-7 13 7-13 7zM3 13v9l13 7 13-7v-9L16 20v9" fill="#${partColors[kind as Material].toString(16)}" stroke="#173558" stroke-width="1"/></svg>`
    : modelImage(kind, 'resource-picture');
  return '<span class="resource-icon' + (kind === 'battery' ? ' resource-battery' + (!charge ? ' is-empty' : '') : '') + '" aria-hidden="true" style="--charge:' + fraction * 100 + '%">' + image + (kind === 'battery' ? '<i></i>' : '') + '</span>';
}
export function costIcons(cost: Cost): string {
  return [...materials, 'battery' as const].filter(kind => cost[kind] > 0)
    .map(kind => `<span class="resource-count" title="${cost[kind]} ${kind}">${resourceIcon(kind)}<b>${cost[kind]}</b></span>`).join('');
}
export function cargoSlots(supplies: Supplies, capacity: number): string {
  if (capacity > 8) return [
    ...materials.filter(kind => supplies[kind]).map(kind => `<span class="resource-count" title="${supplies[kind]} ${kind}">${resourceIcon(kind)}<b>${supplies[kind]}</b></span>`),
    ...(supplies.batteries.length ? [`<span class="resource-count" title="Battery charges: ${supplies.batteries.join(', ')}">${resourceIcon('battery', Math.max(...supplies.batteries))}<b>${supplies.batteries.length}</b></span>`] : []),
    ...(supplies.soil ? [`<span class="resource-count" title="${supplies.soil} dirt">${resourceIcon('soil')}<b>${supplies.soil}</b></span>`] : []),
  ].join('');
  const parts = [
    ...materials.flatMap(kind => Array.from({length:supplies[kind]}, () => ({kind, charge:BATTERY_CAPACITY, title:kind}))),
    ...supplies.batteries.map(charge => ({kind:'battery' as const, charge, title:`Battery: ${charge}/${BATTERY_CAPACITY}`})),
    ...Array.from({ length: supplies.soil ?? 0 }, () => ({ kind: 'soil' as const, charge: BATTERY_CAPACITY, title: 'Dirt' })),
  ];
  return Array.from({length:capacity}, (_, i) => `<span class="cargo-slot${parts[i] ? ' filled' : ''}" title="${parts[i]?.title ?? 'Empty cargo slot'}">${parts[i] ? resourceIcon(parts[i].kind, parts[i].charge) : ''}</span>`).join('');
}
