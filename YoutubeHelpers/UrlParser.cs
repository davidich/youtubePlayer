namespace YoutubeHelpers
{
    using System;
    using System.Collections.Specialized;
    using System.Web;
    using System.Xml;

    public class UrlParser
    {
        public enum UrlType
        {
            SingleVideo,
            Playlist
        }

        internal class Result
        {
            public UrlType Type { get; set; }

            public string Id { get; set; }

            public int StartTime { get; set; }
        }

        private readonly Uri _uri;

        private readonly NameValueCollection _paramCollection;

        public UrlParser(string url)
        {
            _uri = new Uri(url);
            _paramCollection = HttpUtility.ParseQueryString(_uri.Query);
        }

        internal static Result Parse(string url)
        {
            return new UrlParser(url).Parse();
        }

        private Result Parse()
        {
            string playlistId;
            string videoId;
            int startTime;

            ValidateAndParseParams(out videoId, out playlistId, out startTime);

            var result = new Result();
            if (!string.IsNullOrEmpty(playlistId))
            {
                result.Type = UrlType.Playlist;
                result.Id = playlistId;
                result.StartTime = 0;
            }
            else if (!string.IsNullOrEmpty(videoId))
            {
                result.Type = UrlType.SingleVideo;
                result.Id = videoId;
                result.StartTime = startTime;
            }

            return result;
        }

        private void ValidateAndParseParams(out string videoId, out string playlistId, out int startTime)
        {
            // parse video Id
            if (_uri.Host.ToLower() == "www.youtube.com" && _uri.LocalPath.ToLower() == "/watch")
            {
                videoId = _paramCollection["v"] ?? String.Empty;
            }
            else if (_uri.Host.ToLower() == "youtu.be" && _uri.LocalPath.Length == 12)
            {
                videoId = _uri.LocalPath.Substring(1);
            }
            else
            {
                throw new InvalidOperationException("Provided URL cannot be parsed");
            }

            if (string.IsNullOrWhiteSpace(videoId) || videoId.Length != 11)
                throw new InvalidOperationException("Provided URL cannot be parsed. VideoId parameter length expected to be 11 chars, but was " + videoId.Length);


            // Parse playlist Id
            playlistId = _paramCollection["list"] ?? String.Empty;

            if (!string.IsNullOrWhiteSpace(playlistId) && playlistId.Length < 13)
                throw new InvalidOperationException("Provided URL cannot be parsed. List parameter length expected to be at least 13 chars, but was " + playlistId.Length);

            
            // Parse StartTime
            // can be interger: 50 (means 50 secs)
            // or string: 1m25s (means 85secs)
            var t = _paramCollection["t"];
            if (string.IsNullOrWhiteSpace(t))
                startTime = 0;
            else if (!int.TryParse(t, out startTime))
                startTime = (int)XmlConvert.ToTimeSpan("PT" + t.ToUpper()).TotalSeconds;
        }
    }
}