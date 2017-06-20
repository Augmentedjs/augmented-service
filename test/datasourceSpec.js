XMLHttpRequest = require("xhr2");
const Augmented = require("augmentedjs");
Augmented.Service = require("../service");

describe("Given an Augmented Service DataSourceFactory", function() {
    it("a factory is defined", function() {
        expect(Augmented.Service.DataSourceFactory).toBeDefined();
    });

    describe("Given a DataSource instance", function() {
        it("is defined", function() {
            expect(Augmented.Service.DataSource).toBeDefined();
        });
    });

    describe("Given a Memory DataSource", function() {
        var ds;
        beforeEach(function() {
            ds = Augmented.Service.DataSourceFactory.getDatasource(
                Augmented.Service.DataSourceFactory.Type.Memory, {});
        });
        afterEach(function() {
            ds = null;
        });

        it("can get a Memory DataSource instance", function() {
            expect(ds).toBeDefined();
            expect(ds instanceof Augmented.Service.MemoryDataSource).toBeTruthy();
        });

        it("can insert into the db", function() {
            ds.insert("monkey");

            expect(ds).toBeDefined();
        });
    });

    describe("Given a MongoDB DataSource", function() {
        var ds;
        beforeEach(function() {
            ds = Augmented.Service.DataSourceFactory.getDatasource(
                Augmented.Service.DataSourceFactory.Type.MongoDB, {});
        });
        afterEach(function() {
            ds = null;
        });

        it("can get a MongoDB DataSource instance", function() {
            expect(ds).toBeDefined();
            expect(ds instanceof Augmented.Service.DataSource).toBeTruthy();
        });
    });

    describe("Given a SOLR DataSource", function() {
        var ds;
        beforeEach(function() {
            ds = Augmented.Service.DataSourceFactory.getDatasource(
                Augmented.Service.DataSourceFactory.Type.SOLR, {});
        });
        afterEach(function() {
            ds = null;
        });
        it("can get a SOLR DataSource instance", function() {
            expect(ds).toBeDefined();
            expect(ds instanceof Augmented.Service.DataSource).toBeTruthy();
        });
    });
});
