var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
var assert = chai.assert;
var fs = require('fs');
var request = require('request');

//SpeechToTextFile = require('../../watson/speech-to-text-read-audio-file');
SpeechToTextStream = require('../../watson/speech-to-text');

describe('Speech to Text tests', function() {
    var speechToTextStream;

    before(function () {
        //speechToTextFile = new SpeechToTextFile();
        speechToTextStream = new SpeechToTextStream();
    });

    it('speech to text get token', function (done) {
        speechToTextStream.getToken(function (response) {
            console.log('** response:' + response);
            done();
        });
    });

    // it.skip('speech to text from recorded audio file', function (done) {
    //     var filePath = __dirname + '/audio-file.flac';
    //     var expectedResponse = 'several tornadoes touch down as a line of severe thunderstorms swept through Colorado on Sunday';
    //     console.log('in test, filePath: ' + filePath);
    //     speechToTextFile.convertSpeechFileToText(filePath, function (response) {
    //         console.log('** response:' + response);
    //         console.log('** expected response:' + expectedResponse);
    //         expect(response).to.startsWith('several tornadoes touch down');
    //         expect(response).to.deep.equal(response);
    //         done();
    //     });
    // });
});