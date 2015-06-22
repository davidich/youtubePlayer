namespace YoutubeHelpers
{
    using System;

    public class VideoInfo
    {
        public string Id { get; set; }

        public string Title { get; set; }

        public string ImageUrl { get; set; }

        public int StartTime { get; set; }

        public int TotalSeconds { get; set; }

        public string GetAdFreeUrl()
        {
            return string.Format("http://www.fleetube.com/watch?v={0}", Id);
        }
    }
}