namespace TrackList.SignalR
{
    using System.Collections.Concurrent;

    using Microsoft.AspNet.SignalR;

    using YoutubeHelpers;

    public class TrackListHub : Hub
    {
        private const string YoutubeApiKey = "AIzaSyDbHCpfIGGlFFgqmJZapJ9ssQfk6i13jeE";
        private static readonly VideoHelper YoutubeVideoHelper = new VideoHelper(YoutubeApiKey);
        private static readonly ConcurrentQueue<PlaylistItem> Playlist = new ConcurrentQueue<PlaylistItem>();

        public int EnqueueTrack(string clientName, string url)
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

                //var json = JsonConvert.SerializeObject(Playlist, jsonSerializerSettings);

                Clients.All.updatePlaylist(Playlist);
            }
            catch
            {

            }

            return 42;
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

        public void TriggerPlaylistUpdate()
        {
            try
            {
                Clients.Caller.updatePlaylist(Playlist);
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
    }
}