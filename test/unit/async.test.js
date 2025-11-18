/**
 * Unit tests for async library upgrade
 * Tests the upgrade from async 0.2.x to 3.x
 */

const { expect } = require('chai');
const async = require('async');

describe('Async Library Integration', function() {
  describe('Waterfall Pattern', function() {
    it('should execute functions in series passing results', function(done) {
      async.waterfall([
        function(callback) {
          callback(null, 'one', 'two');
        },
        function(arg1, arg2, callback) {
          expect(arg1).to.equal('one');
          expect(arg2).to.equal('two');
          callback(null, 'three');
        },
        function(arg1, callback) {
          expect(arg1).to.equal('three');
          callback(null, 'done');
        }
      ], function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.equal('done');
        done();
      });
    });

    it('should handle errors in waterfall', function(done) {
      async.waterfall([
        function(callback) {
          callback(null, 'value');
        },
        function(arg, callback) {
          callback(new Error('Test error'));
        },
        function(arg, callback) {
          // This should not be called
          callback(null, 'should not reach');
        }
      ], function(err, result) {
        expect(err).to.exist;
        expect(err.message).to.equal('Test error');
        expect(result).to.be.undefined;
        done();
      });
    });

    it('should work with subway.js initialization pattern', function(done) {
      let step1Complete = false;
      let step2Complete = false;
      let step3Complete = false;

      async.waterfall([
        function(callback) {
          // Simulate plugin initialization
          step1Complete = true;
          callback(null);
        },
        function(callback) {
          // Simulate bower install
          step2Complete = true;
          callback(null, 'results');
        },
        function(results, callback) {
          // Simulate static compilation
          step3Complete = true;
          callback(null);
        }
      ], function(err, result) {
        expect(err).to.not.exist;
        expect(step1Complete).to.be.true;
        expect(step2Complete).to.be.true;
        expect(step3Complete).to.be.true;
        done();
      });
    });
  });

  describe('Series Execution', function() {
    it('should execute tasks in series', function(done) {
      const order = [];

      async.series([
        function(callback) {
          order.push(1);
          callback(null, 'one');
        },
        function(callback) {
          order.push(2);
          callback(null, 'two');
        },
        function(callback) {
          order.push(3);
          callback(null, 'three');
        }
      ], function(err, results) {
        expect(err).to.not.exist;
        expect(order).to.deep.equal([1, 2, 3]);
        expect(results).to.deep.equal(['one', 'two', 'three']);
        done();
      });
    });
  });

  describe('Parallel Execution', function() {
    it('should execute tasks in parallel', function(done) {
      const startTimes = {};
      const endTimes = {};

      async.parallel([
        function(callback) {
          startTimes.task1 = Date.now();
          setTimeout(() => {
            endTimes.task1 = Date.now();
            callback(null, 'one');
          }, 50);
        },
        function(callback) {
          startTimes.task2 = Date.now();
          setTimeout(() => {
            endTimes.task2 = Date.now();
            callback(null, 'two');
          }, 50);
        }
      ], function(err, results) {
        expect(err).to.not.exist;
        expect(results).to.deep.equal(['one', 'two']);

        // Both tasks should start at roughly the same time
        expect(Math.abs(startTimes.task1 - startTimes.task2)).to.be.lessThan(10);
        done();
      });
    });
  });

  describe('Each/ForEach', function() {
    it('should iterate over arrays', function(done) {
      const items = [1, 2, 3, 4, 5];
      const results = [];

      async.each(items, function(item, callback) {
        results.push(item * 2);
        callback();
      }, function(err) {
        expect(err).to.not.exist;
        expect(results).to.deep.equal([2, 4, 6, 8, 10]);
        done();
      });
    });

    it('should handle errors in each', function(done) {
      const items = [1, 2, 3];

      async.each(items, function(item, callback) {
        if (item === 2) {
          callback(new Error('Error at 2'));
        } else {
          callback();
        }
      }, function(err) {
        expect(err).to.exist;
        expect(err.message).to.equal('Error at 2');
        done();
      });
    });
  });

  describe('Map', function() {
    it('should transform array elements', function(done) {
      const items = [1, 2, 3, 4, 5];

      async.map(items, function(item, callback) {
        callback(null, item * 2);
      }, function(err, results) {
        expect(err).to.not.exist;
        expect(results).to.deep.equal([2, 4, 6, 8, 10]);
        done();
      });
    });
  });

  describe('Backward Compatibility', function() {
    it('should maintain async 0.2.x waterfall API', function(done) {
      // async 0.2.x and 3.x both use the same waterfall API
      async.waterfall([
        function(callback) {
          callback(null, 'test');
        }
      ], function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.equal('test');
        done();
      });
    });

    it('should handle null error values correctly', function(done) {
      async.waterfall([
        function(callback) {
          callback(null, 'value');
        }
      ], function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.equal('value');
        done();
      });
    });
  });

  describe('Error Handling', function() {
    it('should stop waterfall on first error', function(done) {
      let functionsRun = 0;

      async.waterfall([
        function(callback) {
          functionsRun++;
          callback(null);
        },
        function(callback) {
          functionsRun++;
          callback(new Error('Stop here'));
        },
        function(callback) {
          functionsRun++;
          callback(null);
        }
      ], function(err) {
        expect(err).to.exist;
        expect(functionsRun).to.equal(2);
        done();
      });
    });
  });
});
