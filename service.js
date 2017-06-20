/**
 * service.js - The Service Core Component<br/>
 * The <b>Service</b> extension adds extensive abilities to the service (Node.js) layer.<br/>
 * This extension adds:<br/>
 * <ul>
 * <li>DataSource</li>
 * <li>Entity</li>
 * <li>Resource</li>
 * </ul>
 *
 * @author Bob Warren
 *
 * @requires augmentedjs ("augmentedjs" in npm)
 * @requires node
 * @requires http
 * @requires https
 * @module Augmented.Service
 * @version 1.4.1
 * @license Apache-2.0
 */
(function(moduleFactory) {
    if (typeof exports === "object") {
	    module.exports = moduleFactory(require("augmentedjs"));
    }
}(function(Augmented) {
    "use strict";

    var http = require("http");
    var https = require("https");

    /**
     * The base namespece for all of the Service module.
     * @namespace Service
     * @memberof Augmented
     */
    Augmented.Service = {};

    /**
     * The standard version property
     * @constant VERSION
     * @memberof Augmented.Service
     */
    Augmented.Service.VERSION = "1.4.1";

    /**
     * A nice console logger with prefix for service messages
     * @class Logger
     * @memberof Augmented.Service
     */
    Augmented.Service.Logger = {
        _logger: null,
        _prefix: "SERVICE",
        /**
         * Set the prefix of the logger
         * @method setPrefix
         * @param {string} prefix The prefix for the logger message
         * @memberof Augmented.Service.Logger
         */
        setPrefix: function(prefix) {
          this._prefix = prefix;
        },
        log: function(message) {
            this._logger.log(this._prefix + ": " + message);
        },
        info: function(message) {
            this._logger.info(this._prefix + ": " + message);
        },
        debug: function(message) {
            this._logger.debug(this._prefix + ": " + message);
        },
        warn: function(message) {
            this._logger.warn(this._prefix + ": " + message);
        },
        error: function(message) {
            this._logger.error(this._prefix + ": " + message);
        },
        /**
         * Get an instance class of the service color logger
         * @method getServiceLogger
         * @param {Augmented.Logger.Level} level The logger level
         * @param {string} prefix Optional prefix for the logger message
         * @memberof Augmented.Service.Logger
         */
        getLogger: function(level, prefix) {
            if (!level) {
                level = Augmented.Logger.Level.info;
            }
            this._logger = Augmented.Logger.LoggerFactory.getLogger(
                Augmented.Logger.Type.colorConsole, level);
            if (prefix) {
                    this.setPrefix(prefix);
            }
            return this;
        }
    };

    /**
     * A private logger for use in the framework only
     * @private
     */
    const logger = Augmented.Service.Logger.getLogger(Augmented.Configuration.LoggerLevel, "SERVICE");

    /**
     * The datasource object for use as an interface for a datasource
     * @interface DataSource
     * @memberof Augmented.Service
     */
    Augmented.Service.DataSource = function(client) {
        this.connected = false;
        this.style = "database";

        /**
         * @property {object} client The client for use in the DataSource
         * @memberof Augmented.Service.DataSource
         */
        this.client = (client) ? client : null;
        /**
         * @property {string} url The url for the datasource (if applicable)
         * @memberof Augmented.Service.DataSource
         */
        this.url = "";
        /**
         * @property {object} db The database (or simular) for the datasource (if applicable)
         * @memberof Augmented.Service.DataSource
         */
        this.db = null;
        /**
         * @property {object} collection The collection for use in the DataSource
         * @memberof Augmented.Service.DataSource
         */
        this.collection = null;
        /**
         * @method getConnection Get a connection to the DataSource
         * @memberof Augmented.Service.DataSource
         * @returns {boolean} Returns true if a connection is established
         */
        this.getConnection = function() { return false; };
        /**
         * @method closeConnection Close a connection to the DataSource (depending on type may not be needed)
         * @memberof Augmented.Service.DataSource
         * @returns {boolean} Returns true if a connection is established
         */
        this.closeConnection = function() {};
        /**
         * @method insert Insert data
         * @memberof Augmented.Service.DataSource
         * @param {object} data Data to insert
         */
        this.insert = function(data) {};
        /**
         * @method remove Remove data
         * @memberof Augmented.Service.DataSource
         * @param {object} data Data to remove
         */
        this.remove = function(data) {};
        /**
         * @method update Update data
         * @memberof Augmented.Service.DataSource
         * @param {object} data Data to update
         */
        this.update = function(data) {};
        /**
         * @method query Query data
         * @memberof Augmented.Service.DataSource
         * @param {object} query The query object
         * @param {function} callback A callback to execute during the query
         * @returns {object} Returns a value from the query or response code
         */
        this.query = function(query, callback) { return null; };

        /**
         * @method getCollection Get the collection
         * @memberof Augmented.Service.DataSource
         * @returns {object} Returns the collection
         */
        this.getCollection = function() {
            return this.collection;
        };

        /**
         * @method setCollection Set the collection by name
         * @memberof Augmented.Service.DataSource
         * @param {string} name The name of the collection
         */
        this.setCollection = function(name) {

        };
    };

    Augmented.Service.MemoryDataSource = function(client) {
        Augmented.Service.DataSource.call(this, client);
        this.style = "array";
        this.db = [];

        this.getConnection = function(url, collection) {
            this.connected = true;
            if (collection) {
                this.collection = collection;
            }

            this.url = url;
            this.style = "array";
            return true;
        };

        this.closeConnection = function() {
            if (this.db && this.connected) {
                this.connected = false;
                this.db = null;
                this.collection = null;
            }
        };

        this.insert = function(data) {
            this.db.push(data);
        };


    }

    /**
     * The MongoDB datasource instance class
     * @constructor MongoDataSource
     * @implements {Augmented.Service.DataSource}
     * @augments Augmented.Service.DataSource
     * @memberof Augmented.Service
     */
    Augmented.Service.MongoDataSource = function(client) {
        Augmented.Service.DataSource.call(this, client);

        this.setCollection = function(name) {
            logger.debug("setCollection: " + name);
            if (name && Augmented.isString(name)) {
                logger.debug("collection: " + name);
                this.collection = this.db.collection(name);
            } else {
                logger.debug("no collection set");
            }
        };

        this.getConnection = function(url, collection) {
            this.connected = false;
            var that = this;
            if (this.client && !this.connected) {
                this.client.connect(url, function(err, db) {
                    if(!err) {
                        if (collection) {
                            logger.debug("getConnection: collection: " + collection);
                            that.collection = db.collection(collection);
                        } else {
                            logger.debug("getConnection: no collection");
                        }
                        that.db = db;
                        that.url = url;
                        that.connected = true;
                        that.style = "database";
                    } else {
                        logger.error(err);
                        throw new Error(err);
                    }
                });
                return true;
            } else {
                logger.error("no client was passed.");
            }
            return false;
        };

        this.closeConnection = function() {
            if (this.db && this.connected) {
                this.db.close();
                this.connected = false;
                this.db = null;
                this.collection = null;
            }
        };

        this.query = function(query, callback) {
            var ret = {};
            if (this.collection && this.connected) {
                logger.debug("The query: " + query);
                const myQuery = query;
                if (Augmented.isFunction(query)) {
                    myQuery = query();
                }

                this.collection.find(myQuery).toArray(function(err, results) {
                    if(!err) {
                        logger.debug("Results: " + JSON.stringify(results));

                        if (results) {
                            ret = results;
                        }
                        if (callback) {
                            callback(ret);
                        } else {
                            logger.debug("MongoDatasource, no callback");
                        }
                    } else {
                        logger.error(err);
                        throw new Error(err);
                    }
                });
            } else {
                logger.error("no collection defined or not connected to db.");
            }
            logger.debug("ret: " + JSON.stringify(ret));
            return ret;
        };

        this.insert = function(data, callback) {
            var ret = {};
            if (this.collection && this.connected) {
                if (Array.isArray(data)) {
                    this.collection.insertMany(data, function(err, result) {
                        if(!err) {
                            logger.debug("Result: " + JSON.stringify(result));
                            if (result) {
                                ret = result;
                                if (callback) {
                                    callback(ret);
                                }
                            }
                        } else {
                            logger.error(err);
                            throw new Error(err);
                        }
                    });
                } else {
                    this.collection.insertOne(data, function(err, result) {
                        if(!err) {
                            logger.debug("Result: " + JSON.stringify(result));
                            if (result) {
                                ret = result;
                                if (callback) {
                                    callback(ret);
                                }
                            }
                        } else {
                            logger.error(err);
                            throw new Error(err);
                        }
                    });
                }
            } else {
                logger.error("no collection defined or not connected to db.");
            }
            logger.debug("ret: " + JSON.stringify(ret));
            return ret;
        };

        this.update = function(query, data, callback) {
            if (this.collection && this.connected) {
                logger.debug("The query: " + query);
                const myQuery = query;
                if (Augmented.isFunction(query)) {
                    myQuery = query();
                }

                this.collection.update(myQuery, data, function(err, result) {
                    if(!err) {
                        logger.debug("Result: " + JSON.stringify(result));
                    } else {
                        logger.error(err);
                        throw new Error(err);
                    }
                });

                if (callback) {
                    callback(data);
                }
            } else {
                logger.error("no collection defined or not connected to db.");
            }
            return data;
        };

        this.remove = function(query, callback) {
            var ret = {};
            if (this.collection && this.connected) {
                logger.debug("The query: " + query);
                const myQuery = query;
                if (Augmented.isFunction(query)) {
                    myQuery = query();
                }
                this.collection.remove(myQuery, function(err, results) {
                    if(!err) {
                        if (callback) {
                            callback();
                        }
                    } else {
                        logger.error(err);
                        throw new Error(err);
                    }
                });
            } else {
                logger.error("no collection defined or not connected to db.");
            }
            return ret;
        };
    };

    Augmented.Service.MongoDataSource.prototype = Object.create(Augmented.Service.DataSource.prototype);
    Augmented.Service.MongoDataSource.prototype.constructor = Augmented.Service.MongoDataSource;

    /**
     * The SOLR datasource instance class
     * @constructor SOLRDataSource
     * @implements {Augmented.Service.DataSource}
     * @augments Augmented.Service.DataSource
     * @memberof Augmented.Service
     */
    Augmented.Service.SOLRDataSource = function(client) {
        Augmented.Service.DataSource.call(client, this,arguments);

        this.getConnection = function(url, collection) {
            this.connected = false;
            var that = this;
            if (this.client && !this.connected) {
                this.client.ping(function(err, db){
                   if(!err) {
                       logger.debug("collection: " + collection);
                       that.collection = collection;
                       that.db = db;
                       that.url = url;
                       that.connected = true;
                       that.style = "search";
                   } else {
                       logger.error(err);
                       throw new Error(err);
                   }
                });
            } else {
                logger.error("no client was passed.");
            }
            return this.connected;
        };

        this.closeConnection = function() {
            if (this.db && this.connected) {
                this.connected = false;
                this.db = null;
                this.collection = null;
            }
        };

        this.query = function(query, callback) {
            var ret = {};

            return ret;
        };

        this.insert = function(data, callback) {
            var ret = {};

            return ret;
        };

        this.update = function(query, data, callback) {

            return data;
        };

        this.remove = function(query, callback) {
            var ret = {};

            return ret;
        };
    };

    Augmented.Service.SOLRDataSource.prototype = Object.create(Augmented.Service.DataSource.prototype);
    Augmented.Service.SOLRDataSource.prototype.constructor = Augmented.Service.SOLRDataSource;

    /**
     * The datasource factory to return an instance of a datasource configured by type
     * @namespace DataSourceFactory
     * @memberof Augmented.Service
     */
    Augmented.Service.DataSourceFactory = {
        Type: {
            "Memory": "memory",
            "MongoDB": "mongodb",
            "SOLR": "solr"
        },
        getDatasource: function(type, client) {
            if (type === "mongodb") {
                return new Augmented.Service.MongoDataSource(client);
            } else if (type === "solr") {
                return new Augmented.Service.SOLRDataSource(client);
            } else if (type === "memory") {
                return new Augmented.Service.MemoryDataSource(client);
            }
            return null;
        }
    };

    /**
     * Collection class to handle REST</br/>
     *
     * @constructor Augmented.Service.ResourceCollection
     * @memberof Augmented.Service
     */
    Augmented.Service.ResourceCollection = Augmented.Collection.extend({
        /**
         * Collection name for us in a datasource or an identifier
         * @property {string} name The name of the collection
         * @memberof Augmented.Service.ResourceCollection
         */
        name: "collection",
        /**
         * @property {string} url The url for the datasource (if applicable)
         * @memberof Augmented.Service.ResourceCollection
         */
        url: "",
        /**
         * @method setURL Set the url for the ResourceCollection
         * @param {string|function} url The URL or a function to retun a URL object
         * @memberof Augmented.Service.ResourceCollection
         */
        setURL: function(url) {
            this.url = url;
        },

    });

    /**
     * Collection class to handle ORM to a datasource</br/>
     * <em>Note: Datasource property is required</em>
     *
     * @constructor Augmented.Service.EntityCollection
     * @memberof Augmented.Service
     */
    Augmented.Service.Collection = Augmented.Service.EntityCollection = Augmented.Collection.extend({
        /**
         * Collection name for us in a datasource or an identifier
         * @property {string} name The name of the collection
         * @memberof Augmented.Service.EntityCollection
         */
        name: "collection",
        /**
         * The query to use for the query - defaults to "id" selection
         * @method {any} query The query string to use for selection
         * @memberof Augmented.Service.EntityCollection
         */
        query: null,
        /**
         * @property {string} url The url for the datasource (if applicable)
         * @memberof Augmented.Service.EntityCollection
         */
        url: "",
        /**
         * @method initialize Initialize the model with needed wireing
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.EntityCollection
         */
        initialize: function(options) {
            if (options) {
                logger.debug("calling initialize with options: " + JSON.stringify(options));

                if (options.datasource) {
                    this.datasource = options.datasource;
                }
                if (options.query) {
                    this.query = options.query;
                }
                if (options.name) {
                    this.name = options.name;
                }

                if (options.url) {
                    this.url = options.url;
                }
            }
            if (this.datasource && (this.url === "")) {
                this.url =  this.datasource.url;
            }

            this.setDataSourceCollection(this.name);

            this.init(options);
        },
        /**
         * @method init Custom init method for the model (called at initialize)
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.EntityCollection
         */
        init: function(options) {},
        /**
         * @property {Augmented.Service.DataSource} datasource Datasource instance
         * @memberof Augmented.Service.EntityCollection
         */
        datasource: null,
        /**
         * @method setDatasource Set the datasource for the Collection
         * @param {object} datasource The datasource object
         * @memberof Augmented.Service.EntityCollection
         */
        setDatasource: function(datasource) {
            this.datasource = datasource;
        },
        /**
         * @method sync Sync method to handle datasource functions for the Collection
         * @param {string} method the operation to perform
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.EntityCollection
         */
        sync: function(method, options) {
            logger.debug("sync " + method);
            if (this.datasource) {
                var that = this;
                try {
                    var j = {}, q;
                    if (method === "create") {
                        j = this.toJSON();
                        this.datasource.insert(j, function() {
                            that.reset(j);
                            if (options && options.success && (typeof options.success === "function")) {
                                options.success();
                            }
                        });
                    } else if (method === "update") {
                        j = this.toJSON();
                        if (options && options.query) {
                            q = options.query;
                        } else {
                            q = this.query;
                        }

                        this.datasource.update(q, j, function() {
                            //that.reset(j);
                            if (options && options.success && (typeof options.success === "function")) {
                                options.success();
                            }
                        });
                    } else if (method === "delete") {
                        if (options && options.query) {
                            q = options.query;
                        } else {
                            q = this.query;
                        }
                        this.datasource.remove(q, function() {
                            that.reset();
                            if (options && options.success && (typeof options.success === "function")) {
                                options.success();
                            }
                        });
                    } else {
                        // read
                        logger.log("reading");

                        if (options && options.query) {
                            q = options.query;
                        } else {
                            q = this.query;
                        }

                        logger.debug("query " + JSON.stringify(q));
                        this.datasource.query(q, function(data) {
                            that.reset(data);

                            logger.debug("returned: " + JSON.stringify(data));
                            if (options && options.success && (typeof options.success === "function")) {
                                options.success(data);
                            }
                        });
                    }
                } catch(e) {
                    if (options && options.error && (typeof options.error === "function")) {
                        options.error(e);
                    }
                    //throw(e);
                }
            } else {
                logger.warn("no datasource");
            }
            return {};
        },
        /**
         * @method fetch Fetch the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.EntityCollection
         */
        fetch: function(options) {
            this.sync("read", options);
        },
        /**
         * @method save Save the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.EntityCollection
         */
        save: function(options) {
            this.sync("create", options);
        },
        /**
         * @method update Update the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.EntityCollection
         */
        update: function(options) {
            this.sync("update", options);
        },
        /**
         * @method destroy Destroy the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.EntityCollection
         */
        destroy: function(options) {
            this.sync("delete", options);
        },
        setDataSourceCollection: function(name) {
            if (name && Augmented.isString(name) && this.datasource) {
                logger.debug("service: setting collection name: " + name);
                this.name = name;
                this.datasource.setCollection(name);
            }
        }
    });

    /**
     * Entity class to handle ORM to a datasource</br/>
     * <em>Note: Datasource property is required</em>
     *
     * @constructor Augmented.Service.Entity
     * @extends Augmented.Model
     * @memberof Augmented.Service
     */
    Augmented.Service.Entity = Augmented.Model.extend({
        id: "",
        /**
         * The query to use for the query - defaults to "id" selection
         * @method {any} query The query string to use for selection
         * @memberof Augmented.Service.Entity
         */
        query: {},
        /**
         * @property {string|function} url The url for the datasource (if applicable)
         * @memberof Augmented.Service.Entity
         */
        url: "",
        /**
         * @property {string} collection The collection for the datasource (if applicable)
         * @memberof Augmented.Service.Entity
         */
        collection:  "collection",
        /**
         * @method initialize Initialize the model with needed wireing
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Entity
         */
        initialize: function(options) {
            if (options) {
                if (options.collection) {
                    this.collection = options.collection;
                }
                if (options.datasource) {
                    this.datasource = options.datasource;
                }
                if (options.url) {
                    this.url = this.datasource.url;
                }
                if (options.id) {
                    this.id = options.id;
                }
                if (options.query) {
                    this.query = options.query;
                }
            }
            // don't save this as data, but properties via the object base class options copy.
            this.unset("datasource");
            this.unset("url");
            this.unset("query");
            this.unset("collection");
            this.unset("id");
            if (this.datasource) {
                this.datasource.setCollection(this.collection);
            }
            this.init(options);
        },
        /**
         * @method init Custom init method for the model (called at inititlize)
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Entity
         */
        init: function(options) {},
        /**
         * @property {Augmented.Service.DataSource} datasource Datasource instance
         * @memberof Augmented.Service.Entity
         */
        datasource: null,
        /**
         * @method sync Sync method to handle datasource functions for the model
         * @param {string} method the operation to perform
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Entity
         */
        sync: function(method, options) {
            logger.debug("sync " + method);
            if (this.datasource) {
                var that = this;
                try {
                    var j = {}, q;
                    if (method === "create") {
                        j = that.attributes;
                        this.datasource.insert(j, function() {
                            that.reset(j);
                            if (options && options.success && (typeof options.success === "function")) {
                                options.success();
                            }
                        });
                    } else if (method === "update") {
                        j = that.attributes;

                        //logger.debug("The object: " + JSON.stringify(j));

                        if (options && options.query) {
                            q = options.query;
                        } else {
                            q = this.query;
                        }

                        this.datasource.update(q, j, function() {
                            //that.reset(j);
                            if (options && options.success && (typeof options.success === "function")) {
                                options.success();
                            }
                        });
                    } else if (method === "delete") {
                        if (options && options.query) {
                            q = options.query;
                        } else {
                            q = this.query;
                        }
                        this.datasource.remove(q, function() {
                            that.reset();
                            if (options && options.success && (typeof options.success === "function")) {
                                options.success();
                            }
                        });
                    } else {
                        // read
                        logger.debug("reading");

                        if (options && options.query) {
                            q = options.query;
                        } else {
                            q = that.query;
                        }

                        var myQuery = q;
                        if (Augmented.isFunction(q)) {
                            var x = q();
                            logger.debug("x " + x);
                            myQuery = x;
                        }

                        logger.debug("query " + JSON.stringify(myQuery));
                        this.datasource.query(myQuery, function(data) {
                            if (data === null) {
                                throw new Error("No Data Returned!");
                            }
                            if (Array.isArray(data) && data.length > 0) {
                                that.reset(data[0]);
                            } else if (Array.isArray(data) && data.length === 0) {
                                that.reset();
                            } else {
                                that.reset(data);
                            }

                            logger.debug("returned: " + JSON.stringify(data));
                            if (options && options.success && (typeof options.success === "function")) {
                                options.success(data);
                            }
                        });
                    }
                } catch(e) {
                    if (options && options.error && (typeof options.error === "function")) {
                        options.error(e);
                    }
                    //throw(e);
                }
            } else {
                logger.warn("no datasource");
            }
            return {};
        },
        /**
         * @method fetch Fetch the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Entity
         */
        fetch: function(options) {
            this.sync("read", options);
        },
        /**
         * @method save Save the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Entity
         */
        save: function(options) {
            this.sync("create", options);
        },
        /**
         * @method update Update the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Entity
         */
        update: function(options) {
            this.sync("update", options);
        },
        /**
         * @method destroy Destroy the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Entity
         */
        destroy: function(options) {
            this.sync("delete", options);
        }
    });

    /**
     * Resource class to handle REST from Node</br/>
     * <em>Note: URL property is required</em>
     *
     * @constructor Augmented.Service.Resource
     * @extends Augmented.Model
     * @memberof Augmented.Service
     */
    Augmented.Service.Resource = Augmented.Model.extend({
        /**
         * @property {string} secure The secure flag
         * @memberof Augmented.Service.Resource
         */
        secure: false,

        id: "",
        /**
         * @property {string} url The url for the REST Service
         * @memberof Augmented.Service.Resource
         */
        url: "",
        /**
         * @method initialize Initialize the model with needed wiring
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Resource
         */
        initialize: function(options) {
            //logger.log("initialize");
            if (options && options.url) {
                this.url = options.url;
            }
            // don't save this as data, but properties via the object base class options copy.
            this.unset("url");
            this.init(options);
        },
        /**
         * @method init Custom init method for the model (called at inititlize)
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Resource
         */
        init: function(options) {},
        /**
         * @method fetch Fetch the Resource
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Resource
         */
        fetch: function(options) {
            this.sync("read", options);
        },
        /**
         * @method sync Sync method to handle REST functions for the model
         * @param {string} method the operation to perform
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Resource
         */
        sync: function(method, options) {
            logger.debug("sync " + method);
            if (this.url) {
                var that = this, success, error;
                if (options && options.success && (typeof options.success === "function")) {
                    success = options.success;
                }
                if (options && options.error && (typeof options.error === "function")) {
                    error = options.error;
                }

                try {
                    var j = {}, q, u = (typeof this.url === "function") ? this.url() : this.url;
                    if (method === "create") {
                        j = that.attributes;
                        var options = {
                            path: u,
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            }
                        };
                        const h = (this.secure) ? https : http;

                        var req = h.request(options, function(res) {
                            logger.debug("Status: " + res.statusCode);
                            logger.debug("Headers: " + JSON.stringify(res.headers));
                            res.setEncoding("utf8");
                            res.on("data", function (body) {
                                logger.debug("Body: " + body);
                            });

                            res.once("end", function() {
                                if (success) {
                                    success(req.statusCode);
                                }
                            });
                        });
                        req.on("error", function(e) {
                            logger.error("problem with request: " + e.message);
                            if (error) {
                                error(500, e);
                            }
                        });
                        // write data to request body
                        req.write(that.toJSON());
                        req.end();

                    } else if (method === "update") {
                        j = that.attributes;
                        var options = {
                            path: u,
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                            }
                        };

                        const h = (this.secure) ? https : http;

                        var req = h.request(options, function(res) {
                            logger.debug("Status: " + res.statusCode);
                            logger.debug("Headers: " + JSON.stringify(res.headers));
                            res.setEncoding("utf8");
                            res.on("data", function (body) {
                                logger.debug("Body: " + body);
                            });

                            res.once("end", function() {
                                if (success) {
                                    success(req.statusCode, req.statusMessage);
                                }
                            });
                        });
                        req.on("error", function(e) {
                            logger.error("problem with request: " + e.message);
                            if (error) {
                                error(req.statusCode, e);
                            }
                        });
                        // write data to request body
                        req.write(that.toJSON());
                        req.end();

                    } else if (method === "delete") {
                        var options = {
                            path: u,
                            method: "DELETE"
                        };

                        const h = (this.secure) ? https : http;

                        var req = h.request(options, function(res) {
                            logger.debug("Status: " + res.statusCode);
                            res.setEncoding("utf8");
                            res.once("end", function() {
                                if (success) {
                                    success(req.statusCode, req.statusMessage);
                                }
                            });
                        });
                        req.on("error", function(e) {
                            logger.error("problem with request: " + e.message);
                            if (error) {
                                error(500, e);
                            }
                        });
                        req.end();

                    } else {
                        // read
                        logger.debug("reading from " + u);
                        logger.debug("have options? " + (options));

                        const h = (this.secure) ? https : http;

                        h.get(u, function(res) {
                            var body = ""; // Will contain the final response
                            // Received data is a buffer.
                            // Adding it to our body
                            res.on("data", function(data){
                                body += data;
                            });
                            // After the response is completed, parse it and log it to the console

                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                res.once("end", function() {
                                    logger.debug("Got data: " + body);
                                    var parsed = {};
                                    try {
                                         parsed = JSON.parse(body);
                                         that.set(parsed);
                                         if (success) {
                                             success(res.statusCode, res.statusMessage);
                                         }
                                    } catch(e) {
                                        logger.error("Not JSON response, can't add to resource.  Exception: " + e);
                                        if (error) {
                                            error(res.statusCode, e);
                                        }
                                    }
                                });
                            } else {
                                logger.error("Unsuccessfull Fetch - " + res.statusCode + " " + res.statusMessage);
                                if (error) {
                                    error(res.statusCode, res.statusMessage);
                                }
                            }
                        })
                        // If any error has occured, log error to console
                        .once("error", function(e, options) {
                            logger.error("Got error: " + e.message);
                            if (error) {
                                error(500, e);
                            }
                        });
                    }
                } catch(e) {
                    logger.error("Got exception: " + e);
                    if (error) {
                        error(500, e);
                    }
                }
            } else {
                logger.warn("no url");
            }
            return {};
        }
    });

    return Augmented.Service;
}));
