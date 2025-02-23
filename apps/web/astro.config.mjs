import { defineConfig } from 'astro/config';
import vue from "@astrojs/vue";
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";


// https://astro.build/config
export default defineConfig({
  integrations: [vue(), tailwind({
    applyBaseStyles: false
  }
  )],
  output: "server",
  adapter: node({
    mode: "standalone"
  }),
  server: {
    port: 9001,
    host: "localhost"
  },
});
