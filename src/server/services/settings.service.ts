/**
 * Settings service
 * Handles user settings persistence
 */

import { prisma } from '../config/database.js';
import type { Settings } from '@prisma/client';
import type { UserSettings } from '@shared/types/index.js';

/** Default client settings */
export const defaultSettings: UserSettings = {
  timeFormat: 'HH:mm',
  enabledTypes: ['PRIVMSG', 'NOTICE', 'JOIN', 'PART', 'QUIT', 'KICK', 'NICK', 'MODE', 'TOPIC', 'ACTION'],
  disabledTypes: [],
  highlights: [],
  plugins: [],
  activePlugins: [],
  notifyPm: false,
};

/**
 * Get user settings
 */
export async function getSettings(userId: string): Promise<UserSettings> {
  const settings = await prisma.settings.findUnique({
    where: { userId },
  });

  if (!settings) {
    return defaultSettings;
  }

  try {
    return JSON.parse(settings.settings) as UserSettings;
  } catch {
    return defaultSettings;
  }
}

/**
 * Save user settings
 */
export async function saveSettings(
  userId: string,
  settings: UserSettings
): Promise<Settings> {
  const settingsJson = JSON.stringify(settings);
  return prisma.settings.upsert({
    where: { userId },
    update: { settings: settingsJson },
    create: { userId, settings: settingsJson },
  });
}

/**
 * Get settings as JSON string (for rendering)
 */
export async function getSettingsJson(userId: string): Promise<string> {
  const settings = await getSettings(userId);
  return JSON.stringify(settings);
}
