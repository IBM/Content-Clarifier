/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.conf = undefined;

var /*istanbul ignore next*/_fs = require('fs');

/*istanbul ignore next*/var fs = _interopRequireWildcard(_fs);

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Debug log
// Return HTTPS server SSL configuration

// Feel free to adapt to your particular security and hosting environment

var log = /*istanbul ignore next*/(0, _debug2.default)('watsonwork-echo-ssl');

// Return HTTPS server SSL configuration
var conf = /*istanbul ignore next*/exports.conf = function conf(env, cb) {
  // Read configured SSL cert and key
  log('Reading SSL cert');
  fs.readFile(env.SSLCERT || './server.crt', function (err, cert) {
    if (err) {
      log('Error reading SSL cert %o', err);
      cb(err);
      return;
    }
    fs.readFile(env.SSLKEY || './server.key', function (err, key) {
      if (err) {
        log('Error reading SSL key %o', err);
        cb(err);
        return;
      }
      cb(null, {
        cert: cert,
        key: key
      });
    });
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zc2wuanMiXSwibmFtZXMiOlsiZnMiLCJsb2ciLCJjb25mIiwiZW52IiwiY2IiLCJyZWFkRmlsZSIsIlNTTENFUlQiLCJlcnIiLCJjZXJ0IiwiU1NMS0VZIiwia2V5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBSUE7OzRCQUFZQSxFOztBQUNaOzs7Ozs7OztBQUVBO0FBUEE7O0FBRUE7O0FBTUEsSUFBTUMsTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVBO0FBQ08sSUFBTUMsOENBQU8sU0FBUEEsSUFBTyxDQUFDQyxHQUFELEVBQU1DLEVBQU4sRUFBYTtBQUMvQjtBQUNBSCxNQUFJLGtCQUFKO0FBQ0FELEtBQUdLLFFBQUgsQ0FBWUYsSUFBSUcsT0FBSixJQUFlLGNBQTNCLEVBQTJDLFVBQUNDLEdBQUQsRUFBTUMsSUFBTixFQUFlO0FBQ3hELFFBQUdELEdBQUgsRUFBUTtBQUNOTixVQUFJLDJCQUFKLEVBQWlDTSxHQUFqQztBQUNBSCxTQUFHRyxHQUFIO0FBQ0E7QUFDRDtBQUNEUCxPQUFHSyxRQUFILENBQVlGLElBQUlNLE1BQUosSUFBYyxjQUExQixFQUEwQyxVQUFDRixHQUFELEVBQU1HLEdBQU4sRUFBYztBQUN0RCxVQUFHSCxHQUFILEVBQVE7QUFDTk4sWUFBSSwwQkFBSixFQUFnQ00sR0FBaEM7QUFDQUgsV0FBR0csR0FBSDtBQUNBO0FBQ0Q7QUFDREgsU0FBRyxJQUFILEVBQVM7QUFDUEksY0FBTUEsSUFEQztBQUVQRSxhQUFLQTtBQUZFLE9BQVQ7QUFJRCxLQVZEO0FBV0QsR0FqQkQ7QUFrQkQsQ0FyQk0iLCJmaWxlIjoic3NsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gUmV0dXJuIEhUVFBTIHNlcnZlciBTU0wgY29uZmlndXJhdGlvblxuXG4vLyBGZWVsIGZyZWUgdG8gYWRhcHQgdG8geW91ciBwYXJ0aWN1bGFyIHNlY3VyaXR5IGFuZCBob3N0aW5nIGVudmlyb25tZW50XG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5cbi8vIERlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstZWNoby1zc2wnKTtcblxuLy8gUmV0dXJuIEhUVFBTIHNlcnZlciBTU0wgY29uZmlndXJhdGlvblxuZXhwb3J0IGNvbnN0IGNvbmYgPSAoZW52LCBjYikgPT4ge1xuICAvLyBSZWFkIGNvbmZpZ3VyZWQgU1NMIGNlcnQgYW5kIGtleVxuICBsb2coJ1JlYWRpbmcgU1NMIGNlcnQnKTtcbiAgZnMucmVhZEZpbGUoZW52LlNTTENFUlQgfHwgJy4vc2VydmVyLmNydCcsIChlcnIsIGNlcnQpID0+IHtcbiAgICBpZihlcnIpIHtcbiAgICAgIGxvZygnRXJyb3IgcmVhZGluZyBTU0wgY2VydCAlbycsIGVycik7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmcy5yZWFkRmlsZShlbnYuU1NMS0VZIHx8ICcuL3NlcnZlci5rZXknLCAoZXJyLCBrZXkpID0+IHtcbiAgICAgIGlmKGVycikge1xuICAgICAgICBsb2coJ0Vycm9yIHJlYWRpbmcgU1NMIGtleSAlbycsIGVycik7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNiKG51bGwsIHtcbiAgICAgICAgY2VydDogY2VydCxcbiAgICAgICAga2V5OiBrZXlcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbiJdfQ==