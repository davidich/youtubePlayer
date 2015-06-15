'use strict';

angular.module('services').factory('ytPlayer', function ($window, $document, $q) {
    var self = this,
        isInited = false,
        player,
        playerElementId = undefined,
        playerDeferred = $q.defer(),
        state = {
            mode: "stopped",    //("playing", "paused")
            volume: 100         //(0 - 100)
        };

    // Youtube API callback for iFrame ready event
    // It will be invoked once api code is loaded and it has created an <iframe> (and YouTube player) 
    $window.onYouTubeIframeAPIReady = function () {
        player = new YT.Player(playerElementId, {
            height: '390',
            width: '640',
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }

    // Youtube API callback
    // It will be invoked once the video player is ready
    function onPlayerReady() {
        isInited = true;
        playerDeferred.resolve();
    }

    // Youtube API callback
    // It will be invoked when the player's state changes.
    //  -1 - "unstarted" (no defined constant, event will have data with this value, when player loads video for the first time)
    //   0 - YT.PlayerState.ENDED
    //   1 - YT.PlayerState.PLAYING
    //   2 - YT.PlayerState.PAUSED
    //   3 - YT.PlayerState.BUFFERING
    //   5 - YT.PlayerState.CUED
    function onPlayerStateChange(event) {
        var prevMode = state.mode;
        switch (event.data) {
            case YT.PlayerState.PLAYING:    // 1
                state.mode = "PLAYING";
                break;
            case YT.PlayerState.PAUSED:     // 2
                state.mode = "PAUSED";
                break;
            default:
                state.mode = "STOPPED";
        }
        if (prevMode != state.mode) {
            onStateChanged();
        }
    }

    function onStateChanged() {
        // TODO: think about event unsubscribe on page leave
        $(self).trigger("stateChanged", state);
    }

    self.init = function (elementId) {
        if (isInited)
            return playerDeferred;

        if ($window['YT'])
            $window['YT'] = undefined;

        playerElementId = elementId;

        // load API script loading
        // when loading is completed then the API invokes callback we defined above (onYouTubeIframeAPIReady)
        $.getScript("https://www.youtube.com/iframe_api");

        // return promise
        return playerDeferred.promise;
    }

    self.loadAndPlay = function (id, start) {
        player.stopVideo();
        player.loadVideoById(id, start);
        player.playVideo();
    }

    self.playPause = function () {
        if (player.getPlayerState() == YT.PlayerState.PLAYING)
            player.pauseVideo();
        else {
            player.playVideo();
        }
    }

    self.setVolume = function (value) {
        var parsedValue = parseInt(value);
        if (parsedValue < 0) parsedValue = 0;
        if (parsedValue > 100) parsedValue = 100;

        if (state.volume != parsedValue) {
            state.volume = parsedValue;
            player.setVolume(parsedValue);
            onStateChanged();
        }
    },

    self.isStopped = function() {
        var st = player.getPlayerState();
        return st != YT.PlayerState.PLAYING && st != YT.PlayerState.PAUSED;
    }

    return self;
});