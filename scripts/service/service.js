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
 * @module Augmented.Service
 * @version 0.4.4
 * @license Apache-2.0
 */
(function(moduleFactory) {
    if (typeof exports === "object") {
	    module.exports = moduleFactory(require("augmentedjs"));
    }
    // AMD and Browser not supported, only Node
    /*else if (typeof define === "function" && define.amd) {
	    define(["augmented"], moduleFactory);
    } else {
	    window.Augmented.Service = moduleFactory(window.Augmented.Service);
    }*/
}(function(Augmented) {
    "use strict";

    var http = require("http");

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
    Augmented.Service.VERSION = "0.4.4";

    /**
     * A private logger for use in the framework only
     * @private
     */
    var logger = Augmented.Logger.LoggerFactory.getLogger(Augmented.Logger.Type.console, Augmented.Configuration.LoggerLevel);

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
    };

    Augmented.Service.MemoryDataSource = function(client) {
        Augmented.Service.DataSource.call(this, client);

        this.getConnection = function(url, collection) {
            this.connected = true;
            this.collection = collection;
            this.db = [];
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
            this.db.put(data);
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

        this.getConnection = function(url, collection) {
            this.connected = false;
            var that = this;
            if (this.client && !this.connected) {
                this.client.connect(url, function(err, db) {
                    if(!err) {
                        logger.debug("collection: " + collection);
                        that.collection = db.collection(collection);
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
                this.collection.find(query).toArray(function(err, results) {
                    if(!err) {
                        logger.debug("Results: " + JSON.stringify(results));


                        if (results && results.length > 0) {
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
                this.collection.update(query, data, function(err, result) {
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
                this.collection.remove(query, function(err, results) {
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
            }
            return null;
        }
    };

    /**
     * Collection class to handle ORM to a datasource</br/>
     * <em>Note: Datasource property is required</em>
     *
     * @constructor Augmented.Service.Collection
     * @memberof Augmented.Service
     */
    Augmented.Service.Collection = Augmented.Collection.extend({
        /**
         * The query to use for the query - defaults to "id" selection
         * @method {any} query The query string to use for selection
         * @memberof Augmented.Service.Collection
         */
        query: null,
        /**
         * @property {string} url The url for the datasource (if applicable)
         * @memberof Augmented.Service.Collection
         */
        url: "",
        /**
         * @method initialize Initialize the model with needed wireing
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Collection
         */
        initialize: function(options) {
            //logger.log("initialize");
            if (options && options.datasource) {
                this.datasource = options.datasource;
                this.url = this.datasource.url;
                this.query = options.query;
            }
            this.init(options);
        },
        /**
         * @method init Custom init method for the model (called at inititlize)
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Collection
         */
        init: function(options) {},
        /**
         * @property {Augmented.Service.DataSource} datasource Datasource instance
         * @memberof Augmented.Service.Collection
         */
        datasource: null,
        /**
         * @method sync Sync method to handle datasource functions for the Collection
         * @param {string} method the operation to perform
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Collection
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

                            logger.debug("returned: " + JSON.stringify(j));
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
         * @memberof Augmented.Service.Collection
         */
        fetch: function(options) {
            this.sync("read", options);
        },
        /**
         * @method save Save the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Collection
         */
        save: function(options) {
            this.sync("create", options);
        },
        /**
         * @method update Update the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Collection
         */
        update: function(options) {
            this.sync("update", options);
        },
        /**
         * @method destroy Destroy the entity
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Collection
         */
        destroy: function(options) {
            this.sync("delete", options);
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
         * @property {string} url The url for the datasource (if applicable)
         * @memberof Augmented.Service.Entity
         */
        url: "",
        /**
         * @method initialize Initialize the model with needed wireing
         * @param {object} options Any options to pass
         * @memberof Augmented.Service.Entity
         */
        initialize: function(options) {
            //logger.log("initialize");
            if (options && options.datasource) {
                this.datasource = options.datasource;
                this.url = this.datasource.url;
                this.query = options.query;
            }
            // don't save this as data, but properties via the object base class options copy.
            this.unset("datasource");
            this.unset("url");
            this.unset("query");
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

                        logger.debug("query " + JSON.stringify(q));
                        this.datasource.query(q, function(data) {
                            logger.debug("Did I even get here??");
                            if (data === {}) {
                                throw new Error("No Data Returned!");
                            }
                            if (Array.isArray(data)) {
                                that.reset(data[0]);
                            } else {
                                that.reset(data);
                            }

                            logger.debug("returned: " + JSON.stringify(j));
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
                        var req = http.request(options, function(res) {
                            logger.debug("Status: " + res.statusCode);
                            logger.debug("Headers: " + JSON.stringify(res.headers));
                            res.setEncoding("utf8");
                            res.on("data", function (body) {
                                logger.debug("Body: " + body);
                            });

                            res.once("end", function() {
                                if (success) {
                                    success();
                                }
                            });
                        });
                        req.on("error", function(e) {
                            logger.error("problem with request: " + e.message);
                            if (error) {
                                error(e);
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
                        var req = http.request(options, function(res) {
                            logger.debug("Status: " + res.statusCode);
                            logger.debug("Headers: " + JSON.stringify(res.headers));
                            res.setEncoding("utf8");
                            res.on("data", function (body) {
                                logger.debug("Body: " + body);
                            });

                            res.once("end", function() {
                                if (success) {
                                    success();
                                }
                            });
                        });
                        req.on("error", function(e) {
                            logger.error("problem with request: " + e.message);
                            if (error) {
                                error(e);
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
                        var req = http.request(options, function(res) {
                            logger.debug("Status: " + res.statusCode);
                            res.setEncoding("utf8");
                            res.once("end", function() {
                                if (success) {
                                    success();
                                }
                            });
                        });
                        req.on("error", function(e) {
                            logger.error("problem with request: " + e.message);
                            if (error) {
                                error(e);
                            }
                        });
                        req.end();

                    } else {
                        // read
                        logger.debug("reading from " + u);
                        logger.debug("have options? " + (options));

                        http.get(u, function(res) {
                            var body = ""; // Will contain the final response
                            // Received data is a buffer.
                            // Adding it to our body
                            res.on("data", function(data){
                                body += data;
                            });
                            // After the response is completed, parse it and log it to the console
                            res.once("end", function() {
                                var parsed = JSON.parse(body);
                                logger.debug("Got data: " + body);
                                that.set(parsed);
                                //logger.debug("now have options? " + (success));
                                if (success) {
                                    success();
                                }
                            });
                        })
                        // If any error has occured, log error to console
                        .once("error", function(e, options) {
                            logger.error("Got error: " + e.message);
                            if (error) {
                                error(e);
                            }
                        });
                    }
                } catch(e) {
                    logger.error("Got exception: " + e);
                    if (error) {
                        error();
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
