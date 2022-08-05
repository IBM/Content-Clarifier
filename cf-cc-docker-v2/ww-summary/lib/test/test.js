/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_chai = require('chai');

var /*istanbul ignore next*/_jsonwebtoken = require('jsonwebtoken');

/*istanbul ignore next*/var jsonwebtoken = _interopRequireWildcard(_jsonwebtoken);

var /*istanbul ignore next*/_request = require('request');

/*istanbul ignore next*/function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Rudimentary mock of the request module
var postspy = /*istanbul ignore next*/void 0; // A sample chatbot app that listens to messages posted to a space in IBM
// Watson Workspace and echoes hello messages back to the space

// Test the happy path

require.cache[require.resolve('request')].exports = {
  post: function /*istanbul ignore next*/post(uri, opt, cb) /*istanbul ignore next*/{
    return postspy(uri, opt, cb);
  }
};

// Load the Echo app
var echo = require('../app');

// Generate a test OAuth token
var token = jsonwebtoken.sign({}, 'secret', { expiresIn: '1h' });

describe('watsonwork-echo', function () {

  // Mock the Watson Work OAuth service
  var oauth = function oauth(uri, opt, cb) {
    /*istanbul ignore next*/(0, _chai.expect)(opt.auth).to.deep.equal({
      user: 'testappid',
      pass: 'testsecret'
    });
    /*istanbul ignore next*/(0, _chai.expect)(opt.json).to.equal(true);
    /*istanbul ignore next*/(0, _chai.expect)(opt.form).to.deep.equal({
      grant_type: 'client_credentials'
    });

    // Return OAuth token
    setImmediate(function () /*istanbul ignore next*/{
      return cb(undefined, {
        statusCode: 200,
        body: {
          access_token: token
        }
      });
    });
  };

  it('authenticates the app', function (done) {

    // Check async callbacks
    var checks = 0;
    var check = function check() {
      if (++checks === 2) done();
    };

    postspy = function /*istanbul ignore next*/postspy(uri, opt, cb) {
      // Expect a call to get an OAuth token for the app
      if (uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Echo Web app
    echo.webapp('testappid', 'testsecret', 'testwsecret', function (err, app) {
      /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);
      check();
    });
  });

  it('handles Webhook challenge requests', function (done) {

    // Check async callbacks
    var checks = 0;
    var check = function check() {
      if (++checks === 2) done();
    };

    postspy = function /*istanbul ignore next*/postspy(uri, opt, cb) {
      // Expect a call to get an OAuth token for the app
      if (uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Echo Web app
    echo.webapp('testappid', 'testsecret', 'testwsecret', function (err, app) {
      /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);

      // Listen on an ephemeral port
      var server = app.listen(0);

      // Post a Webhook challenge request to the app
      /*istanbul ignore next*/(0, _request.post)('http://localhost:' + server.address().port + '/echo', {
        headers: {
          // Signature of the test body with the Webhook secret
          'X-OUTBOUND-TOKEN': 'f51ff5c91e99c63b6fde9e396bb6ea3023727f74f1853f29ab571cfdaaba4c03'
        },
        json: true,
        body: {
          type: 'verification',
          challenge: 'testchallenge'
        }
      }, function (err, res) {
        /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);
        /*istanbul ignore next*/(0, _chai.expect)(res.statusCode).to.equal(200);

        // Expect correct challenge response and signature
        /*istanbul ignore next*/(0, _chai.expect)(res.body.response).to.equal('testchallenge');
        /*istanbul ignore next*/(0, _chai.expect)(res.headers['x-outbound-token']).to.equal(
        // Signature of the test body with the Webhook secret
        '876d1f9de1b36514d30bcf48d8c4731a69500730854a964e31764159d75b88f1');

        check();
      });
    });
  });

  it('Echoes messages back', function (done) {

    // Check async callbacks
    var checks = 0;
    var check = function check() {
      if (++checks === 3) done();
    };

    postspy = function /*istanbul ignore next*/postspy(uri, opt, cb) {
      // Expect a call to get the OAuth token of an app
      if (uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }

      // Expect a call to send echoed message to the test space
      if (uri === 'https://api.watsonwork.ibm.com/v1/spaces/testspace/messages') {
        /*istanbul ignore next*/(0, _chai.expect)(opt.headers).to.deep.equal({
          Authorization: 'Bearer ' + token
        });
        /*istanbul ignore next*/(0, _chai.expect)(opt.json).to.equal(true);
        /*istanbul ignore next*/(0, _chai.expect)(opt.body).to.deep.equal({
          type: 'appMessage',
          version: 1.0,
          annotations: [{
            type: 'generic',
            version: 1.0,

            color: '#6CB7FB',
            title: 'Echo message',
            text: 'Hey Jane, did you say Hello there?',

            actor: {
              name: 'Sample echo app'
            }
          }]
        });
        setImmediate(function () /*istanbul ignore next*/{
          return cb(undefined, {
            statusCode: 201,
            // Return list of spaces
            body: {}
          });
        });
        check();
      }
    };

    // Create the Echo Web app
    echo.webapp('testappid', 'testsecret', 'testwsecret', function (err, app) {
      /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);

      // Listen on an ephemeral port
      var server = app.listen(0);

      // Post a chat message to the app
      /*istanbul ignore next*/(0, _request.post)('http://localhost:' + server.address().port + '/echo', {
        headers: {
          'X-OUTBOUND-TOKEN':
          // Signature of the body with the Webhook secret
          '7b36f68c9ef83e62c154d7f5eaad634947f1e92931ac213462f489d7d8f8bcad'
        },
        json: true,
        body: {
          type: 'message-created',
          content: 'Hello there',
          userName: 'Jane',
          spaceId: 'testspace'
        }
      }, function (err, val) {
        /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);
        /*istanbul ignore next*/(0, _chai.expect)(val.statusCode).to.equal(201);

        check();
      });
    });
  });

  it('rejects messages with invalid signature', function (done) {

    // Check async callbacks
    var checks = 0;
    var check = function check() {
      if (++checks === 2) done();
    };

    postspy = function /*istanbul ignore next*/postspy(uri, opt, cb) {
      // Expect a call to get an OAuth token for the app
      if (uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Echo Web app
    echo.webapp('testappid', 'testsecret', 'testwsecret', function (err, app) {
      /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);

      // Listen on an ephemeral port
      var server = app.listen(0);

      // Post a chat message to the app
      /*istanbul ignore next*/(0, _request.post)('http://localhost:' + server.address().port + '/echo', {
        headers: {
          'X-OUTBOUND-TOKEN':
          // Test an invalid body signature
          'invalidsignature'
        },
        json: true,
        body: {
          type: 'message-created',
          content: 'Hello there',
          userName: 'Jane',
          spaceId: 'testspace'
        }
      }, function (err, val) {
        /*istanbul ignore next*/(0, _chai.expect)(err).to.equal(null);

        // Expect the request to be rejected
        /*istanbul ignore next*/(0, _chai.expect)(val.statusCode).to.equal(401);

        check();
      });
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZXN0L3Rlc3QuanMiXSwibmFtZXMiOlsianNvbndlYnRva2VuIiwicG9zdHNweSIsInJlcXVpcmUiLCJjYWNoZSIsInJlc29sdmUiLCJleHBvcnRzIiwicG9zdCIsInVyaSIsIm9wdCIsImNiIiwiZWNobyIsInRva2VuIiwic2lnbiIsImV4cGlyZXNJbiIsImRlc2NyaWJlIiwib2F1dGgiLCJhdXRoIiwidG8iLCJkZWVwIiwiZXF1YWwiLCJ1c2VyIiwicGFzcyIsImpzb24iLCJmb3JtIiwiZ3JhbnRfdHlwZSIsInNldEltbWVkaWF0ZSIsInVuZGVmaW5lZCIsInN0YXR1c0NvZGUiLCJib2R5IiwiYWNjZXNzX3Rva2VuIiwiaXQiLCJkb25lIiwiY2hlY2tzIiwiY2hlY2siLCJ3ZWJhcHAiLCJlcnIiLCJhcHAiLCJzZXJ2ZXIiLCJsaXN0ZW4iLCJhZGRyZXNzIiwicG9ydCIsImhlYWRlcnMiLCJ0eXBlIiwiY2hhbGxlbmdlIiwicmVzIiwicmVzcG9uc2UiLCJBdXRob3JpemF0aW9uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsInRleHQiLCJhY3RvciIsIm5hbWUiLCJjb250ZW50IiwidXNlck5hbWUiLCJzcGFjZUlkIiwidmFsIl0sIm1hcHBpbmdzIjoiOztBQUtBOztBQUNBOzs0QkFBWUEsWTs7QUFDWjs7OztBQUVBO0FBQ0EsSUFBSUMsd0NBQUosQyxDQVZBO0FBQ0E7O0FBRUE7O0FBUUFDLFFBQVFDLEtBQVIsQ0FBY0QsUUFBUUUsT0FBUixDQUFnQixTQUFoQixDQUFkLEVBQTBDQyxPQUExQyxHQUFvRDtBQUNsREMsUUFBTSxzQ0FBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQVdDLEVBQVg7QUFBQSxXQUFrQlIsUUFBUU0sR0FBUixFQUFhQyxHQUFiLEVBQWtCQyxFQUFsQixDQUFsQjtBQUFBO0FBRDRDLENBQXBEOztBQUlBO0FBQ0EsSUFBTUMsT0FBT1IsUUFBUSxRQUFSLENBQWI7O0FBRUE7QUFDQSxJQUFN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RCxHQWhERDtBQWlERCxDQXBPRCIsImZpbGUiOiJ0ZXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQSBzYW1wbGUgY2hhdGJvdCBhcHAgdGhhdCBsaXN0ZW5zIHRvIG1lc3NhZ2VzIHBvc3RlZCB0byBhIHNwYWNlIGluIElCTVxuLy8gV2F0c29uIFdvcmtzcGFjZSBhbmQgZWNob2VzIGhlbGxvIG1lc3NhZ2VzIGJhY2sgdG8gdGhlIHNwYWNlXG5cbi8vIFRlc3QgdGhlIGhhcHB5IHBhdGhcblxuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgKiBhcyBqc29ud2VidG9rZW4gZnJvbSAnanNvbndlYnRva2VuJztcbmltcG9ydCB7IHBvc3QgfSBmcm9tICdyZXF1ZXN0JztcblxuLy8gUnVkaW1lbnRhcnkgbW9jayBvZiB0aGUgcmVxdWVzdCBtb2R1bGVcbmxldCBwb3N0c3B5O1xucmVxdWlyZS5jYWNoZVtyZXF1aXJlLnJlc29sdmUoJ3JlcXVlc3QnKV0uZXhwb3J0cyA9IHtcbiAgcG9zdDogKHVyaSwgb3B0LCBjYikgPT4gcG9zdHNweSh1cmksIG9wdCwgY2IpXG59O1xuXG4vLyBMb2FkIHRoZSBFY2hvIGFwcFxuY29uc3QgZWNobyA9IHJlcXVpcmUoJy4uL2FwcCcpO1xuXG4vLyBHZW5lcmF0ZSBhIHRlc3QgT0F1dGggdG9rZW5cbmNvbnN0IHRva2VuID0ganNvbndlYnRva2VuLnNpZ24oe30sICdzZWNyZXQnLCB7IGV4cGlyZXNJbjogJzFoJyB9KTtcblxuZGVzY3JpYmUoJ3dhdHNvbndvcmstZWNobycsICgpID0+IHtcblxuICAvLyBNb2NrIHRoZSBXYXRzb24gV29yayBPQXV0aCBzZXJ2aWNlXG4gIGNvbnN0IG9hdXRoID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgIGV4cGVjdChvcHQuYXV0aCkudG8uZGVlcC5lcXVhbCh7XG4gICAgICB1c2VyOiAndGVzdGFwcGlkJyxcbiAgICAgIHBhc3M6ICd0ZXN0c2VjcmV0J1xuICAgIH0pO1xuICAgIGV4cGVjdChvcHQuanNvbikudG8uZXF1YWwodHJ1ZSk7XG4gICAgZXhwZWN0KG9wdC5mb3JtKS50by5kZWVwLmVxdWFsKHtcbiAgICAgIGdyYW50X3R5cGU6ICdjbGllbnRfY3JlZGVudGlhbHMnXG4gICAgfSk7XG5cbiAgICAvLyBSZXR1cm4gT0F1dGggdG9rZW5cbiAgICBzZXRJbW1lZGlhdGUoKCkgPT4gY2IodW5kZWZpbmVkLCB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBib2R5OiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogdG9rZW5cbiAgICAgIH1cbiAgICB9KSk7XG4gIH07XG5cbiAgaXQoJ2F1dGhlbnRpY2F0ZXMgdGhlIGFwcCcsIChkb25lKSA9PiB7XG5cbiAgICAvLyBDaGVjayBhc3luYyBjYWxsYmFja3NcbiAgICBsZXQgY2hlY2tzID0gMDtcbiAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgIGlmKCsrY2hlY2tzID09PSAyKVxuICAgICAgICBkb25lKCk7XG4gICAgfTtcblxuICAgIHBvc3RzcHkgPSAodXJpLCBvcHQsIGNiKSA9PiB7XG4gICAgICAvLyBFeHBlY3QgYSBjYWxsIHRvIGdldCBhbiBPQXV0aCB0b2tlbiBmb3IgdGhlIGFwcFxuICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICBvYXV0aCh1cmksIG9wdCwgY2IpO1xuICAgICAgICBjaGVjaygpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIENyZWF0ZSB0aGUgRWNobyBXZWIgYXBwXG4gICAgZWNoby53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcbiAgICAgIGNoZWNrKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdoYW5kbGVzIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzJywgKGRvbmUpID0+IHtcblxuICAgIC8vIENoZWNrIGFzeW5jIGNhbGxiYWNrc1xuICAgIGxldCBjaGVja3MgPSAwO1xuICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgaWYoKytjaGVja3MgPT09IDIpXG4gICAgICAgIGRvbmUoKTtcbiAgICB9O1xuXG4gICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gZ2V0IGFuIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG4gICAgICBpZih1cmkgPT09ICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vb2F1dGgvdG9rZW4nKSB7XG4gICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgIGNoZWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBFY2hvIFdlYiBhcHBcbiAgICBlY2hvLndlYmFwcCgndGVzdGFwcGlkJywgJ3Rlc3RzZWNyZXQnLCAndGVzdHdzZWNyZXQnLCAoZXJyLCBhcHApID0+IHtcbiAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuXG4gICAgICAvLyBMaXN0ZW4gb24gYW4gZXBoZW1lcmFsIHBvcnRcbiAgICAgIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4oMCk7XG5cbiAgICAgIC8vIFBvc3QgYSBXZWJob29rIGNoYWxsZW5nZSByZXF1ZXN0IHRvIHRoZSBhcHBcbiAgICAgIHBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6JyArIHNlcnZlci5hZGRyZXNzKCkucG9ydCArICcvZWNobycsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIC8vIFNpZ25hdHVyZSBvZiB0aGUgdGVzdCBib2R5IHdpdGggdGhlIFdlYmhvb2sgc2VjcmV0XG4gICAgICAgICAgJ1gtT1VUQk9VTkQtVE9LRU4nOlxuICAgICAgICAgICAgJ2Y1MWZmNWM5MWU5OWM2M2I2ZmRlOWUzOTZiYjZlYTMwMjM3MjdmNzRmMTg1M2YyOWFiNTcxY2ZkYWFiYTRjMDMnXG4gICAgICAgIH0sXG4gICAgICAgIGpzb246IHRydWUsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICB0eXBlOiAndmVyaWZpY2F0aW9uJyxcbiAgICAgICAgICBjaGFsbGVuZ2U6ICd0ZXN0Y2hhbGxlbmdlJ1xuICAgICAgICB9XG4gICAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG4gICAgICAgIGV4cGVjdChyZXMuc3RhdHVzQ29kZSkudG8uZXF1YWwoMjAwKTtcblxuICAgICAgICAvLyBFeHBlY3QgY29ycmVjdCBjaGFsbGVuZ2UgcmVzcG9uc2UgYW5kIHNpZ25hdHVyZVxuICAgICAgICBleHBlY3QocmVzLmJvZHkucmVzcG9uc2UpLnRvLmVxdWFsKCd0ZXN0Y2hhbGxlbmdlJyk7XG4gICAgICAgIGV4cGVjdChyZXMuaGVhZGVyc1sneC1vdXRib3VuZC10b2tlbiddKS50by5lcXVhbChcbiAgICAgICAgICAvLyBTaWduYXR1cmUgb2YgdGhlIHRlc3QgYm9keSB3aXRoIHRoZSBXZWJob29rIHNlY3JldFxuICAgICAgICAgICc4NzZkMWY5ZGUxYjM2NTE0ZDMwYmNmNDhkOGM0NzMxYTY5NTAwNzMwODU0YTk2NGUzMTc2NDE1OWQ3NWI4OGYxJyk7XG5cbiAgICAgICAgY2hlY2soKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnRWNob2VzIG1lc3NhZ2VzIGJhY2snLCAoZG9uZSkgPT4ge1xuXG4gICAgLy8gQ2hlY2sgYXN5bmMgY2FsbGJhY2tzXG4gICAgbGV0IGNoZWNrcyA9IDA7XG4gICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICBpZigrK2NoZWNrcyA9PT0gMylcbiAgICAgICAgZG9uZSgpO1xuICAgIH07XG5cbiAgICBwb3N0c3B5ID0gKHVyaSwgb3B0LCBjYikgPT4ge1xuICAgICAgLy8gRXhwZWN0IGEgY2FsbCB0byBnZXQgdGhlIE9BdXRoIHRva2VuIG9mIGFuIGFwcFxuICAgICAgaWYodXJpID09PSAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJykge1xuICAgICAgICBvYXV0aCh1cmksIG9wdCwgY2IpO1xuICAgICAgICBjaGVjaygpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gc2VuZCBlY2hvZWQgbWVzc2FnZSB0byB0aGUgdGVzdCBzcGFjZVxuICAgICAgaWYodXJpID09PVxuICAgICAgICAnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL3YxL3NwYWNlcy90ZXN0c3BhY2UvbWVzc2FnZXMnKSB7XG4gICAgICAgIGV4cGVjdChvcHQuaGVhZGVycykudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rZW5cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdChvcHQuanNvbikudG8uZXF1YWwodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChvcHQuYm9keSkudG8uZGVlcC5lcXVhbCh7XG4gICAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICAgIHZlcnNpb246IDEuMCxcbiAgICAgICAgICBhbm5vdGF0aW9uczogW3tcbiAgICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICAgIHZlcnNpb246IDEuMCxcblxuICAgICAgICAgICAgY29sb3I6ICcjNkNCN0ZCJyxcbiAgICAgICAgICAgIHRpdGxlOiAnRWNobyBtZXNzYWdlJyxcbiAgICAgICAgICAgIHRleHQ6ICdIZXkgSmFuZSwgZGlkIHlvdSBzYXkgSGVsbG8gdGhlcmU/JyxcblxuICAgICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgICAgbmFtZTogJ1NhbXBsZSBlY2hvIGFwcCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XVxuICAgICAgICB9KTtcbiAgICAgICAgc2V0SW1tZWRpYXRlKCgpID0+IGNiKHVuZGVmaW5lZCwge1xuICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMSxcbiAgICAgICAgICAvLyBSZXR1cm4gbGlzdCBvZiBzcGFjZXNcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIGNoZWNrKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIENyZWF0ZSB0aGUgRWNobyBXZWIgYXBwXG4gICAgZWNoby53ZWJhcHAoJ3Rlc3RhcHBpZCcsICd0ZXN0c2VjcmV0JywgJ3Rlc3R3c2VjcmV0JywgKGVyciwgYXBwKSA9PiB7XG4gICAgICBleHBlY3QoZXJyKS50by5lcXVhbChudWxsKTtcblxuICAgICAgLy8gTGlzdGVuIG9uIGFuIGVwaGVtZXJhbCBwb3J0XG4gICAgICBjb25zdCBzZXJ2ZXIgPSBhcHAubGlzdGVuKDApO1xuXG4gICAgICAvLyBQb3N0IGEgY2hhdCBtZXNzYWdlIHRvIHRoZSBhcHBcbiAgICAgIHBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6JyArIHNlcnZlci5hZGRyZXNzKCkucG9ydCArICcvZWNobycsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdYLU9VVEJPVU5ELVRPS0VOJzpcbiAgICAgICAgICAgIC8vIFNpZ25hdHVyZSBvZiB0aGUgYm9keSB3aXRoIHRoZSBXZWJob29rIHNlY3JldFxuICAgICAgICAgICAgJzdiMzZmNjhjOWVmODNlNjJjMTU0ZDdmNWVhYWQ2MzQ5NDdmMWU5MjkzMWFjMjEzNDYyZjQ4OWQ3ZDhmOGJjYWQnXG4gICAgICAgIH0sXG4gICAgICAgIGpzb246IHRydWUsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICB0eXBlOiAnbWVzc2FnZS1jcmVhdGVkJyxcbiAgICAgICAgICBjb250ZW50OiAnSGVsbG8gdGhlcmUnLFxuICAgICAgICAgIHVzZXJOYW1lOiAnSmFuZScsXG4gICAgICAgICAgc3BhY2VJZDogJ3Rlc3RzcGFjZSdcbiAgICAgICAgfVxuICAgICAgfSwgKGVyciwgdmFsKSA9PiB7XG4gICAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuICAgICAgICBleHBlY3QodmFsLnN0YXR1c0NvZGUpLnRvLmVxdWFsKDIwMSk7XG5cbiAgICAgICAgY2hlY2soKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgncmVqZWN0cyBtZXNzYWdlcyB3aXRoIGludmFsaWQgc2lnbmF0dXJlJywgKGRvbmUpID0+IHtcblxuICAgIC8vIENoZWNrIGFzeW5jIGNhbGxiYWNrc1xuICAgIGxldCBjaGVja3MgPSAwO1xuICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgaWYoKytjaGVja3MgPT09IDIpXG4gICAgICAgIGRvbmUoKTtcbiAgICB9O1xuXG4gICAgcG9zdHNweSA9ICh1cmksIG9wdCwgY2IpID0+IHtcbiAgICAgIC8vIEV4cGVjdCBhIGNhbGwgdG8gZ2V0IGFuIE9BdXRoIHRva2VuIGZvciB0aGUgYXBwXG4gICAgICBpZih1cmkgPT09ICdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vb2F1dGgvdG9rZW4nKSB7XG4gICAgICAgIG9hdXRoKHVyaSwgb3B0LCBjYik7XG4gICAgICAgIGNoZWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBFY2hvIFdlYiBhcHBcbiAgICBlY2hvLndlYmFwcCgndGVzdGFwcGlkJywgJ3Rlc3RzZWNyZXQnLCAndGVzdHdzZWNyZXQnLCAoZXJyLCBhcHApID0+IHtcbiAgICAgIGV4cGVjdChlcnIpLnRvLmVxdWFsKG51bGwpO1xuXG4gICAgICAvLyBMaXN0ZW4gb24gYW4gZXBoZW1lcmFsIHBvcnRcbiAgICAgIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4oMCk7XG5cbiAgICAgIC8vIFBvc3QgYSBjaGF0IG1lc3NhZ2UgdG8gdGhlIGFwcFxuICAgICAgcG9zdCgnaHR0cDovL2xvY2FsaG9zdDonICsgc2VydmVyLmFkZHJlc3MoKS5wb3J0ICsgJy9lY2hvJywge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ1gtT1VUQk9VTkQtVE9LRU4nOlxuICAgICAgICAgICAgLy8gVGVzdCBhbiBpbnZhbGlkIGJvZHkgc2lnbmF0dXJlXG4gICAgICAgICAgICAnaW52YWxpZHNpZ25hdHVyZSdcbiAgICAgICAgfSxcbiAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIHR5cGU6ICdtZXNzYWdlLWNyZWF0ZWQnLFxuICAgICAgICAgIGNvbnRlbnQ6ICdIZWxsbyB0aGVyZScsXG4gICAgICAgICAgdXNlck5hbWU6ICdKYW5lJyxcbiAgICAgICAgICBzcGFjZUlkOiAndGVzdHNwYWNlJ1xuICAgICAgICB9XG4gICAgICB9LCAoZXJyLCB2YWwpID0+IHtcbiAgICAgICAgZXhwZWN0KGVycikudG8uZXF1YWwobnVsbCk7XG5cbiAgICAgICAgLy8gRXhwZWN0IHRoZSByZXF1ZXN0IHRvIGJlIHJlamVjdGVkXG4gICAgICAgIGV4cGVjdCh2YWwuc3RhdHVzQ29kZSkudG8uZXF1YWwoNDAxKTtcblxuICAgICAgICBjaGVjaygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG5cbiJdfQ==