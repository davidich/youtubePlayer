namespace TrackList
{
    using YoutubeHelpers;

    class PlaylistItem
    {
        public string Id { get; set; }
        public string AddedBy { get; set; }
        public VideoInfo Info { get; set; }
    }
}