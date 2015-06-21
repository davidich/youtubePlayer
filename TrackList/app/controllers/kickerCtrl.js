'use strict';

angular.module('controllers').controller('KickerCtrl', function ($scope, $route) {
    $scope.kicker = $route.current.params.kicker;

    $scope.goHome = function() {
        window.location.href = location.origin;
    }
});
