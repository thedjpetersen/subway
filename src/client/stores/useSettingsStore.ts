/**
 * User settings store
 * Manages user preferences and highlights
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MessageType, Highlight, UserSettings } from '@shared/types/irc.types';

interface SettingsState extends UserSettings {
  setTimeFormat: (format: string) => void;
  toggleMessageType: (type: MessageType) => void;
  addHighlight: (highlight: Highlight) => void;
  updateHighlight: (index: number, highlight: Highlight) => void;
  removeHighlight: (index: number) => void;
  togglePlugin: (pluginId: string) => void;
  setNotifyPm: (notify: boolean) => void;
  loadSettings: (settings: UserSettings) => void;
}

const defaultSettings: UserSettings = {
  timeFormat: 'HH:mm',
  enabledTypes: [
    'PRIVMSG',
    'NOTICE',
    'JOIN',
    'PART',
    'QUIT',
    'KICK',
    'NICK',
    'MODE',
    'TOPIC',
    'ACTION',
  ],
  disabledTypes: [],
  highlights: [],
  plugins: [],
  activePlugins: [],
  notifyPm: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTimeFormat: (timeFormat) =>
        set({ timeFormat }),

      toggleMessageType: (type) =>
        set((state) => {
          if (state.enabledTypes.includes(type)) {
            return {
              enabledTypes: state.enabledTypes.filter((t) => t !== type),
              disabledTypes: [...state.disabledTypes, type],
            };
          }
          return {
            disabledTypes: state.disabledTypes.filter((t) => t !== type),
            enabledTypes: [...state.enabledTypes, type],
          };
        }),

      addHighlight: (highlight) =>
        set((state) => ({
          highlights: [...state.highlights, highlight],
        })),

      updateHighlight: (index, highlight) =>
        set((state) => ({
          highlights: state.highlights.map((h, i) =>
            i === index ? highlight : h
          ),
        })),

      removeHighlight: (index) =>
        set((state) => ({
          highlights: state.highlights.filter((_, i) => i !== index),
        })),

      togglePlugin: (pluginId) =>
        set((state) => ({
          activePlugins: state.activePlugins.includes(pluginId)
            ? state.activePlugins.filter((id) => id !== pluginId)
            : [...state.activePlugins, pluginId],
        })),

      setNotifyPm: (notifyPm) =>
        set({ notifyPm }),

      loadSettings: (settings) =>
        set(settings),
    }),
    {
      name: 'subway-settings',
    }
  )
);
