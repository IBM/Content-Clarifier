
var chai = require('chai');
var expect = chai.expect;

var config = require('../../watson/natural-language-understanding.json');

NaturalLanguageUnderstanding = require('../../watson/natural-language-understanding');


describe('Natural Language Understanding Analyze function tests', function() {
    var naturalLanguageUnderstanding;
    var text = "Hey John, am I glad to see you! I wanted to tell you that my family is in unanimous agreement regarding the IPhone being astonishing. As a matter of fact," +
               "it was built under the helm of Steve Jobs, who was a masterful innovator. I bought mine from the Apple Store in New York City. Over the years, I have downloaded " +
               "a humongous amount of apps from the App Store. I may sound like a broken record about it, but Mary definitely agrees with me. Mary owns an IPad if I'm not mistaken. " +
               "By the way, if you're jealous, you really should replace your superannuated mobile phone. Well, that's all for now. See you later, alligator!";

    var url = "http://moderndogmagazine.com/breeds/poodle";

    before(function() {
        naturalLanguageUnderstanding = new NaturalLanguageUnderstanding();
    });

    it('Pass in text and the Concepts feature, without analyzed_text, verify results', function(done) {
        var parameters = {"features": {"concepts": {}}};
        naturalLanguageUnderstanding.doRequest("text", text, parameters, function(response) {
            expect(response.body['concepts']).to.exist;
            expect(response.body['concepts']).to.have.length.above(0);
            var concepts = response.body['concepts'];
            var concept;
            for(var i = 0; i < concepts.length; i++){
                concept = concepts[i];
                expect(concept).to.exist;
                expect(concept.text).to.exist;
                expect(concept.relevance).to.exist;
                expect(concept.dbpedia_resource).to.exist;
            }
            expect(response.body['analyzed_text']).to.not.exist;
            done();
        });
    });
    it('Pass in text and the Concepts feature, without analyzed_text, verify results', function(done) {
        var parameters = {"features": {"concepts": {}}, "return_analyzed_text": true};
        naturalLanguageUnderstanding.doRequest("url", url, parameters, function(response) {
            expect(response.body['concepts']).to.exist;
            expect(response.body['concepts']).to.have.length.above(0);
            var concepts = response.body['concepts'];
            var concept;
            for(var i = 0; i < concepts.length; i++){
                concept = concepts[i];
                expect(concept).to.exist;
                expect(concept.text).to.exist;
                expect(concept.relevance).to.exist;
                expect(concept.dbpedia_resource).to.exist;
            }
            expect(response.body['analyzed_text']).to.exist;
            expect(response.body['retrieved_url']).to.exist;
            done();
        });
    });
    it('Pass in text and the Semantic Roles feature, verify results', function(done) {
        var parameters = {"features": {"semantic_roles": {}}};
        naturalLanguageUnderstanding.doRequest("text", text, parameters, function(response) {
            expect(response.body['semantic_roles']).to.exist;
            expect(response.body['semantic_roles']).to.have.length.above(0);
            var semanticRoles = response.body['semantic_roles'];
            var semanticRole;
            for(var i = 0; i < semanticRoles.length; i++){
                semanticRole = semanticRoles[i];
                expect(semanticRole.subject.text).to.exist;
                expect(semanticRole.action.text).to.exist;
                if(semanticRole.object != undefined){
                    expect(semanticRole.object.text).to.exist;
                }
            }
            done();
        });
    });
    it('Pass in no features, get error', function(done) {
        var parameters = {};
        naturalLanguageUnderstanding.doRequest("text", text, parameters, function(response) {
            expect(response.statusCode).to.deep.equal(400);
            expect(response.message.error).to.deep.equal("no features specified");
            done();
        });
    });

    it('Pass in one good feature and one bad one, get error', function(done) {
        var parameters = {"features": {"semantic_roles": {}, "colors": {}}};
        naturalLanguageUnderstanding.doRequest("text", text, parameters, function(response) {
            expect(response.statusCode).to.deep.equal(400);
            expect(response.message.error).to.deep.equal("feature 'colors' is not valid");
            done();
        });
    });
    it('Pass in no text value "", get error', function(done) {
        var parameters = {"features": {"semantic_roles": {}}};
        naturalLanguageUnderstanding.doRequest("text", "", parameters, function(response) {
            expect(response.statusCode).to.deep.equal(400);
            expect(response.message.error).to.deep.equal("invalid request: content is empty");
            done();
        });
    });
    it('Pass in empty text value " ", get error', function(done) {
        var parameters = {"features": {"semantic_roles": {}}};
        naturalLanguageUnderstanding.doRequest("text", " ", parameters, function(response) {
            expect(response.statusCode).to.deep.equal(400);
            expect(response.message.error).to.deep.equal("invalid request: content is empty");
            done();
        });
    });
    it('Pass in null text value, get error', function(done) {
        var parameters = {"features": {"semantic_roles": {}}};
        naturalLanguageUnderstanding.doRequest("text", null, parameters, function(response) {
            expect(response.statusCode).to.deep.equal(400);
            expect(response.message.error).to.deep.equal("invalid request: 'text' is in invalid format");
            done();
        });
    });
    it('Pass in no url value "", get error', function(done) {
        var parameters = {"features": {"semantic_roles": {}}};
        naturalLanguageUnderstanding.doRequest("url", "", parameters, function(response) {
            expect(response.statusCode).to.deep.equal(400);
            expect(response.message.error).to.deep.equal("invalid request: content is empty");
            done();
        });
    });
    it('Pass in empty url value " ", get error', function(done) {
        var parameters = {"features": {"semantic_roles": {}}};
        naturalLanguageUnderstanding.doRequest("url", " ", parameters, function(response) {
            expect(response.statusCode).to.deep.equal(400);
            expect(response.message.error).to.deep.equal("invalid request: content is empty");
            done();
        });
    });
    it('Pass in null url value, get error', function(done) {
        var parameters = {"features": {"semantic_roles": {}}};
        naturalLanguageUnderstanding.doRequest("url", null, parameters, function(response) {
            expect(response.statusCode).to.deep.equal(400);
            expect(response.message.error).to.deep.equal("invalid request: 'url' is in invalid format");
            done();
        });
    });
    it('Pass in text and url value " ", get error', function() {
        var parameters = {"url": url, "features": {"concepts": {}}};
        naturalLanguageUnderstanding.doRequest("text", text, parameters, function(err, response) {
            expect(response.statusCode).to.deep.equal(400);
            expect(response.message.error).to.deep.equal("invalid request: multiple content provided");
            done();
        });
    });
});