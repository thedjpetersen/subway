/**
 * Unit tests for UUID integration
 * Tests the upgrade from node-uuid to uuid
 */

const { expect } = require('chai');
const uuid = require('uuid');

describe('UUID Integration', function() {
  describe('UUID v1 Generation', function() {
    it('should generate valid v1 UUIDs', function() {
      const id = uuid.v1();
      expect(id).to.be.a('string');
      expect(id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique v1 UUIDs', function() {
      const id1 = uuid.v1();
      const id2 = uuid.v1();
      expect(id1).to.not.equal(id2);
    });

    it('should generate UUIDs in correct format', function() {
      const id = uuid.v1();
      const parts = id.split('-');
      expect(parts).to.have.length(5);
      expect(parts[0]).to.have.length(8);
      expect(parts[1]).to.have.length(4);
      expect(parts[2]).to.have.length(4);
      expect(parts[3]).to.have.length(4);
      expect(parts[4]).to.have.length(12);
    });
  });

  describe('UUID v4 Generation', function() {
    it('should generate valid v4 UUIDs', function() {
      const id = uuid.v4();
      expect(id).to.be.a('string');
      expect(id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique v4 UUIDs', function() {
      const id1 = uuid.v4();
      const id2 = uuid.v4();
      expect(id1).to.not.equal(id2);
    });

    it('should generate random UUIDs', function() {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(uuid.v4());
      }
      expect(ids.size).to.equal(1000);
    });
  });

  describe('Combined Usage (Session ID Pattern)', function() {
    it('should generate combined v1+v4 session IDs like in connection.js', function() {
      // Simulating the pattern: uuid.v1() + uuid.v4()
      const sessionid = uuid.v1() + uuid.v4();

      expect(sessionid).to.be.a('string');
      expect(sessionid.length).to.equal(72); // Two UUIDs (36 each) + hyphen
    });

    it('should generate unique combined session IDs', function() {
      const session1 = uuid.v1() + uuid.v4();
      const session2 = uuid.v1() + uuid.v4();

      expect(session1).to.not.equal(session2);
    });
  });

  describe('Validation', function() {
    it('should validate correct UUIDs', function() {
      const validUUID = uuid.v4();
      expect(uuid.validate(validUUID)).to.be.true;
    });

    it('should reject invalid UUIDs', function() {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        '',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        '123e4567-e89b-12d3-a456-42661417400', // too short
      ];

      invalidUUIDs.forEach(invalid => {
        expect(uuid.validate(invalid)).to.be.false;
      });
    });
  });

  describe('Version Detection', function() {
    it('should detect UUID version 1', function() {
      const id = uuid.v1();
      expect(uuid.version(id)).to.equal(1);
    });

    it('should detect UUID version 4', function() {
      const id = uuid.v4();
      expect(uuid.version(id)).to.equal(4);
    });
  });

  describe('Backward Compatibility with node-uuid', function() {
    it('should work with the same API as node-uuid', function() {
      // node-uuid used uuid.v1() and uuid.v4()
      // The modern uuid package maintains the same API
      const v1Id = uuid.v1();
      const v4Id = uuid.v4();

      expect(v1Id).to.be.a('string');
      expect(v4Id).to.be.a('string');
      expect(uuid.validate(v1Id)).to.be.true;
      expect(uuid.validate(v4Id)).to.be.true;
    });
  });
});
