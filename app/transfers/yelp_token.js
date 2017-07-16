var request = require('request');
module.exports = function () {
    //Yelp Token

    var get_token_endpoint = 'https://api.yelp.com/oauth2/token?client_id=5qRbTw2Qnwso694l8eNs3g&client_secret=837bYZvTWRfstGFCeTZx7bZNpHlhZbbkZuO4rQquJhkSYkovURPbj3SGZEn5P0kX';

    var options = {
        url: get_token_endpoint,
        //proxy: 'http://cachex.pdn.ac.lk:3128',
        //PROXY
        // 'proxy':'http://cachex.pdn.ac.lk:3128',
        'method': 'POST',
        'headers': {
            'content-type': 'application/x-www-form-urlencoded'
        }
    }

    /*request(options,function(error, response, body) {
        if (!error) {
            var token = JSON.parse(body).access_token;
            console.log('Token taken by transfer is : ' + token);
            return token;
        }
        if(error){
            console.log(error);
            return error;
        }
    });*/

    var ret = new Promise(function (resolve, reject) {

        request(options, function (error, response, body) {
            if (!error) {
                var token = JSON.parse(body).access_token;
                resolve(token);
            }
            if (error) {
                reject(error);
            }
        });

    });
    return ret;

}
