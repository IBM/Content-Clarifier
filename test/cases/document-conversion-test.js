var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
var fs = require('fs');
var request = require('request');

DocumentConversion = require('../../watson/document-conversion');
NaturalLanguageUnderstanding = require('../../watson/natural-language-understanding');

describe('Document Conversion tests', function() {
    var documentConversion;
    const url1 = 'https://patentimages.storage.googleapis.com/pdfs/468837f4b94ab114da9f/US4733634.pdf';
    const url2 = 'http://journals.aps.org/pr/pdf/10.1103/PhysRev.47.777';
    const url3 = 'https://www.polyu.edu.hk/iaee/files/pdf-sample.pdf';

    before(function() {
        documentConversion = new DocumentConversion();
    });

    it('Verify get text from PDF file in URL, where the filename ends in .pdf', function(done){
        var dir = null; //__dirname
        documentConversion.getTextFromFileInURL(url3, null, function(response) {
            expect(response).to.exist;
            expect(response.statusCode).to.equal(200);
            expect(response.message).to.exist;
            expect(response.status).to.exist;
            expect(response.text).to.exist;
            done();
        });
    });
    it('Verify get text from PDF file in URL, where the filename does not have the extension .pdf', function(done){
        var dir = null; //__dirname
        documentConversion.getTextFromFileInURL(url2, null, function(response) {
            expect(response).to.exist;
            expect(response.statusCode).to.equal(200);
            expect(response.message).to.exist;
            expect(response.status).to.exist;
            expect(response.text).to.exist;
            done();
        });
    });

    it('Verify get error when pass in null URL when try to get text from PDF file in URL', function(done){
        var dir = null; //__dirname
        var url = null;
        documentConversion.getTextFromFileInURL(url, null, function(response) {
            expect(response).to.exist;
            expect(response.status).to.equal('Error');
            expect(response.statusCode).to.equal(400);
            expect(response.message).to.equal('The url was either not defined or was null, please enter a url value');
            done();
        });
    });
    it('Verify get error when pass in undefined URL when try to get text from PDF file in URL', function(done){
        var dir = null; //__dirname
        var url;
        documentConversion.getTextFromFileInURL(url, null, function(response) {
            expect(response).to.exist;
            expect(response.status).to.equal('Error');
            expect(response.statusCode).to.equal(400);
            expect(response.message).to.startsWith('The url was either not defined or was null, please enter a url value');
            done();
        });
    });

    it('Verify get error when pass in non valid URL', function(done){
        var dir = null; //__dirname
        var urlBad1 = 'htt://patentimages.storage.googleapis.com/pdfs/468837f4b94ab114da9f/US4733634.pdf';
        var urlBad2 = 'https:\\patentimages.storage.googleapis.com/pdfs/468837f4b94ab114da9f/US4733634.pdf';
        documentConversion.getTextFromFileInURL(urlBad1, null, function(response) {
            expect(response).to.exist;
            expect(response).to.not.be.null;
            expect(response.status).to.equal('Error');
            expect(response.statusCode).to.equal(400);
            expect(response.message).to.startsWith('The string passed in for the url is not a valid url format')
            documentConversion.getTextFromFileInURL(urlBad2, null, function(response) {
                expect(response).to.exist;
                expect(response.status).to.equal('Error');
                expect(response.statusCode).to.equal(400);
                expect(response.message).to.startsWith('The string passed in for the url is not a valid url format')
                done();
            });
        });
    });
    it('Verify get error when pass in non-existent file', function(done){
        var fileNameNotExist = 'fileNameNotExist.pdf';
        documentConversion.convertPDFFileToText(fileNameNotExist, function(response) {
            expect(response).to.exist;
            expect(response).to.not.be.null;
            expect(response.status).to.equal('Error');
            expect(response.statusCode).to.equal(400);
            expect(response.message).to.startsWith('The file does not exist')
            done();
        });
    });


    it('Get text from PDf file in URL that has .pdf extension, then use NLU to get Concepts and Semantic Roles', function(done){
        var dir = null; //__dirname
        var text;
        documentConversion.getTextFromFileInURL(url1, null, function(response) {
            text = response.text;
            var parameters = {"features": {"concepts": {}}, "return_analyzed_text": true};
            naturalLanguageUnderstanding = new NaturalLanguageUnderstanding();
            naturalLanguageUnderstanding.doRequest("text", text, parameters, function(response) {
                expect(response).to.exist;
                expect(response).to.not.be.null;
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
                text = response.body['analyzed_text'];
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
        });
    });




    it('Get text from PDf file in URL that has no extension, then use NLU to get Concepts and Semantic Roles', function(done){
        var dir = null; //__dirname
        var text;
        documentConversion.getTextFromFileInURL(url2, null, function(response) {
            text = response.text;
            var parameters = {"features": {"concepts": {}}, "return_analyzed_text": true};
            naturalLanguageUnderstanding = new NaturalLanguageUnderstanding();
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
                expect(response.body['analyzed_text']).to.exist;
                text = response.body['analyzed_text'];
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
        });
    });

    //test case passes when run this class on its own, but fails when run with NLU test class, need to see why
    it.skip('Verify get error when pass in a URL with an unsupported file type (image/png)', function(done){
        var dir = null; //__dirname
        var url = 'https://www.gstatic.com/webp/gallery3/1.png';
        documentConversion.getTextFromFileInURL(url, null, function(response) {
            console.log('*response: ' + JSON.stringify(response));
            expect(response).to.exist;
            expect(response.status).to.equal('Error');
            expect(response.statusCode).to.equal(400);
            expect(response.message).to.startsWith('The content-type of the file is not supported');
            done();
        });
    });

    it.skip('Verify get error when pass in a URL with an unsupported file type ( Application/docx)', function(done){
        var url = 'https://www.ieee.org/documents/trans_jour.docx';
        var dir = null; //__dirname
        documentConversion.getTextFromFileInURL(url, null, function(response) {
            expect(response).to.exist;
            expect(response.status).to.equal('Error');
            expect(response.statusCode).to.equal(400);
            expect(response.message).to.startsWith('The content-type of the file is not supported');
            done();
        });
    });

});