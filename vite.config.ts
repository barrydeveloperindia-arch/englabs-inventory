/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// @ts-ignore
import obfuscator from 'rollup-plugin-obfuscator';

export default defineConfig(({ mode }) => {
  const isProd = false; // Temporarily disable for debugging build failure

  return {
    plugins: [
      react(),
      /* VitePWA({ ... }), */
      /* obfuscator({ ... }) */
    ],
    // @ts-ignore
    test: {
      globals: true,
      testTimeout: 30000,
      retry: 2,
      environment: 'jsdom',
      setupFiles: './setupTests.ts',
      css: true,
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/native/**',
        '**/tests/visual/**',
        '**/tests/security/**'
      ],
      alias: {
        '\\.(css|less|scss|sass)$': path.resolve(process.cwd(), 'tests/mocks/cssStub.js'),
        'react-native': path.resolve(process.cwd(), 'tests/mocks/reactNativeMock.ts'),
        'expo-router': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'twrnc': path.resolve(process.cwd(), 'tests/mocks/twrncMock.js'),
        '@react-navigation/native': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        '@react-navigation/bottom-tabs': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        '@react-navigation/stack': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        '@react-navigation/native-stack': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        '@react-navigation/elements': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        '@react-navigation/routers': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'expo-font': path.resolve(process.cwd(), 'tests/mocks/reactNativeMock.ts'),
        'expo-splash-screen': path.resolve(process.cwd(), 'tests/mocks/splashScreenMock.js'),
        'expo-status-bar': path.resolve(process.cwd(), 'tests/mocks/reactNativeMock.ts'),
        'expo-constants': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'expo-linking': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'expo-blur': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'expo-haptics': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'expo-symbols': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'expo-system-ui': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'expo-image': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'expo-linear-gradient': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        '@expo/vector-icons': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        '@expo-google-fonts/playfair-display': path.resolve(process.cwd(), 'tests/mocks/reactNativeMock.ts'),
        '@expo-google-fonts/inter': path.resolve(process.cwd(), 'tests/mocks/reactNativeMock.ts'),
        '@react-native-community/netinfo': path.resolve(process.cwd(), 'tests/mocks/netInfoMock.js'),
        '@react-native-async-storage/async-storage': path.resolve(process.cwd(), 'tests/mocks/reactNativeMock.ts'),
        'react-native-safe-area-context': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'react-native-reanimated': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'react-native-gesture-handler': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'react-native-screens': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'react-native-svg': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'react-native-maps': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
        'lucide-react-native': path.resolve(process.cwd(), 'tests/mocks/expoRouterMock.js'),
      },
      server: {
        deps: {
          inline: [
            'expo-router',
            'expo-font',
            'expo-splash-screen',
            '@react-native-community/netinfo',
            'twrnc',
            'react-native-web',
            '@react-navigation/native',
            '@react-navigation/bottom-tabs',
            '@react-navigation/stack'
          ]
        }
      }
    },
    server: {
      host: true,
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProd,
      chunkSizeWarningLimit: 2000,
      target: 'esnext' // Support top-level await
    },
    resolve: {
      alias: {
        'react-native': 'react-native-web',
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
    },
  };
});
