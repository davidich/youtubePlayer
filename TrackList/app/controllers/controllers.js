'use strict';

/* Controllers */

var controllers = angular.module('controllers', ['services']);

controllers.controller('LoginCtrl', function ($scope, $location, signalR, user) {
    $scope.login = function () {
        // set user name
        user.name = $scope.username;

        // prevent form updates
        $scope.isFormLocked = true;

        // go to home page
        $location.path("/home/" + user.name);
    };
});

controllers.controller('HomeCtrl', function ($scope, $route, $location, $timeout, $interval, signalR, user) {
    if (user.name != $route.current.params.username) {
        user.name = $route.current.params.username;
    }

    if (!user.isValid()) {
        $location.path("/login");
        return;
    }

    signalR.init(function () {
        signalR.triggerPlaylistUpdate();
    });

    $scope.user = user;
    $scope.currentTrack = {};
    $scope.trackTime = "0:00";
    $scope.tracks = [];

    signalR.setPlaylistUpdateCallback(function (data) {
        console.log("setPlaylistUpdateCallback:");
        console.log(data);
        console.log("-------------");

        if (data.length == 0)
            setCurrentTrack(undefined);
        else if ($scope.tracks.length == 0 || $scope.tracks[0].Id != data[0].Id)
            setCurrentTrack(data[0]);

        $scope.tracks = data;

        $scope.$digest();
    });

    signalR.setTimeUpdateCallback(function(value) {
        $scope.trackTime = value;
        $scope.$digest();
    });

    function setCurrentTrack(track) {
        console.log("setCurrentTrack:");
        console.log(track);
        console.log("-------------");

        if (track)
            $scope.currentTrack = track;
        else {
            $scope.currentTrack = {
                Info: {
                    ImageUrl: "/Content/No_image_available.png",
                    Title: "",
                    Duration: "00:00:00"
                }
            }
        }

        if (user.name === "oleksiy" && track)
            play(track);
    }

    var intervalHandle;

    function stopTimer() {
        if (angular.isDefined(intervalHandle)) {
            $interval.cancel(intervalHandle);
            intervalHandle = undefined;
        }
    }

    function getTotalSeconds(duration) {
        var res = duration.match(/(\d+):(\d+):(\d+)/);
        var hours = parseInt(res[1]);
        var minutes = parseInt(res[2]);
        var seconds = parseInt(res[3]);

        return hours * 3660 + minutes * 60 + seconds;
    }

    function getDuration(inputInSecs) {
        var result = "";

        var hours = parseInt(inputInSecs / 3600);
        var minutes = parseInt(inputInSecs % 3600 / 60);
        var seconds = inputInSecs % 60;

        if (hours > 0) {
            result += (hours + ":");
        }

        result += (minutes + ":");

        if (seconds < 10) {
            result += "0";
        }
        result += seconds;

        return result;

    }

    function play(track) {
        console.log("play:");
        console.log(track);
        console.log("-------------");

        $("#player").attr("src", track.Info.AdFreeUrl);

        stopTimer();

        var durationInSecs = getTotalSeconds(track.Info.Duration);

        intervalHandle = $interval(function () {
            if (durationInSecs > 0) {
                durationInSecs--;                
            } else {
                $("#player").attr("src", "");
                stopTimer();
                moveNext();
            }

            $scope.trackTime = getDuration(durationInSecs);
            signalR.updateRemainingTime($scope.trackTime);

        }, 1000);
    }

    function moveNext() {
        console.log("moveNext: Length = " + $scope.tracks.length);
        console.log("-------------");

        // remove current track
        if ($scope.tracks.length > 0)
            $scope.tracks.splice(0, 1);

        // play next
        setCurrentTrack($scope.tracks[0]);

        // report to server
        signalR.moveNext();
    }

    $scope.addUrl = function () {
        if ($scope.addTrackForm.$invalid)
            return;

        var url = $scope.newTrackUrl;
        signalR.sendUrl(url);
        $scope.newTrackUrl = "";
    }

    $scope.prefill = function () {
        signalR.sendUrl("https://www.youtube.com/watch?v=uU8Gv46o9WA");
        signalR.sendUrl("https://www.youtube.com/watch?v=knNCvqKWRws");
        //signalR.sendUrl("https://www.youtube.com/watch?v=LDwbMUjpqos");
    }

    $scope.moveNext = moveNext;
});

