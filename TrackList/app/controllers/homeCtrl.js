'use strict';

angular.module('controllers').controller('HomeCtrl', function ($scope, $route, $location, $timeout, $interval, hub, youtubeApi, toaster) {
    var trackCounters = {};
    $scope.trackCounters = trackCounters;

    $scope.isInited = false;
    $scope.username = $route.current.params.username;
    $scope.tracks = [];
    $scope.users = [];

    $scope.playerState = {
        mode: "STOPPED",    // "STOPPED", "PLAYING", "PAUSED"
        time: 0,            // cur track time in secs
        length: 0,          // cur track length in secs
        //volume: 100,        // 0 - 100
        trackId: undefined,
        title: function () {
            if (!$scope.playerState.trackId)
                return "";
            else
                return getTrackById($scope.playerState.trackId).info.title;
        },
        imageUrl: function () {
            return !$scope.playerState.trackId
                ? 'Content/No_image_available.png'
                : getTrackById($scope.playerState.trackId).info.imageUrl;
        }
    }

    $scope.playerVolume = 100;

    if (!$scope.username) {
        $location.path("/login");
        return;
    }

    // INIT
    hub.client.updateUserList = onUserListUpdate;

    hub.client.updatePlayList = onTrackListUpdate;

    hub.client.notifyAboutRemoval = onTrackRemoved;

    hub.client.updatePlayerState = onPlayerStateUpdated;

    hub.client.requestPlayPause = onPlayPauseRequested;

    hub.client.requestPlayNext = onPlayNextRequested;

    hub.client.updateVolume = onVolumeUpdated;

    hub.initAsync($scope.username).then(function () {
        if (!hub.isMain()) {
            hub.triggerDataUpdate();
            $scope.isInited = true;
        } else {
            youtubeApi.init("playerId").then(function () {
                $scope.player = youtubeApi;

                $(youtubeApi).on("stateChanged", function (e, state) {
                    notifyAboutPlayerStateUpdate(state);
                });

                $(youtubeApi).on("trackEnded", function () {
                    playNext();
                });

                $scope.$on("$destroy", function () {
                    $(youtubeApi).off("stateChanged");
                    $(youtubeApi).off("trackEnded");
                    youtubeApi.destroy();
                });

                // player is inited => can trigger initial data receival
                hub.triggerDataUpdate();
                $scope.isInited = true;
            });
        }
    });
    // .INIT


    // Private methods
    function onVolumeUpdated(value) {
        $scope.playerVolume = value;

        if (hub.isMain()) {
            youtubeApi.setVolume(value);            
        }
    }
    function onPlayPauseRequested(id) {
        if (hub.isMain()) {
            playPause(id);
        }
    }

    function onPlayNextRequested() {
        if (hub.isMain()) {
            playNext();
        }
    }

    function onPlayerStateUpdated(state) {
        //$scope.$apply(function () {
        if (state) {
            angular.extend($scope.playerState, state);
        } else {
            angular.extend($scope.playerState, {
                mode: "STOPPED",
                length: 0,
                time: 0,
                trackId: undefined
            });
        }
        //});

        if (!$scope.$$phase)
            $scope.$digest();

        //console.log(angular.toJson($scope.playerState));
    }

    function notifyAboutPlayerStateUpdate(changeValues) {
        var resultState = angular.extend({}, $scope.playerState, changeValues);
        hub.notifyAboutPlayerStateUpdate(resultState);
    }

    function onUserListUpdate(userList) {
        $scope.$apply(function () {
            $scope.users = userList;
        });
    }

    function onTrackListUpdate(trackList) {
        $scope.$apply(function () {
            var isTrackListEmpty = $scope.tracks.length == 0;
            $scope.tracks = trackList;

            if (hub.isMain()) {
                _syncTrackCounters();

                if (isTrackListEmpty && trackList.length > 0) {
                    playNext();
                }
                else if (trackList.length == 0) {
                    youtubeApi.stop();
                    onPlayerStateUpdated(null);
                }
            }
        });
    }

    function onTrackRemoved(removerName, track) {
        var title = trimTrackTitle(track.info.title);
        toaster.success("[" + removerName + "] removed track", title);

        if (hub.isMain()) {
            if (track.id === $scope.playerState.trackId)
                playNext();
        }
    }

    function trimTrackTitle(title) {
        return title.length > 25
                    ? title.substr(0, 25) + "..."
                    : title;
    }

    function getTrackById(id) {
        if (!id) return undefined;

        var foundTracks = $.grep($scope.tracks, function (elem) { return elem.id === id; });

        return foundTracks.length == 0
            ? undefined
            : foundTracks[0];
    }

    function addUrl() {
        if ($scope.addTrackForm.$invalid) {
            toaster.warning({ title: "Wrong URL", body: "Please, provide correct URL for youtube video." });
            return;
        }
        var url = $scope.newTrackUrl;
        $scope.newTrackUrl = "";

        hub.addUrlAsync(url)
            .then(function (videoInfo) {
                var title = trimTrackTitle(videoInfo.title);
                toaster.success(title, "Track is added successfully");
            }).catch(function (error) {
                toaster.error("An error has occured", error);
            });
    }

    function requestTrackRemoval(track) {
        track.isRemoved = true;

        hub.removeTrackAsync(track.id)
            .catch(function (error) {
                toaster.error("An error has occured", error);
            });
    }

    function _syncTrackCounters() {
        // add missing tracks into counter dictionary
        angular.forEach($scope.tracks, function (track) {
            if (trackCounters[track.id] === undefined) {
                trackCounters[track.id] = 0;
            }
        });

        // remove obsolete counters for removed tracks
        var obsoleteIds = [];
        angular.forEach(trackCounters, function (cnt, trackId) {
            if (!getTrackById(trackId)) obsoleteIds.push(trackId);
        });
        angular.forEach(obsoleteIds, function (id) {
            delete trackCounters[id];
        });
    }

    function _getRandomTrackId() {
        // find min cnt
        var minCnt = Number.MAX_VALUE;
        angular.forEach(trackCounters, function (cnt) {
            if (minCnt > cnt) minCnt = cnt;
        });

        // find possible candidates for random play
        var candidates = [];
        angular.forEach(trackCounters, function (cnt, trackId) {
            if (cnt == minCnt) candidates.push(trackId);
        });

        // find random track
        var randomIndex = Math.floor(Math.random() * candidates.length);
        var randomId = candidates[randomIndex];

        // do extra cnt increase if we reached the end of loop
        // so next loop will not have chance to be started from the current track again
        if (candidates.length == 1) trackCounters[randomId] += 1;

        return randomId;
    }

    function playNext() {
        var nextId = _getRandomTrackId();
        playPause(nextId);
    }

    function playPause(id) {
        if ($scope.playerState.trackId === id) {
            youtubeApi.playPause();
            return;
        }

        // play & notify
        var track = getTrackById(id);
        var startTime = track.info.startTime;
        youtubeApi.loadAndPlay(id, startTime);
        notifyAboutPlayerStateUpdate({
            trackId: id
        });

        // update counters
        trackCounters[id] += 1;
    }
    // .Private methods

    // $scope methods
    $scope.addUrl = addUrl;

    $scope.requestTrackRemoval = requestTrackRemoval;

    $scope.requestVolumeUpdate = function (slider) {
        hub.requestVolumeUpdate(slider.value);
    };

    $scope.requestPlayPause = function (trackId) {
        if (!trackId && !$scope.playerState.trackId)
            return;

        hub.requestPlayPause(trackId || $scope.playerState.trackId);
    };

    $scope.requestPlayNext = function () {
        hub.requestPlayNext();
    };

    $scope.prefill = function () {
        hub.addUrlAsync("https://www.youtube.com/watch?v=uU8Gv46o9WA");
        hub.addUrlAsync("https://www.youtube.com/watch?v=knNCvqKWRws");
        hub.addUrlAsync("https://www.youtube.com/watch?v=LDwbMUjpqos");
    }

    $scope.playNext = playNext;
    // .$scope methods
});

