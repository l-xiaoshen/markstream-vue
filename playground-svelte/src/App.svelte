<script lang="ts">
  import SettingsPanel from './components/SettingsPanel.svelte'
  import { usePlaygroundRoute } from './composables/usePlaygroundRoute.svelte'
  import { usePlaygroundSettings } from './composables/usePlaygroundSettings.svelte'
  import HomePage from './pages/HomePage.svelte'
  import TestLabPage from './pages/TestLabPage.svelte'

  const route = usePlaygroundRoute()
  const settings = usePlaygroundSettings()
</script>

<div class:dark={settings.isDark} class="playground-root playground-shell">
  <div class="playground-bg">
    <div class="playground-bg__orb playground-bg__orb--1"></div>
    <div class="playground-bg__orb playground-bg__orb--2"></div>
    <div class="playground-bg__orb playground-bg__orb--3"></div>
  </div>

  <SettingsPanel {settings} />

  {#if route.isTest}
    <TestLabPage {route} {settings} />
  {:else}
    <HomePage {route} {settings} />
  {/if}
</div>
