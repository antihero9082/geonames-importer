/*
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * This software consists of voluntary contributions made by many individuals
 * and is licensed under the MIT license.
 */

var MongoClient = require('mongodb').MongoClient,
    fs = require('fs'),
    csv = require('csv'),
    argv = require('optimist')
        .usage('Usage: $0 -f [file] -u [url] -c [collection]')
        .demand(['f', 'u', 'c'])
        .alias('f', 'file')
        .describe('f', 'The path to the geonames file, i.e. US.txt')
        .alias('u', 'url')
        .describe('u', 'The url connection string for MongoDB (must include database).')
        .default('u', 'mongodb://localhost:27017/geonames')
        .alias('c', 'collection')
        .describe('c', 'The mongo collection.')
        .default('c', 'zips')
        .argv;

function Importer(file, mongoUrl, collection) {
    this.file = file;
    this.mongoUrl = mongoUrl;
    this.collection = collection;
}

/**
 * Imports & saves zip code data.
 */
Importer.prototype.import = function() {
    var self = this;

    console.log('Importing geonames zip codes...');
    MongoClient.connect(this.mongoUrl, function(error, db) {
        if (error) {
            throw error;
        }

        var collection = db.collection(self.collection);
        collection.ensureIndex( { zip: 1 }, { unique: 1, dropDups: true }, function(error) {
            if (error) {
                throw error;
            }

            collection.ensureIndex( { loc: '2d' }, function(error) {
                if (error) {
                    throw error;
                }

                self.parseFile(collection);
            });
        });
    });
};

/**
 * Saves a zip code & it's data to the configured mongo database & collection.
 *
 * @param collection
 * @param data
 */
Importer.prototype.save = function(collection, data) {
    collection.update({ zip: data.zip }, data, { upsert: true }, function(error) {
        if (error) {
            throw error;
        }
    });
};

/**
 * Parses the TSV file.
 */
Importer.prototype.parseFile = function(collection) {
    var self = this;

    csv()
        .fromPath(self.file, {
            delimiter : '\t',
            columns : [
                'country', 'zip', 'city', 'state_long', 'state', 'admin_name2', 'admin_code2',
                'admin_name3', 'admin_code3', 'latitude', 'longitude', 'accuracy'
            ]
        })
        .transform(function(data) {
            return {
                city:  data.city,
                state: data.state,
                zip:   data.zip,
                loc: [
                    parseFloat(data.longitude),
                    parseFloat(data.latitude)
                ]
            };
        })
        .on('data', function(data) {
            self.save(collection, data);
        })
        .on('end', function(count) {
            console.log('Finished importing "' + count + '" zip codes!');
            process.exit();
        });
};

var importer = new Importer(argv.file, argv.url, argv.collection);
importer.import();