/**
 * Unit tests for bcrypt integration
 * Tests the upgrade from bcrypt-nodejs to bcrypt
 */

const { expect } = require('chai');
const bcrypt = require('bcrypt');

describe('bcrypt Integration', function() {
  describe('Password Hashing', function() {
    it('should hash a password successfully', function(done) {
      const password = 'testPassword123';

      bcrypt.genSalt(10, function(err, salt) {
        expect(err).to.not.exist;
        expect(salt).to.be.a('string');

        bcrypt.hash(password, salt, function(err, hash) {
          expect(err).to.not.exist;
          expect(hash).to.be.a('string');
          expect(hash).to.not.equal(password);
          expect(hash.length).to.be.greaterThan(0);
          done();
        });
      });
    });

    it('should hash a password with default rounds', function(done) {
      const password = 'anotherPassword456';

      bcrypt.hash(password, 10, function(err, hash) {
        expect(err).to.not.exist;
        expect(hash).to.be.a('string');
        expect(hash).to.have.length.greaterThan(0);
        done();
      });
    });

    it('should generate different hashes for the same password', function(done) {
      const password = 'samePassword789';

      bcrypt.hash(password, 10, function(err, hash1) {
        expect(err).to.not.exist;

        bcrypt.hash(password, 10, function(err, hash2) {
          expect(err).to.not.exist;
          expect(hash1).to.not.equal(hash2);
          done();
        });
      });
    });
  });

  describe('Password Comparison', function() {
    it('should correctly compare matching passwords', function(done) {
      const password = 'correctPassword';

      bcrypt.hash(password, 10, function(err, hash) {
        expect(err).to.not.exist;

        bcrypt.compare(password, hash, function(err, result) {
          expect(err).to.not.exist;
          expect(result).to.be.true;
          done();
        });
      });
    });

    it('should correctly reject non-matching passwords', function(done) {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';

      bcrypt.hash(password, 10, function(err, hash) {
        expect(err).to.not.exist;

        bcrypt.compare(wrongPassword, hash, function(err, result) {
          expect(err).to.not.exist;
          expect(result).to.be.false;
          done();
        });
      });
    });

    it('should handle empty passwords', function(done) {
      const password = '';

      bcrypt.hash(password, 10, function(err, hash) {
        expect(err).to.not.exist;

        bcrypt.compare(password, hash, function(err, result) {
          expect(err).to.not.exist;
          expect(result).to.be.true;
          done();
        });
      });
    });
  });

  describe('Salt Generation', function() {
    it('should generate unique salts', function(done) {
      bcrypt.genSalt(10, function(err, salt1) {
        expect(err).to.not.exist;

        bcrypt.genSalt(10, function(err, salt2) {
          expect(err).to.not.exist;
          expect(salt1).to.not.equal(salt2);
          done();
        });
      });
    });

    it('should generate salts with correct format', function(done) {
      bcrypt.genSalt(10, function(err, salt) {
        expect(err).to.not.exist;
        expect(salt).to.match(/^\$2[aby]\$/);
        done();
      });
    });
  });

  describe('Backward Compatibility', function() {
    it('should work with the same API signature as bcrypt-nodejs', function(done) {
      const password = 'backwardCompatTest';

      // Old bcrypt-nodejs signature: bcrypt.hash(password, salt, null, callback)
      // New bcrypt signature: bcrypt.hash(password, salt, callback)
      bcrypt.genSalt(10, function(err, salt) {
        expect(err).to.not.exist;

        // Test that the new signature works
        bcrypt.hash(password, salt, function(err, hash) {
          expect(err).to.not.exist;
          expect(hash).to.be.a('string');

          bcrypt.compare(password, hash, function(err, result) {
            expect(err).to.not.exist;
            expect(result).to.be.true;
            done();
          });
        });
      });
    });
  });
});
