//var process = require('./process');
var token = require('../transfers/yelp_token');
var check = require('../transfers/checker');
var results = require('../transfers/get_results');
var databases = require('../config/databases');
var mongo = require('mongodb').MongoClient;
var cleaner = require('../routes/cleaner');

module.exports = function (request) {
    return function (req, res, next) {

        var city = req.query.city;
        console.log('Obtaining token...');
        token().then(function (tokenz) {
            console.log('Token obtained');
            console.log('Obtaining info...');

            cleaner().then(function () {
                results(tokenz, city).then(function (info) {


                    var count = 0;
                    var len = info.businesses.length;

                    for (var i = 0; i < info.businesses.length; i++) {
                        console.log('Checking : ' + info.businesses[i].name);
                        if (info.businesses[i].name.indexOf('&') >= 0) {
                            // var res = str.replace("Microsoft", "W3Schools");
                            info.businesses[i].name = info.businesses[i].name.replace("&", "and");
                            console.log(info.businesses[i].name);

                        }
                        if (i == len - 1) {
                            check(info).then(function (results) {
                                // console.log(results);//////
                                //////

                                res.header('Cache-Control', 'public, max-age=1000');
                                res.jsonp(info);

                                ////////

                            }).catch(function (error) {
                                console.log('Error in check function');
                                console.log(error.message);
                            });

                        }
                    }




                }).catch(function (error) {
                    console.log(error.message);
                    res.render('../views/error');
                });
            }).catch(function () {
                console.log('Error at cleaner...')
            });

        }).catch(function (error) {
            console.log('Error at obtaining token');
            console.log(error.message);
            res.send('error');
        });
    }
    next();
}
