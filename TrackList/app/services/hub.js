'use strict';

angular.module('services').factory('hub', function ($location) {

    var self = this,
        serverProxy = $.connection.trackListHub.server,
        clientCallbacks = {};

    self.isInited = false;
    self.initPromise = undefined;
    self.username = "anonymous";
    self.users = [];

    // subscribe for some events
    $.connection.hub.disconnected(function () {
        if ($.connection.hub.lastError) {
            console.error("Disconnected. Reason: " + $.connection.hub.lastError.message);
        }
    });

    $.connection.hub.error(function (error) {
        console.log('SignalR error: ' + error);
    });

    function isConnected() {
        return self.isInited && self.username != "anonymous";
    }

    function ensureConnection() {
        if (isConnected())
            return true;

        $location.path("/login");
        return false;
    }

    function invokeCallback(name, args) {
        if (typeof clientCallbacks[name] === "function")
            clientCallbacks[name].apply($.connection.trackListHub, $.makeArray(args));
    }

    // public methods
    return {
        setScope: function ($scope) {
            self.$scope = $scope;
        },
        initAsync: function () {
            $.connection.trackListHub.client.updateUserList = function () {
                invokeCallback("updateUserList", arguments);
            };
            $.connection.trackListHub.client.updatePlaylist = function () {
                invokeCallback("updatePlaylist", arguments);
            };
            $.connection.trackListHub.client.updateRemainingTime = function () {
                invokeCallback("updateRemainingTime", arguments);
            };

            if (!self.isInited) {
                self.initPromise = $.connection.hub.start();
                self.initPromise.done(function () {
                    self.isInited = true;
                });
            }
            return self.initPromise;
        },
        setUsername: function (username) {
            var promise = serverProxy.setUsername(username);

            promise.done(function (result) {
                if (result === "OK") {
                    self.username = username;
                }
            });

            return promise;
        },
        isConnected: isConnected,
        getUsername: function () {
            return self.username;
        },
        getInitialDataAsync: function () {
            return serverProxy.getInitialData();
        },
        setCallbacks: function (callbacks) {
            for (var key in callbacks) {
                clientCallbacks[key] = callbacks[key];
            }
        },
        sendUrl: function (url) {
            if (ensureConnection()) {
                serverProxy.enqueueTrack(self.username, url);
            }            
        },
        moveNext: function () {
            if (ensureConnection()) {
                serverProxy.moveNext();
            }
        },
        updateRemainingTime: function (value) {
            if (ensureConnection()) {
                serverProxy.updateRemainingTime(value);
            }            
        }
    }
});