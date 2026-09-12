import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
export const MAX_BYTES = 128 * 1024 * 1024;
export const formats = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm' };
export function dataRoot() {
  return path.resolve(process.env.CODEX_WALLPAPERS_DATA || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.local', 'share'), 'CodexWallpapers'));
}
export function safePath(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').includes('..')) throw Error('Invalid library path');
  const p = path.resolve(root, relative), base = path.resolve(root) + path.sep;
  if (!p.startsWith(base)) throw Error('Path outside library');
  return p;
}
export async function readLibrary(root = dataRoot()) {
  try {
    const data = JSON.parse(await fs.readFile(path.join(root, 'library.json'), 'utf8'));
    if (data.schema !== 1 || !Array.isArray(data.items)) throw Error('Unsupported library format');
    const ids = new Set();
    for (const i of data.items) {
      if (!/^[a-f0-9]{24}$/.test(i.id) || ids.has(i.id) || !formats[path.extname(i.file)] || typeof i.title !== 'string' || i.title.length > 120 || !Number.isInteger(i.size) || i.size < 1 || i.size > MAX_BYTES || !(i.width > 0 && i.height > 0)) throw Error('Invalid media entry');
      if (i.mime !== formats[path.extname(i.file)] || i.kind !== (i.mime.startsWith('video/') ? 'video' : 'image')) throw Error('Invalid media type');
      if(!/^[a-f0-9]{64}$/.test(i.sha256)||!i.sha256.startsWith(i.id)||!Number.isInteger(i.width)||!Number.isInteger(i.height)||i.width*i.height>80000000)throw Error('Invalid integrity or dimensions');
      safePath(root, i.file); safePath(root, i.preview); ids.add(i.id);
    }
    return data;
  } catch (e) { if (e.code === 'ENOENT') return { schema: 1, items: [] }; throw e; }
}
export async function atomicJSON(file, data) {
  const temp = file + '.' + crypto.randomUUID() + '.tmp';
  await fs.mkdir(path.dirname(file), { recursive: true });
  try { await fs.writeFile(temp, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' }); await fs.rename(temp, file); }
  finally { await fs.rm(temp, { force: true }); }
}
export function paletteFromRGB([r, g, b]) {
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  if(max-min<8)return {accent:'#bdc2cb',surface:'#121418',sidebar:'#101216',text:'#e8eaf0'};
  const color=[r,g,b].map(v=>(v-min)/(max-min));
  return {accent:hex(color.map(v=>150+v*70)),surface:hex(color.map(v=>15+v*10)),sidebar:hex(color.map(v=>12+v*10)),text:'#e8eaf0'};
}
export function paletteFromPixels(bytes) {
  // Prefer a meaningful colored region over the nearly black average of a wallpaper.
  const bins=Array.from({length:18},()=>({weight:0,r:0,g:0,b:0}));
  for(let i=0;i+2<bytes.length;i+=3){
    const [r,g,b]=[bytes[i],bytes[i+1],bytes[i+2]],max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    if(max<28||d<12||d/max<.18)continue;
    const h=((max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4)+6)%6;
    const weight=(d/max)**2*(.4+.6*max/255),bin=bins[Math.floor(h*3)];
    bin.weight+=weight;bin.r+=r*weight;bin.g+=g*weight;bin.b+=b*weight;
  }
  const best=bins.reduce((a,b)=>a.weight>b.weight?a:b);
  return best.weight<bytes.length/3*.001?paletteFromRGB([0,0,0]):paletteFromRGB([best.r/best.weight,best.g/best.weight,best.b/best.weight]);
}
export async function importMedia(source, { root = dataRoot(), title, ffmpeg = process.env.FFMPEG || 'ffmpeg', ffprobe = process.env.FFPROBE || 'ffprobe' } = {}) {
  const file = await fs.realpath(path.resolve(source)), extension = path.extname(file).toLowerCase(), mime = formats[extension];
  if (!mime) throw Error('Use PNG, JPG, WebP, MP4 or WebM. Scene/PKG/HTML files are not playable wallpapers.');
  const stat = await fs.stat(file);
  if (!stat.isFile() || stat.size < 1 || stat.size > MAX_BYTES) throw Error('Media must be a file between 1 byte and 128 MiB.');
  await fs.mkdir(root, { recursive: true });
  const lock = await fs.open(path.join(root, 'import.lock'), 'wx').catch(() => { throw Error('Another import is running (or left import.lock after interruption). Inspect it before removing it.'); });
  const created = [];
  try {
    const library = await readLibrary(root), bytes = await fs.readFile(file);
    const hash = crypto.createHash('sha256').update(bytes).digest('hex'), id = hash.slice(0,24);
    if (library.items.some(i => i.id === id)) return library.items.find(i => i.id === id);
    const { stdout } = await exec(ffprobe, ['-v','error','-select_streams','v:0','-show_entries','stream=width,height,codec_name:format=duration','-of','json',file], { timeout: 20000, maxBuffer: 1024*1024 });
    const probe = JSON.parse(stdout), stream = probe.streams?.[0];
    if (!stream || !stream.width || !stream.height || stream.width * stream.height > 80000000) throw Error('No supported video/image stream or excessive resolution.');
    if (mime.startsWith('video/') && !['h264','vp8','vp9','av1'].includes(stream.codec_name)) throw Error('Use H.264 MP4 or VP8/VP9/AV1 WebM; conversion is a separate agent action.');
    const output = `media/${id}${extension}`, preview = `previews/${id}.jpg`;
    await fs.mkdir(path.join(root,'media'), { recursive:true }); await fs.mkdir(path.join(root,'previews'), { recursive:true });
    // The source is never modified. Persist a content-addressed copy.
    const destination = safePath(root, output), thumb = safePath(root, preview);
    await fs.writeFile(destination, bytes, { flag:'wx' }); created.push(destination);
    created.push(thumb);
    const seek=mime.startsWith('video/')&&Number(probe.format?.duration)>2?['-ss','1']:[];
    await exec(ffmpeg, ['-v','error','-nostdin','-y',...seek,'-i',destination,'-frames:v','1','-vf','scale=480:270:force_original_aspect_ratio=decrease','-q:v','3',thumb], { timeout: 30000 });
    const sample = await exec(ffmpeg, ['-v','error','-nostdin','-i',thumb,'-frames:v','1','-vf','scale=64:64','-f','rawvideo','-pix_fmt','rgb24','pipe:1'], { encoding:'buffer', timeout:10000, maxBuffer:16384 });
    const item = { id, title:(title || path.basename(file,extension)).slice(0,120), kind:mime.startsWith('video/')?'video':'image', mime, file:output, preview, size:bytes.length, sha256:hash, width:stream.width, height:stream.height, duration:Number(probe.format?.duration)||null, palette:paletteFromPixels(sample.stdout) };
    library.items.push(item); await atomicJSON(path.join(root,'library.json'),library); return item;
  } catch (e) { for(const p of created) await fs.rm(p,{force:true}); throw e; }
  finally { await lock.close(); await fs.rm(path.join(root,'import.lock'),{force:true}); }
}
