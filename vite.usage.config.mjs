import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{outDir:'src',emptyOutDir:false,minify:true,lib:{entry:'src/usage-panel/panel.tsx',name:'CodexWallpapersUsage',formats:['iife'],fileName:()=> 'usage-panel.bundle.js'},rolldownOptions:{output:{assetFileNames:'usage-panel.bundle.[ext]'}}}});
