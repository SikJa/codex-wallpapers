import { importMedia, readLibrary, dataRoot } from './library.mjs';
try {
  const [command, file, ...rest] = process.argv.slice(2);
  if(command === 'import') {
    if(!file) throw Error('Usage: node src/cli.mjs import "C:/path/background.mp4" [--title "Title"]');
    const index = rest.indexOf('--title');
    console.log(JSON.stringify(await importMedia(file,{title:index>=0?rest[index+1]:undefined}),null,2));
    console.log('Imported. Run node src/apply.mjs if Codex was opened through the personalized shortcut, or use that shortcut on the next launch.');
  } else if(command === 'list') console.log(JSON.stringify(await readLibrary(),null,2));
  else if(command === 'data-dir') console.log(dataRoot());
  else throw Error('Commands: import <file> [--title <name>], list, data-dir');
} catch(e) { console.error(e.message); process.exitCode=1; }
