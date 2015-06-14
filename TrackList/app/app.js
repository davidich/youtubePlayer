'use strict';

// Services module setup
angular.module('services', []);

// Controllers module setup
angular.module('controllers', ['services']);

// App module setup
angular.module('app', ['ngRoute', 'controllers', 'services']);
angular.module('app').config([
    '$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/home/:username?', {
                templateUrl: 'app/views/home.html',
                controller: 'HomeCtrl'
            }).
            when('/login/:username?', {
                templateUrl: 'app/views/login.html',
                controller: 'LoginCtrl'
            }).
            otherwise({
                redirectTo: '/login'
            });
    }
]);
