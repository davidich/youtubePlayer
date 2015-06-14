namespace TrackList.SignalR
{
    using System.Collections.Concurrent;
    using System.Linq;
    using System.Threading.Tasks;

    using Microsoft.AspNet.SignalR;

    using YoutubeHelpers;

    public class TrackListHub : Hub
    {
        private const string YoutubeApiKey = "AIzaSyDbHCpfIGGlFFgqmJZapJ9ssQfk6i13jeE";
        private static readonly VideoHelper YoutubeVideoHelper = new VideoHelper(YoutubeApiKey);
        private static readonly ConcurrentQueue<PlaylistItem> Playlist = new ConcurrentQueue<PlaylistItem>();

        private static readonly ConcurrentDictionary<string, string> Connections = new ConcurrentDictionary<string, string>();

        public string SetUsername(string username)
        {
            if (Connections.ContainsKey(username))
                return string.Format("Name '{0}' is already used", username);

            var connectionId = Context.ConnectionId;
            Connections.AddOrUpdate(username, connectionId, (s, s1) => connectionId);

            Clients.All.updateUserList(GetUsers());

            return "OK";
        }

        private static IOrderedEnumerable<string> GetUsers()
        {
            return Connections.Keys.OrderBy(v => v);
        }

        public object GetInitialData()
        {
            return new
                   {
                       Users = GetUsers(),
                       Playlist
                   };
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

                Clients.All.updatePlaylist(Playlist);
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
                          where pair.Value == connectionId
                          select pair.Key).SingleOrDefault();


            if (!string.IsNullOrEmpty(userId))
            {
                Connections.TryRemove(userId, out connectionId);
            }

            Clients.All.UpdateUserList(GetUsers());
            
            return base.OnDisconnected(stopCalled);
        }
    }
}