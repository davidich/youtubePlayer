'use strict';

angular.module('services').factory('youtubeApi', function ($window, $document, $q) {
    var self = this,
        isInited = false,
        player,
        playerElementId = undefined,
        playerDeferred = $q.defer(),
        state = {
            mode: "STOPPED",    // ("PLAYING", "PAUSED")
            length: 0,          // cur track lenght in secs
            time: 0             // cur track time in secs
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

        setInterval(function() {
            var curTime = Math.round(player.getCurrentTime());

            if (curTime != state.time) {
                state.time = curTime;
                onStateChanged("time");
            }
        }, 100);
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
        var prevMode = state.mode,
            prevLength = state.length;

        switch (event.data) {
            case YT.PlayerState.PLAYING:    // 1
                state.mode = "PLAYING";
                state.length = Math.round(player.getDuration());
                break;
            case YT.PlayerState.PAUSED:     // 2
                state.mode = "PAUSED";
                break;
            default:
                state.mode = "STOPPED";
                state.length = 0;
        }

        if (prevLength != state.length) {
            onStateChanged("length");
        }
        else if (prevMode != state.mode) {
            onStateChanged("mode");
        }

        if (event.data == YT.PlayerState.ENDED) {
            $(self).trigger("trackEnded");
        }
    }

    function onStateChanged(reason) {
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

    self.stop = function () {
        player.stopVideo();        
    }

    self.setVolume = function (value) {
        var parsedValue = parseInt(value) || 100;
        if (parsedValue < 0) parsedValue = 0;
        if (parsedValue > 100) parsedValue = 100;

        player.setVolume(parsedValue);                    
    },

    self.isPlaying = function () {
        var st = player.getPlayerState();
        return st == YT.PlayerState.PLAYING;
    }

    self.isStopped = function() {
        var st = player.getPlayerState();
        return st != YT.PlayerState.PLAYING && st != YT.PlayerState.PAUSED;
    }

    self.destroy = function () {
        isInited = false;
        player.destroy();
    }

    return self;
});