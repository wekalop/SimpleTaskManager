import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React plugin enables JSX and React's development refresh support.
export default defineConfig({
  plugins: [react()],
});
