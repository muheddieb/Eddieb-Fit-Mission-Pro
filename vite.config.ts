import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'motion',
        'motion/react',
        'recharts',
        'lucide-react',
        'canvas-confetti',
      ],
      exclude: ['@google/genai'],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      hmr: isHmrDisabled
        ? false
        : {
            overlay: true,
          },
      watch: isHmrDisabled
        ? { ignored: ['**/*'] }
        : {
            usePolling: false,
            ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
          },
    },
  };
});

