import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Precise atlas preparation only: isolate existing alpha islands, crop, scale,
// pad, and repack. No painted pixels or invented artwork.
const root = process.cwd();
const output = path.join(root, 'public/art/toy-world');
const review = path.join(root, '.impeccable/review/toy-world-art');
const embed = '/home/andrew-peterson/.codex/skills/impeccable/scripts/embed-prompt.mjs';
const cell = 384;
const anchor = [192, 338];
const directions = ['se', 'sw', 'nw', 'ne'];
const unitRows = ['scout', 'hauler', 'warden', 'bristleback'];
const objectNames = ['tree', 'rocks', 'flag', 'alloy', 'core', 'battery', 'relay', 'connector', 'tree-small'];
const run = (cmd, args, options = {}) => execFileSync(cmd, args, { maxBuffer: 64 * 1024 * 1024, ...options });
const dimensions = file => run('identify', ['-format', '%w %h', file], { encoding: 'utf8' }).trim().split(' ').map(Number);
const decode = file => run('convert', [file, '-depth', '8', 'rgba:-']);
const encode = (raw, w, h, file) => run('convert', ['-size', `${w}x${h}`, '-depth', '8', 'rgba:-', '-define', 'png:color-type=6', '-strip', `png:${file}`], { input: raw });

function alphaBounds(raw, w, h) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (raw[(y * w + x) * 4 + 3]) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function islands(raw, w, h) {
  const seen = new Uint8Array(w * h);
  const components = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || raw[i * 4 + 3] < 64) continue;
    seen[i] = 1;
    const pixels = [i];
    let sumX = 0, sumY = 0;
    for (let n = 0; n < pixels.length; n++) {
      const p = pixels[n], x = p % w, y = Math.floor(p / w);
      sumX += x; sumY += y;
      for (const next of [x ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (next >= 0 && !seen[next] && raw[next * 4 + 3] >= 64) { seen[next] = 1; pixels.push(next); }
      }
    }
    // The real subject islands are 34k–88k pixels. Under 100 pixels are
    // isolated generation specks; dropping them leaves every subject intact.
    if (pixels.length >= 100) components.push({ pixels, centroid: [sumX / pixels.length, sumY / pixels.length] });
  }
  return components;
}

function isolate(raw, w, h, component) {
  const mask = new Uint8Array(w * h);
  // Keep original antialiasing up to 2px beyond each confident alpha island.
  // RGB and alpha inside this mask are copied verbatim from native output.
  for (const p of component.pixels) {
    const x = p % w, y = Math.floor(p / w);
    for (let yy = Math.max(0, y - 2); yy <= Math.min(h - 1, y + 2); yy++)
      for (let xx = Math.max(0, x - 2); xx <= Math.min(w - 1, x + 2); xx++) mask[yy * w + xx] = 1;
  }
  const cleaned = Buffer.alloc(raw.length);
  for (let p = 0; p < w * h; p++) if (mask[p]) raw.copy(cleaned, p * 4, p * 4, p * 4 + 4);
  const bbox = alphaBounds(cleaned, w, h);
  const cropped = Buffer.alloc(bbox.width * bbox.height * 4);
  for (let y = 0; y < bbox.height; y++) cleaned.copy(cropped, y * bbox.width * 4, ((bbox.y + y) * w + bbox.x) * 4, ((bbox.y + y) * w + bbox.x + bbox.width) * 4);
  return { raw: cropped, bbox };
}

function blit(target, targetW, raw, w, h, x, y) {
  for (let yy = 0; yy < h; yy++) raw.copy(target, ((y + yy) * targetW + x) * 4, yy * w * 4, (yy + 1) * w * 4);
}

function savePrompt(file, prompt, metadata) {
  const promptFile = path.join(review, metadata.category === 'units' ? 'unit-atlas.prompt.txt' : 'object-atlas.prompt.txt');
  run('node', [embed, file, '--prompt-file', promptFile]);
  fs.writeFileSync(`${file.replace(/\.png$/, '')}.json`, `${JSON.stringify({ generatedWith: 'Built-in imagegen', prompt, ...metadata }, null, 2)}\n`);
}

