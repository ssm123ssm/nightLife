var myApp = angular.module('myApp', ["ngRoute"]);
myApp.controller('testController', ['$scope', fun]);

myApp.config(function ($routeProvider) {
    $routeProvider.when('/res', {
        templateUrl: 'res.html',
        controller: 'testController'
    });
});

$.ajaxSetup({
    cache: false
});

function fun($scope) {
    $scope.info;
    $scope.func = function () {


        if ($('#city').val() != '') {
            $.cookie('city', $('#city').val());

            gett().then(function (info) {
                //$.cookie($('#city').val, info);
                $scope.$apply(function () {

                    $scope.info = info.businesses;
                });

                console.log(info);
            }).catch(function () {
                alert('No entry found!');
            });
        } else {
            alert('Please enter a city!');
        }


    }
    $scope.going = function (x) {

        //window.location.replace('/login?city=' + $.cookie('city'));
        //Checking if user already logged in

        $.getJSON('/isLogged', function (json) {
            if (json.state == 'authorized') {

                for (var i = 0; i < $scope.info.length; i++) {
                    if ($scope.info[i].name == x.name) {
                        //Check if the user has marked going already
                        $.getJSON('/isGoing?city=' + $.cookie('city') + '&name=' + x.name + '&time=' + Date.now(), function (json) {
                            //alert(Date.now());
                            if (json.isGoing) {
                                //alert('Already marked going');

                                for (var i = 0; i < $scope.info.length; i++) {
                                    if (x.name == $scope.info[i].name) {
                                        $scope.$apply(function () {
                                            $scope.info[i].going--;
                                        })
                                    }
                                }
                                /////////////
                                setTimeout(function () {
                                    //$('#btn').trigger('click');
                                });

                                //TODO sdsd

                                ////////////
                                //If going already
                                // decrease ng count
                                //update db
                                //update users
                            } else {
                                //alert('Marking going now');
                                for (var i = 0; i < $scope.info.length; i++) {
                                    if (x.name == $scope.info[i].name) {
                                        $scope.$apply(function () {
                                            $scope.info[i].going++;
                                        })
                                    }
                                }
                                ///////////
                                setTimeout(function () {
                                    //$('#btn').trigger('click');
                                });
                                ///////////
                                //If not marked going
                                //increase ng count
                                //update db
                                //update users
                            }
                        });

                    }
                }


            } else {
                alert('Not logged in');
                $.cookie('fromLog', true);
                window.location.replace('/login?city=' + $.cookie('city'));
            }
        });

    };

    $scope.init = function () {
        $('#city').val($.cookie('city'));
        if ($.cookie('fromLog')) {
            setTimeout(function () {
                $('#btn').trigger('click');
            });
            $.removeCookie('fromLog');
        }
    }
}


$(document).ready(function () {

});

function gett() {

    $('.loader').html('<i class=\"fa fa-cog fa-spin fa-3x fa-fw\"></i>');

    var promise = new Promise(function (resolve, reject) {

        var post = $.ajax({
            async: 'false',
            url: "/query?city=" + $('#city').val(),
            type: "GET"
        });
        post.done(function (json) {
            $('.loader').html('Done');
            window.location.replace('/#!/res');
            $('.results').css('display', 'block');
            $('html, body').animate({
                scrollTop: $('.results').offset().top
            }, 1000);
            resolve(json);
        });

        post.fail(function (json) {
            $('.loader').html('Error');
            window.alert('failed');
            reject('error');
        });

    });

    return promise;
}
