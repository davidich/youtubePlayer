namespace TrackList.SignalR
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using System.Web;

    using Microsoft.AspNet.SignalR;

    using YoutubeHelpers;

    public class TrackListHub : Hub
    {
        private static object playerState = null;
        private static int playerVolume = 100;

        private const string YoutubeApiKey = "AIzaSyDbHCpfIGGlFFgqmJZapJ9ssQfk6i13jeE";
        private static readonly VideoHelper YoutubeVideoHelper = new VideoHelper(YoutubeApiKey);
        private static readonly List<PlaylistItem> Playlist = new List<PlaylistItem>();
        private static readonly ConcurrentDictionary<string, UserInfo> Connections = new ConcurrentDictionary<string, UserInfo>();

        public void Login(string username)
        {
            var clientIp = GetRemoteIpAddress(Context.Request);

            UserInfo existingUser;
            if (Connections.TryGetValue(username, out existingUser))
            {
                Clients.Client(existingUser.ConnectionId).stop(clientIp);
            }

            var userInfo = new UserInfo
            {
                ConnectionId = Context.ConnectionId,
                IpAddress = clientIp
            };

            Connections.AddOrUpdate(
                username,
                userInfo,
                (s, s1) => userInfo);

            Clients.All.updateUserList(GetUsers());
        }

        public void TriggerDataUpdate()
        {
            Clients.Caller.updateUserList(GetUsers());
            Clients.Caller.updatePlayList(Playlist);
            Clients.Caller.updatePlayerState(playerState);
            Clients.Caller.updateVolume(playerVolume);
        }

        public List<VideoInfo> AddUrl(string clientName, string url)
        {
            var videoInfos = YoutubeVideoHelper.GetVideoInfos(url);

            lock (Playlist)
            {
                foreach (var videoInfo in videoInfos)
                {
                    if (Playlist.Any(item => item.Id == videoInfo.Id))
                        continue;

                    var playlistItem = new PlaylistItem
                                       {
                                           Id = videoInfo.Id,
                                           Info = videoInfo,
                                           AddedBy = clientName
                                       };

                    Playlist.Add(playlistItem);
                }
            }

            Clients.All.updatePlayList(Playlist);

            return videoInfos;
        }

        public void RemoveTrack(string clientName, string id)
        {
            PlaylistItem removedItem;
            lock (Playlist)
            {
                var index = Playlist.FindIndex(item => item.Id == id);

                if (index == -1)
                    throw new InvalidOperationException("Track doesn't exist");

                removedItem = Playlist[index];
                Playlist.RemoveAt(index);
            }

            Clients.All.updatePlayList(Playlist);
            Clients.All.notifyAboutRemoval(clientName, removedItem);
        }

        public void NotifyAboutPlayerStateUpdate(object state)
        {
            playerState = state;
            Clients.All.updatePlayerState(state);
        }

        public void RequestPlayPause(string id)
        {
            Clients.All.requestPlayPause(id);
        }

        public void RequestPlayNext()
        {
            Clients.All.requestPlayNext();
        }

        public void RequestVolumeUpdate(int value)
        {
            playerVolume = value;
            Clients.All.updateVolume(value);
        }


        public override Task OnDisconnected(bool stopCalled)
        {
            var connectionId = Context.ConnectionId;
            var userId = (from pair in Connections
                          where pair.Value.ConnectionId == connectionId
                          select pair.Key).SingleOrDefault();


            if (!string.IsNullOrEmpty(userId))
            {
                UserInfo info;
                Connections.TryRemove(userId, out info);
            }

            Clients.All.updateUserList(GetUsers());

            return base.OnDisconnected(stopCalled);
        }

        #region Helper methods
        private static IOrderedEnumerable<string> GetUsers()
        {
            return Connections.Keys.OrderBy(v => v);
        }

        private static string GetRemoteIpAddress(IRequest request)
        {
            object ipAddress;
            if (request.Environment.TryGetValue("server.RemoteIpAddress", out ipAddress))
            {
                return ipAddress as string;
            }
            return null;
        }
        #endregion
    }
}