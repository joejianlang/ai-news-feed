<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// ── Dark mode init (must run before first render) ──────────────
// Reads localStorage 'theme' key ('dark' | 'light')
// Falls back to system preference
function initTheme() {
  const saved = localStorage.getItem('admin_theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = saved === 'dark' || (!saved && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
}

onMounted(() => {
  initTheme()
  // Also listen for OS-level preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('admin_theme')) {
      document.documentElement.classList.toggle('dark', e.matches)
    }
  })
})
</script>
