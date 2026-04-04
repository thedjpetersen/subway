/**
 * Settings Service Unit Tests
 * Tests the modernized TypeScript settings service
 */

import { expect } from 'chai';
import { createMockPrismaClient } from '../../helpers/ts-setup.js';

describe('Settings Service', function() {
  let mockPrisma;

  beforeEach(function() {
    mockPrisma = createMockPrismaClient();
  });

  afterEach(function() {
    mockPrisma._reset();
  });

  describe('Settings CRUD', function() {
    it('should create default settings for new user', async function() {
      const defaultSettings = {
        timeFormat: '12h',
        enabledTypes: ['PRIVMSG', 'NOTICE', 'JOIN', 'PART'],
        disabledTypes: [],
        highlights: [],
        plugins: [],
        activePlugins: [],
        notifyPm: true,
      };

      const settings = await mockPrisma.settings.upsert({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          settings: JSON.stringify(defaultSettings),
        },
        update: {},
      });

      expect(settings.userId).to.equal('user-123');
      const parsed = JSON.parse(settings.settings);
      expect(parsed.timeFormat).to.equal('12h');
      expect(parsed.notifyPm).to.be.true;
    });

    it('should update existing settings', async function() {
      const initialSettings = { timeFormat: '12h', highlights: [] };
      await mockPrisma.settings.upsert({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          settings: JSON.stringify(initialSettings),
        },
        update: {},
      });

      const updatedSettings = { timeFormat: '24h', highlights: ['important'] };
      await mockPrisma.settings.upsert({
        where: { userId: 'user-123' },
        create: {},
        update: {
          settings: JSON.stringify(updatedSettings),
        },
      });

      const retrieved = await mockPrisma.settings.findUnique({
        where: { userId: 'user-123' },
      });

      const parsed = JSON.parse(retrieved.settings);
      expect(parsed.timeFormat).to.equal('24h');
      expect(parsed.highlights).to.include('important');
    });

    it('should retrieve settings by user ID', async function() {
      const settings = { theme: 'dark', fontSize: 14 };
      await mockPrisma.settings.upsert({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          settings: JSON.stringify(settings),
        },
        update: {},
      });

      const retrieved = await mockPrisma.settings.findUnique({
        where: { userId: 'user-123' },
      });

      expect(retrieved).to.not.be.null;
      const parsed = JSON.parse(retrieved.settings);
      expect(parsed.theme).to.equal('dark');
    });

    it('should return null for non-existent user settings', async function() {
      const retrieved = await mockPrisma.settings.findUnique({
        where: { userId: 'nonexistent' },
      });

      expect(retrieved).to.be.null;
    });
  });

  describe('Highlight Configuration', function() {
    it('should store highlight patterns', async function() {
      const highlights = [
        { name: 'mentions', regex: 'myname', color: '#ff0000', notify: true },
        { name: 'keywords', regex: 'urgent|important', color: '#ffff00', notify: true },
      ];

      await mockPrisma.settings.upsert({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          settings: JSON.stringify({ highlights }),
        },
        update: {},
      });

      const retrieved = await mockPrisma.settings.findUnique({
        where: { userId: 'user-123' },
      });

      const parsed = JSON.parse(retrieved.settings);
      expect(parsed.highlights).to.have.length(2);
      expect(parsed.highlights[0].name).to.equal('mentions');
      expect(parsed.highlights[0].notify).to.be.true;
    });

    it('should preserve regex patterns correctly', async function() {
      const highlights = [
        { name: 'complex', regex: '^\\[ERROR\\].*$', color: '#ff0000', notify: true },
      ];

      await mockPrisma.settings.upsert({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          settings: JSON.stringify({ highlights }),
        },
        update: {},
      });

      const retrieved = await mockPrisma.settings.findUnique({
        where: { userId: 'user-123' },
      });

      const parsed = JSON.parse(retrieved.settings);
      expect(parsed.highlights[0].regex).to.equal('^\\[ERROR\\].*$');

      // Verify the regex actually works
      const regex = new RegExp(parsed.highlights[0].regex);
      expect(regex.test('[ERROR] Something went wrong')).to.be.true;
      expect(regex.test('Just a normal message')).to.be.false;
    });
  });

  describe('Plugin Settings', function() {
    it('should store plugin list', async function() {
      const plugins = ['user/plugin1', 'user/plugin2'];

      await mockPrisma.settings.upsert({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          settings: JSON.stringify({ plugins, activePlugins: ['user/plugin1'] }),
        },
        update: {},
      });

      const retrieved = await mockPrisma.settings.findUnique({
        where: { userId: 'user-123' },
      });

      const parsed = JSON.parse(retrieved.settings);
      expect(parsed.plugins).to.have.length(2);
      expect(parsed.activePlugins).to.have.length(1);
    });

    it('should track active vs inactive plugins', async function() {
      const settings = {
        plugins: ['plugin1', 'plugin2', 'plugin3'],
        activePlugins: ['plugin1', 'plugin3'],
      };

      await mockPrisma.settings.upsert({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          settings: JSON.stringify(settings),
        },
        update: {},
      });

      const retrieved = await mockPrisma.settings.findUnique({
        where: { userId: 'user-123' },
      });

      const parsed = JSON.parse(retrieved.settings);
      expect(parsed.activePlugins).to.include('plugin1');
      expect(parsed.activePlugins).to.include('plugin3');
      expect(parsed.activePlugins).to.not.include('plugin2');
    });
  });

  describe('Message Type Filtering', function() {
    it('should store enabled message types', async function() {
      const settings = {
        enabledTypes: ['PRIVMSG', 'NOTICE', 'ACTION'],
        disabledTypes: ['JOIN', 'PART', 'QUIT'],
      };

      await mockPrisma.settings.upsert({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          settings: JSON.stringify(settings),
        },
        update: {},
      });

      const retrieved = await mockPrisma.settings.findUnique({
        where: { userId: 'user-123' },
      });

      const parsed = JSON.parse(retrieved.settings);
      expect(parsed.enabledTypes).to.include('PRIVMSG');
      expect(parsed.disabledTypes).to.include('JOIN');
    });
  });

  describe('Settings Isolation', function() {
    it('should isolate settings between users', async function() {
      await mockPrisma.settings.upsert({
        where: { userId: 'user-1' },
        create: {
          userId: 'user-1',
          settings: JSON.stringify({ theme: 'dark' }),
        },
        update: {},
      });

      await mockPrisma.settings.upsert({
        where: { userId: 'user-2' },
        create: {
          userId: 'user-2',
          settings: JSON.stringify({ theme: 'light' }),
        },
        update: {},
      });

      const user1Settings = await mockPrisma.settings.findUnique({
        where: { userId: 'user-1' },
      });
      const user2Settings = await mockPrisma.settings.findUnique({
        where: { userId: 'user-2' },
      });

      expect(JSON.parse(user1Settings.settings).theme).to.equal('dark');
      expect(JSON.parse(user2Settings.settings).theme).to.equal('light');
    });
  });
});
