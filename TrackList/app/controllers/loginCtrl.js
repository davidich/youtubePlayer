'use strict';

angular.module('controllers').controller('LoginCtrl', function ($scope, $route, $location, hub, toaster) {

    $scope.username = $route.current.params.username;

    $scope.login = function () {
        // prevent form updates
        $scope.isFormLocked = true;

        hub.initAsync($scope.username).then(function() {
            $location.path("/home/" + $scope.username);

            $scope.username = "";
            $scope.isFormLocked = false;
        });
    };
});
