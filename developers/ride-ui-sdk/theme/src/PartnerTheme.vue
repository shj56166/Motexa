<script setup lang="ts">
import ThemeSettings from './ThemeSettings.vue'
import { useDashboard } from './useDashboard'

const { context, snapshot, config, draft, saving, notice, isSettings, hasCapability, orientation,
  speed, speedState, power, stateClass, themeStyle, value, display, request, save, lastActionError } = useDashboard()
const dashboardMetricKeys = ['soc', 'voltage', 'controllerRpm', 'efficiency'] as const
// Only fresh state is presented as the vehicle's current state.
const driveStatus = (key: 'vehicleGear' | 'vehicleParking') => {
  const metric = value(key)
  if (metric?.freshness !== 'fresh' || metric.value == null) return '--'
  return key === 'vehicleGear' ? ['', 'LOW', 'MIDDLE', 'HIGH'][metric.value] ?? '--'
    : metric.value === 1 ? 'P' : 'P RELEASED'
}
</script>

<template>
  <main v-if="snapshot" class="partner-theme" :class="stateClass" :style="themeStyle">
    <ThemeSettings v-if="isSettings" v-model="draft" :locale="context?.locale ?? 'en'"
      :saving="saving" :can-save="hasCapability('theme.config-patch')" :can-back="hasCapability('theme.open-picker')"
      :notice="notice" @save="save" @back="request('theme.open-picker')" />
    <template v-else>
    <header class="topbar">
      <div>
        <span class="eyebrow">PARTNER RIDE UI</span>
        <strong>{{ snapshot.scene.status.isRecording ? 'RECORDING' : 'READY' }}</strong>
      </div>
      <div class="connection" aria-label="Connection status">
        <span v-for="item in snapshot.scene.status.items" :key="item.key" :class="`is-${item.state}`">{{ item.label }}</span>
      </div>
      <div class="actions">
        <button v-if="hasCapability('theme.open-settings')" type="button" aria-label="Open theme settings" title="Open theme settings" @click="request('theme.open-settings')">&#9881;</button>
        <button v-if="hasCapability('display.set-orientation')" type="button" aria-label="Change orientation" title="Change orientation" @click="request('display.set-orientation', { mode: orientation === 'landscape' ? 'portrait' : 'landscape' })">&#8635;</button>
        <button v-if="hasCapability('ride.request-exit')" type="button" aria-label="Exit ride display" title="Exit ride display" @click="request('ride.request-exit')">&#10005;</button>
      </div>
    </header>

    <section class="hero" :data-speed-state="speedState">
      <span class="hero-label">SPEED</span>
      <div><strong>{{ speed }}</strong><small>km/h</small></div>
      <span v-if="config.showPower" class="power">{{ power }} W</span>
    </section>

    <section class="metrics" aria-label="Ride metrics">
      <article v-for="metric in dashboardMetricKeys" :key="metric" :data-freshness="value(metric)?.freshness ?? 'unavailable'">
        <span>{{ metric }}</span>
        <strong>{{ display(metric) }}</strong>
      </article>
      <article v-for="key in (['vehicleGear', 'vehicleParking'] as const)" :key="key" :data-freshness="value(key)?.freshness ?? 'unavailable'">
        <span>{{ key === 'vehicleGear' ? 'Gear' : 'Parking' }}</span>
        <strong>{{ driveStatus(key) }}</strong>
      </article>
    </section>

    </template>
    <p v-if="lastActionError" class="action-error" role="status">{{ lastActionError }}</p>
  </main>
  <main v-else class="loading" role="status">Waiting for Ride UI host...</main>
</template>