const configurations = [
  { category: 'units', source: 'unit-atlas-generated.png', columns: 4, rows: 4, names: unitRows.flatMap(name => directions.map(direction => `${name}-${direction}`)), prompt: 'unit-atlas.prompt.txt', atlas: 'units.png', sizes: unitRows.flatMap((name, row) => directions.map(() => ({ width: row === 0 ? 276 : 300 }))) },
  { category: 'objects', source: 'object-atlas-generated.png', columns: 3, rows: 3, names: objectNames, prompt: 'object-atlas.prompt.txt', atlas: 'objects.png', sizes: [{height:286,baseCentered:true},{width:292},{height:286,baseCentered:true},{width:280},{width:248},{width:280},{height:302,baseCentered:true},{width:252},{height:226,baseCentered:true}] },
];

const manifest = {
  version: 1,
  reference: '.impeccable/mocks/toy-world-study.png',
  approval: { evidence: 'User: "Yeah I like this this looks a lot better"; parent authorized carrying the approved playful toy look into the game.', note: 'The older study JSON approved:false field predates this user approval.' },
  generation: 'Built-in imagegen with approved study as reference and transparent_background:true',
  dimensions: { individualCell: [cell, cell], groundAnchor: anchor, origin: [0.5, 338/384] },
  produce: [], direct: [],
  semantic: [
    { id: 'terrain-and-coasts', implementation: 'Phaser composes terrain textures projected into isometric tile diamonds and raised earthy coast geometry beneath these cutouts.', notes: 'Owned by the parent; terrain-surfaces.png and its sidecar are preserved.', qa_status: 'needs_parent_review' },
    { id: 'shadows', implementation: 'Phaser draws independent small ground ellipses at the shared ground anchor. HTML/CSS owns roster and blueprint framing.', notes: 'These rasters contain no floor, tile, card frame, or cast shadow.', qa_status: 'accepted' },
    { id: 'cargo', implementation: 'Attach connector/core/battery textures as separate Phaser images on the Hauler bed; use its existing empty-bed art.', notes: 'No carried inventory is baked into unit sprites.', qa_status: 'accepted' },
  ],
  atlases: {},
  limitations: [
    'Native generation returned 1254×1254 rather than the requested 2048×2048. Normalized atlases repack native cutouts into larger transparent cells; they do not represent additional generated detail.',
    'Direction views are separately rendered illustrations, not guaranteed renders of one rigid 3D model. Small panel, ridge, and joint differences remain between views.',
    'Bristleback ridge counts vary slightly across views, matching the reference’s ridged silhouette. The gameplay identity remains the red six-legged creature.',
    'Ground anchor uses the lowest visible contact edge at y=338. Unit and loose-part bounds are centered horizontally; trees, flag and relay center their lower physical base at x=192.',
  ],
  execution_order: ['Generate 4×4 directional unit atlas', 'Generate 3×3 object atlas', 'Isolate alpha islands and normalize individual cells', 'Repack uniform atlases and embed exact generation prompts', 'Inspect full atlases plus game-size and roster-size previews'],
  blockers: [],
  assumptions: ['Original glossy toy materials and approved saturated palette are binding.', 'The same individual PNG textures supply game units and larger roster/blueprint imagery.', 'No new art direction or full background scene is introduced.'],
};

