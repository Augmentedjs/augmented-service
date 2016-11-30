XMLHttpRequest = require("xhr2");
const Augmented = require("augmentedjs");
Augmented.Service = require("../service");

describe("Given an Augmented Service Collection", function() {
    it("is defined", function() {
        expect(Augmented.Service.Collection).toBeDefined();
    });

    var e;
    beforeEach(function() {
        e = new Augmented.Service.Collection();
    });
    afterEach(function() {
        e = null;
    });

    it("can check if empty", function() {
        expect(e.isEmpty()).toBeTruthy();
    });
});
