'use strict';

// Directives module setup
angular.module('directives', []);

// Services module setup
angular.module('services', []);

// Controllers module setup
angular.module('controllers', ['services']);

// App module setup
angular.module('app', ['ngRoute', 'ui.bootstrap-slider', 'controllers', 'services', 'directives']);
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
             when('/kickout/:kicker', {
                 templateUrl: 'app/views/kicker.html',
                 controller: 'KickerCtrl'
             }).
            otherwise({
                redirectTo: '/login'
            });
    }
]);