for (const config of configurations) {
  const source = path.join(review, 'sources', config.source);
  const [w, h] = dimensions(source);
  const raw = decode(source);
  const components = islands(raw, w, h);
  if (components.length !== config.names.length) throw new Error(`Expected ${config.names.length} islands in ${config.source}, got ${components.length}`);
  const ordered = Array(config.names.length);
  for (const component of components) {
    const column = Math.min(config.columns - 1, Math.floor(component.centroid[0] / (w / config.columns)));
    const row = Math.min(config.rows - 1, Math.floor(component.centroid[1] / (h / config.rows)));
    const index = row * config.columns + column;
    if (ordered[index]) throw new Error(`Two subjects in cell ${index}`);
    ordered[index] = component;
  }
  const atlasW = cell * config.columns, atlasH = cell * config.rows;
  const atlas = Buffer.alloc(atlasW * atlasH * 4);
  const frames = [];
  const prompt = fs.readFileSync(path.join(review, config.prompt), 'utf8');
  for (let index = 0; index < ordered.length; index++) {
    const id = config.names[index];
    const crop = isolate(raw, w, h, ordered[index]);
    const cropFile = path.join(review, 'sources', `${id}-native-cutout.png`);
    encode(crop.raw, crop.bbox.width, crop.bbox.height, cropFile);
    const size = config.sizes[index];
    const scale = size.width ? size.width / crop.bbox.width : size.height / crop.bbox.height;
    const resizedW = Math.round(crop.bbox.width * scale), resizedH = Math.round(crop.bbox.height * scale);
    const resized = run('convert', [cropFile, '-filter', 'Lanczos', '-resize', `${resizedW}x${resizedH}!`, '-depth', '8', 'rgba:-']);
    const frame = Buffer.alloc(cell * cell * 4);
    let localAnchorX = resizedW/2;
    if (size.baseCentered) {
      let minBaseX=resizedW, maxBaseX=-1;
      for (let yy=Math.floor(resizedH*0.75); yy<resizedH; yy++) for(let xx=0; xx<resizedW; xx++) if(resized[(yy*resizedW+xx)*4+3]>=64) { minBaseX=Math.min(minBaseX,xx); maxBaseX=Math.max(maxBaseX,xx); }
      localAnchorX=(minBaseX+maxBaseX+1)/2;
    }
    const x = Math.round(anchor[0] - localAnchorX), y = anchor[1] - resizedH;
    if (x < 0 || y < 0 || x + resizedW > cell || y + resizedH > cell) throw new Error(`Sprite exceeds cell: ${id}`);
    blit(frame, cell, resized, resizedW, resizedH, x, y);
    const frameFile = path.join(output, `${id}.png`);
    encode(frame, cell, cell, frameFile);
    const row = Math.floor(index / config.columns), column = index % config.columns;
    blit(atlas, atlasW, frame, cell, cell, column*cell, row*cell);
    const boundingBox = alphaBounds(frame, cell, cell);
    const metadata = { category: config.category, id, derivedFrom: `.impeccable/review/toy-world-art/sources/${config.source}`, nativeDimensions: [w,h], sourceBoundingBox: crop.bbox, dimensions: [cell,cell], row, column, atlas: config.atlas, atlasFrame: { x: column*cell, y: row*cell, width:cell, height:cell }, boundingBox, groundAnchor: anchor, origin: [0.5,338/384], normalization: { scale, width:resizedW, height:resizedH, horizontalAnchor:size.baseCentered?'Center of physical lower base':'Center of subject bounds', operation:'Native alpha-island isolation, exact crop, Lanczos resizing and transparent padding; no redrawing.' } };
    savePrompt(frameFile, prompt, metadata);
    frames.push(metadata);
    manifest.produce.push({ id, source_crop: { path: `.impeccable/review/toy-world-art/sources/${config.source}`, boundingBox: crop.bbox }, output_path: `public/art/toy-world/${id}.png`, strategy: 'Faithful generation from approved study; transparent alpha extraction; normalized atlas export', prompt_used: `public/art/toy-world/${id}.json`, dimensions: [cell,cell], format:'png', transparency:'true alpha', deviations: config.category === 'units' ? 'Minor rendered details vary across directions; see global limitations.' : 'None material to the approved toy vocabulary.', qa_status:'accepted', groundAnchor:anchor, origin:[0.5,338/384], boundingBox });
  }
  const atlasFile = path.join(output, config.atlas);
  encode(atlas, atlasW, atlasH, atlasFile);
  const atlasMetadata = { category:config.category, dimensions:[atlasW,atlasH], cellDimensions:[cell,cell], rows:config.rows, columns:config.columns, origin:[0.5,338/384], groundAnchor:anchor, frames };
  savePrompt(atlasFile, prompt, atlasMetadata);
  manifest.atlases[config.category] = { id:config.category, path:`public/art/toy-world/${config.atlas}`, output_path:`public/art/toy-world/${config.atlas}`, source_crop:`.impeccable/review/toy-world-art/sources/${config.source}`, strategy:'Uniform repack of the generated atlas after transparent alpha isolation and normalization', prompt_used:`public/art/toy-world/${config.atlas.replace(/\.png$/,'.json')}`, format:'png', transparency:'true alpha', qa_status:'accepted', deviations:'Native source was 1254×1254; normalized cell padding creates the larger sheet.', ...atlasMetadata };
}
fs.writeFileSync(path.join(output, 'manifest.json'), `${JSON.stringify(manifest,null,2)}\n`);
console.log(JSON.stringify({ output, individualFiles:manifest.produce.length, atlases:Object.values(manifest.atlases).map(a => ({path:a.path, dimensions:a.dimensions})), origin:manifest.dimensions.origin },null,2));
