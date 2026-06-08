const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  hotspot: {
    start:     (config) => ipcRenderer.invoke('hotspot:start', config),
    stop:      ()       => ipcRenderer.invoke('hotspot:stop'),
    status:    ()       => ipcRenderer.invoke('hotspot:status'),
    configure: (config) => ipcRenderer.invoke('hotspot:configure', config),
  },
  network: {
    speed: () => ipcRenderer.invoke('network:speed'),
  },
  window: {
    minimize:    () => ipcRenderer.invoke('window:minimize'),
    maximize:    () => ipcRenderer.invoke('window:maximize'),
    close:       () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
  store: {
    get:    (key)        => ipcRenderer.invoke('store:get', key),
    set:    (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key)        => ipcRenderer.invoke('store:delete', key),
  },
  machine: {
    id:    () => ipcRenderer.invoke('machine:id'),
    label: () => ipcRenderer.invoke('machine:label'),
    info:  () => ipcRenderer.invoke('machine:info'),
  },
  settings: {
    get:  ()         => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
  },
  wifi: {
    scan:            ()       => ipcRenderer.invoke('wifi:scan'),
    adapters:        ()       => ipcRenderer.invoke('wifi:adapters'),
    connectUpstream: (config) => ipcRenderer.invoke('wifi:connect-upstream', config),
    upstreamSignal:  ()       => ipcRenderer.invoke('wifi:upstream-signal'),
  },
  ics: {
    enable:  (config) => ipcRenderer.invoke('ics:enable', config),
    disable: ()       => ipcRenderer.invoke('ics:disable'),
  },
  extender: {
    getConfig: ()       => ipcRenderer.invoke('extender:config'),
    saveConfig:(config) => ipcRenderer.invoke('extender:save', config),
  },
})
