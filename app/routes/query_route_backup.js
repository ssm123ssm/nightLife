//var process = require('./process');
var token = require('../transfers/yelp_token');
var results = require('../transfers/get_results');
var databases = require('../config/databases');
var mongo = require('mongodb').MongoClient;

module.exports = function (request) {
    return function (req, res, next) {

        var city = req.query.city;
        console.log('Obtaining token...');
        token().then(function (tokenz) {
            console.log('Token obtained');
            console.log('Obtaining info...');
            results(tokenz, city).then(function (info) {


                //res.render('../views/info', {info:info});

                //Results obtained
                mongo.connect(databases.dbURL, function (err, db) {

                    function toDb(info, callback, callback2) {
                        for (var i = 0; i < info.businesses.length; i++) {
                            var obj = info.businesses[i];
                            var docName = info.businesses[i].name;
                            // console.log('current doc: ' + docName);
                            callback(docName, obj);
                        }
                        callback2(info);
                    }

                    function callback2(info) {
                        for (var i = 0; i < info.businesses.length; i++) {
                            console.log(info.businesses[i]);
                        }
                    }

                    function callback(docName, obj) {
                        var col = db.collection('data');
                        var insertion = {};
                        var obj1 = docName;
                        var obj2 = {};
                        obj2['$exists'] = true;
                        insertion[docName] = obj2;
                        col.find(insertion).toArray(function (err, ress) {
                            if (ress.length == 0) {
                                console.log(docName + ' : NOT FOUND');
                                var insertion = {};
                                insertion[docName] = 0;
                                col.insert(insertion);
                                obj['going'] = 0;
                            } else {
                                /*obj['going'] = ress[0][info.businesses[i].name];*/
                                console.log(docName + ' : EXISTS');
                                var going_val = obj['going'];
                                obj['going'] = 1;
                                /*console.log('going val :' + going_val);*/
                            }
                        });
                    }
                    if (err) {
                        //Handle
                        console.log('Error on connecting to data db');
                    } else {

                        console.log('connected to db and collection');

                        toDb(info, callback, callback2);

                        res.header('Cache-Control', 'public, max-age=1000');
                        res.jsonp(info);


                    }
                });





                /////////////////////////////////////


            }).catch(function (error) {
                console.log('Error at obatining results obj');
                res.render('../views/error');
            });

        }).catch(function (error) {
            console.log('Error at obtaining token');
            res.send('error');
        });
    }
    next();
}
