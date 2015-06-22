'use strict';

angular.module('services').filter('duration', function ($filter) {
    return function (totalSeconds) {
        var time = new Date(2000, 0, 1, 0, 0, parseInt(totalSeconds));
        return $filter("date")(time, "HH:mm:ss");
    };    
});