import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // VitePWA({
        //     registerType: 'autoUpdate',
        //     includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'logo-192.png', 'logo-512.png'],
        //     manifest: {
        //         name: 'WealthFlow Portfolio Tracker',
        //         short_name: 'WealthFlow',
        //         description: 'Advanced Personal Finance & Portfolio Tracker',
        //         theme_color: '#2563eb',
        //         background_color: '#0f172a',
        //         display: 'standalone',
        //         icons: [
        //             {
        //                 src: 'logo-192.png',
        //                 sizes: '192x192',
        //                 type: 'image/png'
        //             },
        //             {
        //                 src: 'logo-512.png',
        //                 sizes: '512x512',
        //                 type: 'image/png'
        //             },
        //             {
        //                 src: 'logo-512.png',
        //                 sizes: '512x512',
        //                 type: 'image/png',
        //                 purpose: 'any maskable'
        //             }
        //         ]
        //     },
        //     workbox: {
        //         globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        //         runtimeCaching: [
        //             {
        //                 urlPattern: /^http:\/\/localhost:3000\/api\/(assets|portfolio\/history|prices\/cache)/,
        //                 handler: 'NetworkFirst',
        //                 options: {
        //                     cacheName: 'api-cache',
        //                     expiration: {
        //                         maxEntries: 50,
        //                         maxAgeSeconds: 24 * 60 * 60 // 24 hours
        //                     },
        //                     networkTimeoutSeconds: 5
        //                 }
        //             }
        //         ]
        //     }
        // })
    ],
})
