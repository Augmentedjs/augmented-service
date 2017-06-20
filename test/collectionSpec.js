XMLHttpRequest = require("xhr2");
const Augmented = require("augmentedjs");
Augmented.Service = require("../service");


describe("Given an Augmented Service Collections", function() {

    describe("Given an Augmented Service EntityCollection", function() {
        it("is defined", function() {
            expect(Augmented.Service.EntityCollection).toBeDefined();
        });

        var e;
        beforeEach(function() {
            e = new Augmented.Service.EntityCollection();
        });
        afterEach(function() {
            e = null;
        });

        it("can check if empty", function() {
            expect(e.isEmpty()).toBeTruthy();
        });

        it("supports setting a datasource", function() {
            e.setDatasource({});
            expect(e.datasource).toBeDefined();
        });
    });

    describe("Given an Augmented Service ResourceCollection", function() {
        it("is defined", function() {
            expect(Augmented.Service.ResourceCollection).toBeDefined();
        });

        var e;
        beforeEach(function() {
            e = new Augmented.Service.ResourceCollection();
        });
        afterEach(function() {
            e = null;
        });

        it("can check if empty", function() {
            expect(e.isEmpty()).toBeTruthy();
        });

        it("supports setting a URL", function() {
            e.setURL("localhost");
            expect(e.url).toEqual("localhost");
        });
    });

});
