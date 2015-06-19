namespace YoutubeHelpers
{
    using System;

    public class VideoInfo
    {
        public string Title { get; set; }

        public TimeSpan Duration { get; set; }

        public int TotalSeconds
        {
            get { return (int)Duration.TotalSeconds; }
        }

        public string AdFreeUrl { get; set; }

        public string ImageUrl { get; set; }

    }
}