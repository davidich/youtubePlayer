'use strict';

angular.module('controllers').controller('HomeCtrl', function ($scope, $route, $location, $timeout, $interval, hub, ytPlayer) {

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
    $scope.tracks = [];
    $scope.users = [];

    $scope.currentTrack = {
        id: 0,
        time: 0,
        length: 0,
        imageUrl: 0
    };

    $scope.playerVolume = 100;

    ytPlayer.init("playerId").then(function () {
        $scope.player = ytPlayer;

        $(ytPlayer).on("stateChanged", function (e, state) {
            $scope.currentTrack.time = state && state.time || 0;
            $scope.currentTrack.length = state && state.length || 0;
            $scope.$digest();

        });

        $scope.$on("$destroy", function () {
            $(ytPlayer).off("stateChanged");
        });

        $scope.$watch("playerVolume", function () {
            ytPlayer.setVolume($scope.playerVolume);
        });

        $scope.broadcastVolumeValue = function () {
            onStateChanged();
        };
    });
    

    function onStateChanged() {
        //notify other clients
        console.log($scope.playerState);
    }
    
    // Define Client Callbacks
    function onUserListUpdated(data) {
        $scope.users = data;
        $scope.$digest();
    }

    function onTrackListUpdated(data) {
        $scope.tracks = data;
        $scope.$digest();

        if (data.length > 0 && $scope.tracks.length === 0)
            playNext();        
    }

    //function onRemainingTimeUpdated(value) {
    //    $scope.trackTime = value;
    //    $scope.$digest();
    //}

    hub.setCallbacks({
        updateUserList: onUserListUpdated,
        updatePlaylist: onTrackListUpdated,
        //updateRemainingTime: onRemainingTimeUpdated
    });
    // .Define Client Callbacks

    // Fetch initial data
    hub.getInitialDataAsync()
        .done(function (data) {
            onTrackListUpdated(data.Playlist);
            onUserListUpdated(data.Users);
        });


    function playNext() {
        $scope.playerState.currentTrackId = $scope.tracks[0] && $scope.tracks[0].Id;

        //if (track)
        //    $scope.currentTrack = track;
        //else {
            $scope.currentTrack = {
                Info: {
                    ImageUrl: "/Content/No_image_available.png",
                    Title: "",
                    Duration: "00:00:00"
                }
            }
        //}

        if (hub.getUsername() === "oleksiy") play(track);
    }

    $scope.playPauseTrack = function (track) {
        if ($scope.currentTrack.id == track.Id) {
            $scope.player.playPause();
        } else {
            $scope.currentTrack.id = track.Id;
            $scope.currentTrack.time = 0;
            $scope.currentTrack.length = track.Info.TotalSeconds;
            $scope.currentTrack.imageUrl = track.Info.ImageUrl;
            $scope.player.loadAndPlay(track.Id);
        }
    }

    $scope.playPause = function () {
        $scope.player.playPause();
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

