/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = undefined;

//var /*istanbul ignore next*/_request = require('request');

//*istanbul ignore next*/var request = _interopRequireWildcard(_request);

var /*istanbul ignore next*/_jsonwebtoken = require('jsonwebtoken');

/*istanbul ignore next*/var jsonwebtoken = _interopRequireWildcard(_jsonwebtoken);

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

var /*istanbul ignore next*/_http = require('http');

/*istanbul ignore next*/var http = _interopRequireWildcard(_http);

var /*istanbul ignore next*/_https = require('https');

/*istanbul ignore next*/var https = _interopRequireWildcard(_https);

const request = require('request');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Setup debug log
var log = /*istanbul ignore next*/(0, _debug2.default)('watsonwork-echo-oauth');

// Obtain an OAuth token for the app, repeat at regular intervals before the
// token expires. Returns a function that will always return a current
// valid token.
// Regularly obtain a fresh OAuth token for the app

var run = /*istanbul ignore next*/exports.run = function run(appId, secret, cb) {



  var tok = /*istanbul ignore next*/void 0;

  // Return the current token
  var current = function current() /*istanbul ignore next*/{
    return tok;
  };

  // Return the time to live of a token
  var ttl = function ttl(tok) /*istanbul ignore next*/{
    return Math.max(0, jsonwebtoken.decode(tok).exp * 1000 - Date.now());
  };

  // Refresh the token
  var refresh = function refresh(cb) {
    log('Getting token');
    request.post('https://api.watsonwork.ibm.com/oauth/token', {
      auth: {
        user: appId,
        pass: secret
      },
      json: true,
      form: {
        grant_type: 'client_credentials'
      }
    }, function (err, res) {
      if (err || res.statusCode !== 200) {
        log('Error getting token %o', err || res.statusCode);
        cb(err || new Error(res.statusCode));
        return;
      }

      // Save the fresh token
      log('Got new token');
      tok = res.body.access_token;

      // Schedule next refresh a bit before the token expires
      var t = ttl(tok);
      log('Token ttl', t);
      setTimeout(refresh, Math.max(0, t - 60000)).unref();

      // Return a function that'll return the current token
      cb(undefined, current);
    });
  };

  // Obtain initial token
  setImmediate(function () /*istanbul ignore next*/{
    return refresh(cb);
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9vYXV0aC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwianNvbndlYnRva2VuIiwibG9nIiwicnVuIiwiYXBwSWQiLCJzZWNyZXQiLCJjYiIsInRvayIsImN1cnJlbnQiLCJ0dGwiLCJNYXRoIiwibWF4IiwiZGVjb2RlIiwiZXhwIiwiRGF0ZSIsIm5vdyIsInJlZnJlc2giLCJwb3N0IiwiYXV0aCIsInVzZXIiLCJwYXNzIiwianNvbiIsImZvcm0iLCJncmFudF90eXBlIiwiZXJyIiwicmVzIiwic3RhdHVzQ29kZSIsIkVycm9yIiwiYm9keSIsImFjY2Vzc190b2tlbiIsInQiLCJzZXRUaW1lb3V0IiwidW5yZWYiLCJ1bmRlZmluZWQiLCJzZXRJbW1lZGlhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxZOztBQUNaOzs7Ozs7OztBQUVBO0FBQ0EsSUFBTUMsTUFBTSw2Q0FBTSx1QkFBTixDQUFaOztBQUVBO0FBQ0E7QUFDQTtBQVhBOztBQVlPLElBQU1DLDRDQUFNLFNBQU5BLEdBQU0sQ0FBQ0MsS0FBRCxFQUFRQyxNQUFSLEVBQWdCQyxFQUFoQixFQUF1QjtBQUN4QyxNQUFJQyxvQ0FBSjs7QUFFQTtBQUNBLE1BQU1DLFVBQVUsU0FBVkEsT0FBVTtBQUFBLFdBQU1ELEdBQU47QUFBQSxHQUFoQjs7QUFFQTtBQUNBLE1BQU1FLE1BQU0sU0FBTkEsR0FBTSxDQUFDRixHQUFEO0FBQUEsV0FDVkcsS0FBS0MsR0FBTCxDQUFTLENBQVQsRUFBWVYsYUFBYVcsTUFBYixDQUFvQkwsR0FBcEIsRUFBeUJNLEdBQXpCLEdBQStCLElBQS9CLEdBQXNDQyxLQUFLQyxHQUFMLEVBQWxELENBRFU7QUFBQSxHQUFaOztBQUdBO0FBQ0EsTUFBTUMsVUFBVSxTQUFWQSxPQUFVLENBQUNWLEVBQUQsRUFBUTtBQUN0QkosUUFBSSxlQUFKO0FBQ0FGLFlBQVFpQixJQUFSLENBQWEsNENBQWIsRUFBMkQ7QUFDekRDLFlBQU07QUFDSkMsY0FBTWYsS0FERjtBQUVKZ0IsY0FBTWY7QUFGRixPQURtRDtBQUt6RGdCLFlBQU0sSUFMbUQ7QUFNekRDLFlBQU07QUFDSkMsb0JBQVk7QUFEUjtBQU5tRCxLQUEzRCxFQVNHLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFjO0FBQ2YsVUFBR0QsT0FBT0MsSUFBSUMsVUFBSixLQUFtQixHQUE3QixFQUFrQztBQUNoQ3hCLFlBQUksd0JBQUosRUFBOEJzQixPQUFPQyxJQUFJQyxVQUF6QztBQUNBcEIsV0FBR2tCLE9BQU8sSUFBSUcsS0FBSixDQUFVRixJQUFJQyxVQUFkLENBQVY7QUFDQTtBQUNEOztBQUVEO0FBQ0F4QixVQUFJLGVBQUo7QUFDQUssWUFBTWtCLElBQUlHLElBQUosQ0FBU0MsWUFBZjs7QUFFQTtBQUNBLFVBQU1DLElBQUlyQixJQUFJRixHQUFKLENBQVY7QUFDQUwsVUFBSSxXQUFKLEVBQWlCNEIsQ0FBakI7QUFDQUMsaUJBQVdmLE9BQVgsRUFBb0JOLEtBQUtDLEdBQUwsQ0FBUyxDQUFULEVBQVltQixJQUFJLEtBQWhCLENBQXBCLEVBQTRDRSxLQUE1Qzs7QUFFQTtBQUNBMUIsU0FBRzJCLFNBQUgsRUFBY3pCLE9BQWQ7QUFDRCxLQTNCRDtBQTRCRCxHQTlCRDs7QUFnQ0E7QUFDQTBCLGVBQWE7QUFBQSxXQUFNbEIsUUFBUVYsRUFBUixDQUFOO0FBQUEsR0FBYjtBQUNELENBN0NNIiwiZmlsZSI6Im9hdXRoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gUmVndWxhcmx5IG9idGFpbiBhIGZyZXNoIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG5cbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyBqc29ud2VidG9rZW4gZnJvbSAnanNvbndlYnRva2VuJztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstZWNoby1vYXV0aCcpO1xuXG4vLyBPYnRhaW4gYW4gT0F1dGggdG9rZW4gZm9yIHRoZSBhcHAsIHJlcGVhdCBhdCByZWd1bGFyIGludGVydmFscyBiZWZvcmUgdGhlXG4vLyB0b2tlbiBleHBpcmVzLiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGFsd2F5cyByZXR1cm4gYSBjdXJyZW50XG4vLyB2YWxpZCB0b2tlbi5cbmV4cG9ydCBjb25zdCBydW4gPSAoYXBwSWQsIHNlY3JldCwgY2IpID0+IHtcbiAgbGV0IHRvaztcblxuICAvLyBSZXR1cm4gdGhlIGN1cnJlbnQgdG9rZW5cbiAgY29uc3QgY3VycmVudCA9ICgpID0+IHRvaztcblxuICAvLyBSZXR1cm4gdGhlIHRpbWUgdG8gbGl2ZSBvZiBhIHRva2VuXG4gIGNvbnN0IHR0bCA9ICh0b2spID0+XG4gICAgTWF0aC5tYXgoMCwganNvbndlYnRva2VuLmRlY29kZSh0b2spLmV4cCAqIDEwMDAgLSBEYXRlLm5vdygpKTtcblxuICAvLyBSZWZyZXNoIHRoZSB0b2tlblxuICBjb25zdCByZWZyZXNoID0gKGNiKSA9PiB7XG4gICAgbG9nKCdHZXR0aW5nIHRva2VuJyk7XG4gICAgcmVxdWVzdC5wb3N0KCdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vb2F1dGgvdG9rZW4nLCB7XG4gICAgICBhdXRoOiB7XG4gICAgICAgIHVzZXI6IGFwcElkLFxuICAgICAgICBwYXNzOiBzZWNyZXRcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgZm9ybToge1xuICAgICAgICBncmFudF90eXBlOiAnY2xpZW50X2NyZWRlbnRpYWxzJ1xuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDApIHtcbiAgICAgICAgbG9nKCdFcnJvciBnZXR0aW5nIHRva2VuICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY2IoZXJyIHx8IG5ldyBFcnJvcihyZXMuc3RhdHVzQ29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFNhdmUgdGhlIGZyZXNoIHRva2VuXG4gICAgICBsb2coJ0dvdCBuZXcgdG9rZW4nKTtcbiAgICAgIHRvayA9IHJlcy5ib2R5LmFjY2Vzc190b2tlbjtcblxuICAgICAgLy8gU2NoZWR1bGUgbmV4dCByZWZyZXNoIGEgYml0IGJlZm9yZSB0aGUgdG9rZW4gZXhwaXJlc1xuICAgICAgY29uc3QgdCA9IHR0bCh0b2spO1xuICAgICAgbG9nKCdUb2tlbiB0dGwnLCB0KTtcbiAgICAgIHNldFRpbWVvdXQocmVmcmVzaCwgTWF0aC5tYXgoMCwgdCAtIDYwMDAwKSkudW5yZWYoKTtcblxuICAgICAgLy8gUmV0dXJuIGEgZnVuY3Rpb24gdGhhdCdsbCByZXR1cm4gdGhlIGN1cnJlbnQgdG9rZW5cbiAgICAgIGNiKHVuZGVmaW5lZCwgY3VycmVudCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gT2J0YWluIGluaXRpYWwgdG9rZW5cbiAgc2V0SW1tZWRpYXRlKCgpID0+IHJlZnJlc2goY2IpKTtcbn07XG5cbiJdfQ==
