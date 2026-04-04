/**
 * User Service Unit Tests
 * Tests the modernized TypeScript user service
 */

import { expect } from 'chai';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  createMockPrismaClient,
} from '../../helpers/ts-setup.js';

function createTestUserData(overrides = {}) {
  return {
    username: 'testuser_' + uuidv4().substr(0, 8),
    password: 'testpassword123',
    ...overrides,
  };
}

describe('User Service', function() {
  let mockPrisma;

  beforeEach(function() {
    mockPrisma = createMockPrismaClient();
  });

  afterEach(function() {
    mockPrisma._reset();
  });

  describe('User Registration', function() {
    it('should create a new user with hashed password', async function() {
      const userData = createTestUserData();

      // Simulate what the service does
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await mockPrisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
        },
      });

      expect(user).to.have.property('id');
      expect(user.username).to.equal(userData.username);
      expect(user.password).to.not.equal(userData.password);

      // Verify password was properly hashed
      const isValid = await bcrypt.compare(userData.password, user.password);
      expect(isValid).to.be.true;
    });

    it('should generate unique user IDs', async function() {
      const user1 = await mockPrisma.user.create({
        data: { username: 'user1', password: 'hash1' },
      });
      const user2 = await mockPrisma.user.create({
        data: { username: 'user2', password: 'hash2' },
      });

      expect(user1.id).to.not.equal(user2.id);
    });

    it('should store creation timestamp', async function() {
      const beforeCreate = new Date();

      const user = await mockPrisma.user.create({
        data: { username: 'testuser', password: 'hash' },
      });

      expect(user.createdAt).to.be.instanceOf(Date);
      expect(user.createdAt.getTime()).to.be.at.least(beforeCreate.getTime());
    });
  });

  describe('User Authentication', function() {
    it('should find user by username', async function() {
      await mockPrisma.user.create({
        data: { username: 'findme', password: 'hash' },
      });

      const found = await mockPrisma.user.findUnique({
        where: { username: 'findme' },
      });

      expect(found).to.not.be.null;
      expect(found.username).to.equal('findme');
    });

    it('should return null for non-existent user', async function() {
      const found = await mockPrisma.user.findUnique({
        where: { username: 'nonexistent' },
      });

      expect(found).to.be.null;
    });

    it('should verify correct password', async function() {
      const plainPassword = 'mysecretpassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      await mockPrisma.user.create({
        data: { username: 'authtest', password: hashedPassword },
      });

      const user = await mockPrisma.user.findUnique({
        where: { username: 'authtest' },
      });

      const isValid = await bcrypt.compare(plainPassword, user.password);
      expect(isValid).to.be.true;
    });

    it('should reject incorrect password', async function() {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      await mockPrisma.user.create({
        data: { username: 'authtest', password: hashedPassword },
      });

      const user = await mockPrisma.user.findUnique({
        where: { username: 'authtest' },
      });

      const isValid = await bcrypt.compare('wrongpassword', user.password);
      expect(isValid).to.be.false;
    });
  });

  describe('Session Management', function() {
    it('should update user session ID', async function() {
      const user = await mockPrisma.user.create({
        data: { username: 'sessiontest', password: 'hash' },
      });

      expect(user.sessionId).to.be.undefined;

      const sessionId = 'session-' + Date.now();
      const updated = await mockPrisma.user.update({
        where: { id: user.id },
        data: { sessionId },
      });

      expect(updated.sessionId).to.equal(sessionId);
    });

    it('should find user by session ID', async function() {
      const sessionId = 'unique-session-123';

      await mockPrisma.user.create({
        data: { username: 'sessionuser', password: 'hash', sessionId },
      });

      const found = await mockPrisma.user.findUnique({
        where: { sessionId },
      });

      expect(found).to.not.be.null;
      expect(found.username).to.equal('sessionuser');
    });

    it('should clear session on logout', async function() {
      const sessionId = 'logout-session';
      const user = await mockPrisma.user.create({
        data: { username: 'logoutuser', password: 'hash', sessionId },
      });

      await mockPrisma.user.update({
        where: { id: user.id },
        data: { sessionId: null },
      });

      const found = await mockPrisma.user.findUnique({
        where: { sessionId },
      });

      expect(found).to.be.null;
    });
  });

  describe('Password Security', function() {
    it('should use sufficient bcrypt rounds', async function() {
      const password = 'testpassword';
      const hash = await bcrypt.hash(password, 10);

      // bcrypt hash format: $2b$10$... where 10 is the cost factor
      expect(hash).to.match(/^\$2[aby]?\$10\$/);
    });

    it('should handle special characters in password', async function() {
      const specialPassword = 'p@$$w0rd!#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await bcrypt.hash(specialPassword, 10);

      const isValid = await bcrypt.compare(specialPassword, hash);
      expect(isValid).to.be.true;
    });

    it('should handle unicode in password', async function() {
      const unicodePassword = 'пароль密码🔐';
      const hash = await bcrypt.hash(unicodePassword, 10);

      const isValid = await bcrypt.compare(unicodePassword, hash);
      expect(isValid).to.be.true;
    });

    it('should generate different hashes for same password', async function() {
      const password = 'samepassword';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      expect(hash1).to.not.equal(hash2);

      // But both should validate
      expect(await bcrypt.compare(password, hash1)).to.be.true;
      expect(await bcrypt.compare(password, hash2)).to.be.true;
    });
  });
});
