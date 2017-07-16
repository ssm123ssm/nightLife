var mongo = require('mongodb').MongoClient;
var databases = require('../config/databases');

module.exports = function (info) {
    var rett = info;

    var promise = new Promise(function (resolve, reject) {

        var len = info.businesses.length;
        var count = 0;
        mongo.connect(databases.dbURL, function (err, db) {
            if (err) {
                console.log(err.message);
            } else {
                var col = db.collection('data');

                function checkdb(query) {
                    col.find(query).toArray(function (err, ress) {
                        count++;

                        //console.log(query);
                        if (ress.length == 0) {
                            for (var i = 0; i < info.businesses.length; i++) {
                                if (info.businesses[i].name == Object.keys(query)[0]) {
                                    info.businesses[i]['going'] = 0;
                                    var insertion = {};
                                    insertion[Object.keys(query)[0]] = 0;
                                    col.insert(insertion);
                                    if (count == len) {
                                        // console.log(info.businesses[0]);
                                        resolve(info);
                                    }
                                }
                            }
                        } else {
                            var val = ress[0][Object.keys(query)[0]];
                            for (var i = 0; i < info.businesses.length; i++) {
                                if (info.businesses[i].name == Object.keys(query)[0]) {
                                    info.businesses[i]['going'] = val;
                                    if (count == len) {
                                        // console.log(info.businesses[0]);
                                        resolve(info);
                                    }
                                }
                            }
                        }
                    });
                }
                for (var i = 0; i < len; i++) {
                    var query = {};
                    var obj2 = {};
                    obj2['$exists'] = true;
                    query[info.businesses[i].name] = obj2;
                    checkdb(query);

                }
            }
        });

    });

    return promise;

}
