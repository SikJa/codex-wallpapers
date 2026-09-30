import fs from 'node:fs/promises';
import path from 'node:path';
import {atomicJSON} from './library.mjs';

export async function readPreferences(base) {
  try {
    const value=JSON.parse(await fs.readFile(path.join(base,'preferences.json'),'utf8'));
    return valid(value)?value:null;
  } catch(error) { if(error.code==='ENOENT'||error instanceof SyntaxError)return null;throw error; }
}
const valid=value=>value?.schema===1&&Number.isFinite(value.updatedAt)&&value.updatedAt>0&&value.settings&&typeof value.settings==='object'&&!Array.isArray(value.settings);
export async function persistPreferences(base,value) {
  if(!valid(value))return false;
  const old=await readPreferences(base);
  if(old&&old.updatedAt>=value.updatedAt)return false;
  await atomicJSON(path.join(base,'preferences.json'),value);
  return true;
}
