<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardConfig } from './useDashboard'

const props = defineProps<{ modelValue: DashboardConfig; locale: string; saving: boolean; canSave: boolean; canBack: boolean; notice: string }>()
const emit = defineEmits<{ 'update:modelValue': [DashboardConfig]; save: []; back: [] }>()
const zh = computed(() => props.locale.startsWith('zh'))
const update = (patch: Partial<DashboardConfig>) => emit('update:modelValue', { ...props.modelValue, ...patch })
</script>

<template>
  <section class="theme-settings" :aria-label="zh ? '主题设置' : 'Theme settings'">
    <header class="settings-header">
      <h1>{{ zh ? '主题设置' : 'Theme settings' }}</h1>
      <button v-if="canBack" type="button" @click="emit('back')">{{ zh ? '返回' : 'Back' }}</button>
    </header>
    <div class="settings-form">
      <fieldset :disabled="saving || !canSave">
        <legend>{{ zh ? '显示' : 'Display' }}</legend>
        <label class="settings-row"><span>{{ zh ? '强调色' : 'Accent color' }}</span>
          <select :value="modelValue.accent" @change="update({ accent: ($event.target as HTMLSelectElement).value as DashboardConfig['accent'] })">
            <option value="lime">{{ zh ? '青柠' : 'Lime' }}</option>
            <option value="cyan">{{ zh ? '青蓝' : 'Cyan' }}</option>
            <option value="amber">{{ zh ? '琥珀' : 'Amber' }}</option>
          </select>
        </label>
        <label class="settings-row"><span>{{ zh ? '隐藏时速小数' : 'Hide speed decimals' }}</span>
          <input type="checkbox" :checked="modelValue.hideSpeedDecimal" @change="update({ hideSpeedDecimal: ($event.target as HTMLInputElement).checked })">
        </label>
        <label class="settings-row"><span>{{ zh ? '显示功率' : 'Show power' }}</span>
          <input type="checkbox" :checked="modelValue.showPower" @change="update({ showPower: ($event.target as HTMLInputElement).checked })">
        </label>
      </fieldset>
      <p class="settings-note">{{ zh ? '时速小数跟随 App 总开关。' : 'Speed decimals also follow the app setting.' }}</p>
      <button class="settings-save" type="button" :disabled="saving || !canSave" @click="emit('save')">{{ saving ? (zh ? '保存中…' : 'Saving…') : (zh ? '保存' : 'Save') }}</button>
      <p v-if="notice" class="settings-notice" role="status">{{ notice }}</p>
    </div>
  </section>
</template>

<style scoped>
.theme-settings { width: min(100%, 32rem); margin-inline-end: auto; padding: clamp(16px, 3vw, 28px); border: 1px solid #303833; border-radius: 7px; background: #0e1210; color: #f4f7f5; }
.settings-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h1 { margin: 0; font-size: 22px; } .settings-form { margin-top: 24px; } fieldset { padding: 0; margin: 0; border: 0; } legend, .settings-note { color: #a8b4ad; font-size: 13px; } legend { margin-bottom: 8px; }
.settings-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 56px; border-bottom: 1px solid #303833; font-size: 16px; }
select, button { min-height: 44px; padding: 8px 14px; border: 1px solid #526057; border-radius: 5px; background: #111513; color: inherit; font: inherit; } select { max-width: 48%; } input { width: 24px; height: 24px; accent-color: var(--accent); } button { cursor: pointer; } :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.settings-save { width: 100%; margin-top: 12px; border-color: transparent; background: var(--accent); color: #101810; font-weight: 700; } :disabled { cursor: default; opacity: .6; } .settings-note, .settings-notice { margin-bottom: 0; line-height: 1.5; }
:global(.is-light .theme-settings) { color: #152019; background: #fff; border-color: #bdc8c0; } :global(.is-light .theme-settings .settings-row) { border-color: #bdc8c0; } :global(.is-light .theme-settings select), :global(.is-light .theme-settings .settings-header button) { background: #eef2ee; color: #152019; } :global(.is-light .theme-settings .settings-note), :global(.is-light .theme-settings legend) { color: #526057; }
</style>
