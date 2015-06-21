namespace TrackList.SignalR
{
    using System.Collections.Concurrent;
    using System.Linq;
    using System.Threading.Tasks;
    using System.Web;

    using Microsoft.AspNet.SignalR;

    using YoutubeHelpers;

    public class TrackListHub : Hub
    {
        private const string YoutubeApiKey = "AIzaSyDbHCpfIGGlFFgqmJZapJ9ssQfk6i13jeE";
        private static readonly VideoHelper YoutubeVideoHelper = new VideoHelper(YoutubeApiKey);
        private static readonly ConcurrentQueue<PlaylistItem> Playlist = new ConcurrentQueue<PlaylistItem>();

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

        public void RefreshAllData()
        {
            Clients.Caller.updateUserList(GetUsers());
            Clients.Caller.updatePlayList(Playlist);
        }






        



        public void EnqueueTrack(string clientName, string url)
        {
            try
            {
                var videoId = YoutubeVideoHelper.ParseVideoId(url);

                //if (Playlist.Any(i => i.Id == videoId))
                //    return;

                var videoInfo = YoutubeVideoHelper.GetInfo(videoId);
                var playlistItem = new PlaylistItem
                                   {
                                       Id = videoId,
                                       Info = videoInfo,
                                       AddedBy = clientName
                                   };

                Playlist.Enqueue(playlistItem);

                Clients.All.updatePlayList(Playlist);
            }
            catch
            {

            }
        }

        public void MoveNext()
        {
            try
            {
                PlaylistItem item;
                Playlist.TryDequeue(out item);
                Clients.Others.updatePlaylist(Playlist);
            }
            catch
            {

            }
        }

        public void UpdateRemainingTime(string value)
        {
            try
            {
                Clients.Others.updateRemainingTime(value);
            }
            catch
            {

            }
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