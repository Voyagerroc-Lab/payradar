import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: "./" -> GitHub Pages gibi alt dizinlerde (/kullanici/payradar/) çalışmayı sağlar
export default defineConfig({
  base: './',
  plugins: [react()],
})
