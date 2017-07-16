var request = require('request');

module.exports = function (token, city) {

    var url = 'https://api.yelp.com/v3/businesses/search?categories=bars&location=' + city;
    var headers = {
        'Authorization': 'Bearer ' + token
    };
    var options = {

        //proxy: 'http://cachex.pdn.ac.lk:3128',
        url: url,
        headers: headers
    };

    var promise = new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            if (!error) {
                var info = JSON.parse(body);
                console.log('Got info');
                resolve(info);
            } else {
                reject(error);
            }
            //return info;
        });
    });

    return promise;

}
