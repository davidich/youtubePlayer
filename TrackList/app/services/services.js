'use strict';

/* Services */

var module = angular.module('services', []);

module.factory('user', function () {
    return {
        name: "",
        isValid: function () {
            return this.name.length >= 3;
        },
        isAdmin: function () {
            return this.name === "oleksiy";
        }
    };
});

module.factory('signalR', function (user) {

    var self = this,
        isInited = false,
        hub = $.connection.trackListHub;


    self.callbacks = {};

    hub.client.updatePlaylist = function (data) {
        if (typeof self.callbacks.onPlaylistUpdate === "function")
            self.callbacks.onPlaylistUpdate(data);
    };

    hub.client.updateRemainingTime = function (value) {
        if (typeof self.callbacks.onTimeUpdate === "function")
            self.callbacks.onTimeUpdate(value);
    };

    function onInited(callback) {
        if (typeof callback === "function") {
            callback();
        }
    }

    return {
        init: function (callback) {
            if (isInited) {
                onInited(callback);
            } else {
                $.connection.hub.start().done(function () {
                    isInited = true;
                    onInited(callback);
                });

                $.connection.hub.error(function (error) {
                    console.log('SignalR error: ' + error);
                });
            }
        },
        sendUrl: function (url) {
            if (!isInited)
                throw "Hub is not inited";

            hub.server.enqueueTrack(user.name, url);
        },
        moveNext: function () {
            if (!isInited)
                throw "Hub is not inited";

            hub.server.moveNext();
        },
        updateRemainingTime: function (value) {
            if (!isInited)
                throw "Hub is not inited";

            hub.server.updateRemainingTime(value);
        },
        triggerPlaylistUpdate: function () {
            hub.server.triggerPlaylistUpdate();
        },
        setPlaylistUpdateCallback: function (callback) {
            self.callbacks.onPlaylistUpdate = callback;
        },
        setTimeUpdateCallback: function (callback) {
            self.callbacks.onTimeUpdate = callback;
        }
    }
});