var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
var fs = require('fs');
var request = require('request');

var UrlUtil = require('../../utils/url-util');

describe('URL Util tests', function() {
    var urlUtil;
    const url1 = 'http://www.petmd.com/dog/breeds/c_dg_toy_poodle';

    before(function() {
        urlUtil = new UrlUtil();
    });

    it('Verify url-util type document pdf', function(done){
        var urlDoc1 = 'https://www.polyu.edu.hk/iaee/files/pdf-sample.pdf';
        urlUtil.evaluateURLOrDocumentReturnText(urlDoc1, function(response) {
            expect(response).to.not.be.null;
            expect(response).to.not.equal("");
            done();
        });
    });

    it('Verify invalid url passed in returns error', function(done){
        urlUtil.evaluateURLOrDocumentReturnText('hello', function(response) {
            expect(response).to.startsWith('The value passed in for the URL is not in a proper url format');
            done();
        });
    });

    it('Verify url util type regular URL', function(done){
        var url = 'http://www.vikparuchuri.com/blog/natural-language-processing-tutorial/';
        urlUtil.evaluateURLOrDocumentReturnText(url, function(response) {
            expect(response).to.not.be.null;
            expect(response).to.not.equal("");
            done();
        });
    });


});