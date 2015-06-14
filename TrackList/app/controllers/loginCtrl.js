'use strict';

angular.module('controllers').controller('LoginCtrl', function ($scope, $route, $location, hub) {

    $scope.username = $route.current.params.username;

    $scope.login = function () {
        // prevent form updates
        $scope.isFormLocked = true;

        hub.initAsync().then(function() {
            return hub.setUsername($scope.username);
        }).then(function(setUsernameResult) {
            if(setUsernameResult == "OK")
                $location.path("/home/" + $scope.username);
            else {
                alert(setUsernameResult || "Error has occured during an attempt to log in");
            }
        }).always(function () {
            $scope.$apply(function () {
                $scope.username = "";
                $scope.isFormLocked = false;
            });
        });
    };
});
