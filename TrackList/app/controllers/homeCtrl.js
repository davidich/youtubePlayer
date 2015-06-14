'use strict';

angular.module('controllers').controller('HomeCtrl', function ($scope, $route, $location, $timeout, $interval, hub) {
    if (!hub.isConnected()) {
        var loginPath = "/login";
        if ($route.current.params.username) {
            loginPath += "/" + $route.current.params.username;
        }
        $location.path(loginPath);
        return;
    }
    $scope.hub = hub;
    $scope.username = hub.getUsername();
    $scope.currentTrack = {};
    $scope.trackTime = "0:00";
    $scope.tracks = [];
    $scope.users = [];

    // Define Client Callbacks
    function onUserListUpdated(data) {
        console.log("onUserListUpdated:");
        console.log(data);
        console.log("-------------");

        $scope.users = data;
        $scope.$digest();
    }

    function onTrackListUpdated(data) {
        console.log("setPlaylistUpdateCallback:");
        console.log(data);
        console.log("-------------");

        if (data.length == 0)
            setCurrentTrack(undefined);
        else if ($scope.tracks.length == 0 || $scope.tracks[0].Id != data[0].Id)
            setCurrentTrack(data[0]);

        $scope.tracks = data;
        $scope.$digest();
    }

    function onRemainingTimeUpdated(value) {
        $scope.trackTime = value;
        $scope.$digest();
    }

    hub.setCallbacks({
        updateUserList: onUserListUpdated,
        updatePlaylist: onTrackListUpdated,
        updateRemainingTime: onRemainingTimeUpdated
    });
    // .Define Client Callbacks

    // Fetch initial data
    hub.getInitialDataAsync()
        .done(function (data) {
            onTrackListUpdated(data.Playlist);
            onUserListUpdated(data.Users);
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

        if (hub.getUsername() === "oleksiy") play(track);
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
        if (!track) {
            $("#player").attr("src", "");
            return;
        }
        
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
            hub.updateRemainingTime($scope.trackTime);

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
        hub.moveNext();
    }

    $scope.addUrl = function () {
        if ($scope.addTrackForm.$invalid)
            return;

        var url = $scope.newTrackUrl;
        hub.sendUrl(url);
        $scope.newTrackUrl = "";
    }

    $scope.prefill = function () {
        hub.sendUrl("https://www.youtube.com/watch?v=uU8Gv46o9WA");
        hub.sendUrl("https://www.youtube.com/watch?v=knNCvqKWRws");
        //signalR.sendUrl("https://www.youtube.com/watch?v=LDwbMUjpqos");
    }

    $scope.moveNext = moveNext;
});

