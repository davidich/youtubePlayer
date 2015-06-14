'use strict';

/* App Module */

var app = angular.module('app', [
  'ngRoute',
  'controllers',
  'services'
]);

app.config([
    '$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/home/:username?', {
                templateUrl: 'app/views/home.html',
                controller: 'HomeCtrl'
            }).
            when('/login', {
                templateUrl: 'app/views/login.html',
                controller: 'LoginCtrl'
            }).
            otherwise({
                redirectTo: '/login'
            });
    }
]);
