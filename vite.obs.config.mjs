import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({plugins:[react()],root:'obs-overlay',base:'/',build:{outDir:'dist',emptyOutDir:true},define:{'process.env.NODE_ENV':JSON.stringify('production')}})
