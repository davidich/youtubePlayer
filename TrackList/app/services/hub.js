'use strict';

angular.module('services').factory('hub', function ($location, $q) {

    var self = this,
        initPromise = undefined,
        serverProxy = $.connection.trackListHub.server,
        clientProxy = $.connection.trackListHub.client;

    // list of supported methods
    self.client = {
        'updateUserList': null,
        'updatePlayList': null,
        'notifyAboutRemoval': null,
        'updatePlayerState': null,
        'requestPlayPause': null,
        'requestPlayNext': null,
        'updateVolume': null,
        'updateShuffle': null
    };

    // Subscribe for some SignalR events
    $.connection.hub.disconnected(function () {
        if ($.connection.hub.lastError) {
            console.error("SignalR disconnected. Reason: " + $.connection.hub.lastError.message);
        }
    });

    $.connection.hub.error(function (error) {
        console.log('SignalR error: ' + error);
        alert("Error: " + error);
    });
    // .Subscribe for some SignalR events

    function initAsync(username) {
        if (!initPromise) {
            var deferred = $q.defer();
            initPromise = deferred.promise;

            // Self-kickoff callback
            // Server will invoke it to disconnect existing client with the same name as passed to login method
            clientProxy.stop = function (kickerAddress) {
                $.connection.hub.stop();
                location.hash = "/kickout/" + kickerAddress;
            };

            // In order to make client proxy valid for later use, all client's methods have to be defined before SignalR connection is started
            // Here we create method wrappers for each supported client method (list is in self.client object defined above)
            // Later consumer of hub service can define method logic by simply defining a function with corresponding name on a hub.client instance
            var name;
            for (name in self.client) {
                clientProxy[name] = createClientCallback(name);
            }
            function createClientCallback(methodName) {
                return function () {
                    if (typeof self.client[methodName] === "function") {
                        self.client[methodName].apply($.connection.trackListHub, $.makeArray(arguments));
                    } else {
                        console.warn("Server invoked '" + methodName + "' but consumer haven't defined a correspoding function on a hub service yet");
                    }
                }
            }

            // negotiage and establish connection with server
            $.connection.hub.start()
                .done(function () {
                    console.log('SignalR is now connected (connection ID=' + $.connection.hub.id + ')');

                    serverProxy.login(username)
                        .done(function () {
                            self.username = username;
                            deferred.resolve('User "' + username + '" has SUCCESSFULLY loged in');
                            console.log('User "' + username + '" has SUCCESSFULLY loged in');
                        })
                        .fail(function () {
                            deferred.reject('User "' + username + '" FAILED to log in');
                        });
                })
                .fail(function () {
                    console.log('SignalR could not connect to the server!');
                    deferred.reject('SignalR could not connect to the server');
                });
        }

        return initPromise;
    }

    function addUrlAsync(url) {
        var deferred = $q.defer();

        serverProxy.addUrl(self.username, url)
            .done(function (result) {
                deferred.resolve(result);
            })
            .fail(function (error) {
                deferred.reject(error.message);
            });


        return deferred.promise;
    }

    function removeTrackAsync(id) {
        var deferred = $q.defer();

        serverProxy.removeTrack(self.username, id)
            .done(function (result) {
                deferred.resolve(result);
            })
            .fail(function (error) {
                deferred.reject(error.message);
            });


        return deferred.promise;
    }

    // expose public methods
    self.initAsync = initAsync;

    self.triggerDataUpdate = serverProxy.triggerDataUpdate;

    self.notifyAboutPlayerStateUpdate = serverProxy.notifyAboutPlayerStateUpdate;

    self.requestPlayPause = serverProxy.requestPlayPause;

    self.requestPlayNext = serverProxy.requestPlayNext;

    self.requestVolumeUpdate = serverProxy.requestVolumeUpdate;

    self.notifyAboutShuffleUpdate = serverProxy.notifyAboutShuffleUpdate;

    self.addUrlAsync = addUrlAsync;

    self.removeTrackAsync = removeTrackAsync;

    self.isMain = function () { return self.username === "oleksiy"; }

    // add methods of serverProxy
    //var serverMethodName;
    //for (serverMethodName in serverProxy) {
    //    if (serverProxy.hasOwnProperty(serverMethodName)) {
    //        self[serverMethodName] = serverProxy[serverMethodName];
    //    }
    //}



    return self;
});