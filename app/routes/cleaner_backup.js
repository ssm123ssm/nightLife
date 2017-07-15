var mongo = require('mongodb').MongoClient;
var databases = require('../config/databases');

module.exports = function () {

    console.log('In cleaner fn...');

    var promise = new Promise(function (resolve, reject) {
        var timeNow = new Date();
        console.log('Time now is: ' + timeNow);
        mongo.connect(databases.usersURL, function (err, db) {
            if (err) {
                console.log(err.meassage);
            } else {
                var col = db.collection('users');
                col.find({}, {
                    name: 1,
                    _id: 0
                }).toArray(function (err, ress) {
                    console.log(ress);
                    //db.close();
                    var len = ress.length;
                    var count = 0;
                    ress.forEach(function (item) {
                        fix(item.name);
                    });


                    function fix(name) {
                        count++;
                        col.find({
                            name: name
                        }).toArray(function (err, ress) {
                            console.log('Fixing user: ' + name);
                            console.log('Server time now:' + Date.now());
                            console.log('  User time now: ' + Math.abs(Date.now() - ress[0].serverTimeAhead));
                            console.log('Time ahead: ' + ress[0].serverTimeAhead);
                            var userNow = Math.abs(Date.now() - ress[0].serverTimeAhead);
                            ress[0].restTimes.forEach(function (item) {
                                console.log(Object.keys(item)[0]);
                                console.log('On registration user time: ' + item[Object.keys(item)[0]]);
                                var diff = Math.abs(userNow - (item[Object.keys(item)[0]])) / (1000 * 60 * 60);
                                console.log('Difference: ' + diff);

                                var userNowDate = new Date(userNow).getDate();
                                var regDate = new Date(item[Object.keys(item)[0]] - ress[0].serverTimeAhead).getDate();
                                console.log('sdsdsds ' + userNowDate + ' :: ' + regDate);
                                if (diff > 24) {
                                    console.log('Expired...');
                                    /////////////
                                    //REMOVE ENTRY FROM RESS[0].RESTS...
                                    var ret = ress[0];
                                    var ret_ar = [];
                                    var ret_times = [];
                                    for (var i = 0; i < ret.rests.length; i++) {
                                        if (ret.rests[i] != Object.keys(item)[0]) {
                                            ret_ar.push(ret.rests[i]);
                                        }
                                        if (Object.keys(ret.restTimes[i])[0] != Object.keys(item)[0]) {
                                            ret_times.push(ret.restTimes[i]);
                                        }
                                    }
                                    ret.restTimes = ret_times;
                                    ret.rests = ret_ar;
                                    console.log('Going to return array: ' + ret_ar);
                                    delete ret['_id'];
                                    col.update({
                                        id: ret.id
                                    }, ret);
                                    /////////



                                    mongo.connect(databases.dbURL, function (err, db) {




                                        var rest = Object.keys(item)[0];
                                        console.log('Querying in main db: ' + rest);
                                        var col = db.collection('data');
                                        var query = {};
                                        var obj2 = {};
                                        obj2['$exists'] = true;
                                        query[rest] = obj2;
                                        col.find(query, {
                                            '_id': 0
                                        }).toArray(function (err, ress) {

                                            console.log(ress[0]);
                                            ress[0][Object.keys(ress[0])[0]]--;
                                            col.update(query, ress[0]);
                                            console.log(ress[0]);
                                        });



                                    });

                                } else {
                                    if (userNowDate != regDate) {
                                        console.log('Expired...');
                                        /////////////
                                        var ret = ress[0];
                                        var ret_ar = [];
                                        var ret_times = [];
                                        for (var i = 0; i < ret.rests.length; i++) {
                                            if (ret.rests[i] != Object.keys(item)[0]) {
                                                ret_ar.push(ret.rests[i]);
                                            }
                                            if (Object.keys(ret.restTimes[i])[0] != Object.keys(item)[0]) {
                                                ret_times.push(ret.restTimes[i]);
                                            }
                                        }
                                        ret.restTimes = ret_times;
                                        ret.rests = ret_ar;
                                        console.log('Going to return array: ' + ret_ar);
                                        delete ret['_id'];
                                        col.update({
                                            id: ret.id
                                        }, ret);
                                        ///////////////////

                                        mongo.connect(databases.dbURL, function (err, db) {
                                            var rest = Object.keys(item)[0];
                                            console.log('Querying in main db: ' + rest);
                                            var col = db.collection('data');
                                            var query = {};
                                            var obj2 = {};
                                            obj2['$exists'] = true;
                                            query[rest] = obj2;
                                            col.find(query, {
                                                '_id': 0
                                            }).toArray(function (err, ress) {

                                                console.log(ress[0]);
                                                ress[0][Object.keys(ress[0])[0]]--;
                                                col.update(query, ress[0]);
                                                console.log(ress[0]);
                                            });
                                        });



                                    } else {
                                        console.log('Not Expired..');

                                    }
                                }


                                //console.log(it)
                            });
                        });
                    }








                });
            }
            resolve();
        });

        //res.send('OK');

    });
    return promise;

}
