namespace YoutubeHelpers
{
    using System;
    using System.Text.RegularExpressions;
    using System.Xml;

    using Google.Apis.Services;
    using Google.Apis.YouTube.v3;
    using Google.Apis.YouTube.v3.Data;

    public class VideoHelper        
    {
        private readonly Lazy<YouTubeService> _service;

        // Can be set as default api key value for all helper instances
        public static string DefaultApiKey { get; set; }

        public VideoHelper(string apiKey = null)
        {
            apiKey = string.IsNullOrWhiteSpace(apiKey)
                ? DefaultApiKey
                : apiKey;

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("Api Key is empty. Set either DefaultApiKey property or pass apiKey to constructor.");

            _service = new Lazy<YouTubeService>(() => CreateService(apiKey));
        }

        public static VideoInfo GetInfo(string url, string apiKey)
        {
            var helper = new VideoHelper(apiKey);
            return helper.GetInfo(url);
        }

        public VideoInfo GetInfo(string videoId)
        {
            var request = _service.Value.Videos.List("contentDetails,snippet");
            request.Id = videoId;
            request.Fields = "items(contentDetails/duration,snippet(title, thumbnails/high/url))";

            var response = request.Execute();

            if (response.Items.Count != 1)
            {
                var message = string.Format(
                    "'{0}' is not valid videoId as response can't be retreived (ItemCount = {1}",
                    videoId,
                    response.Items.Count);
                throw new ArgumentException(message);
            }
            Video video = response.Items[0];

            return new VideoInfo
                   {
                       AdFreeUrl = CreateAdFreeUrl(videoId),
                       Duration = XmlConvert.ToTimeSpan(video.ContentDetails.Duration),
                       Title = video.Snippet.Title,
                       ImageUrl = video.Snippet.Thumbnails.High.Url
                   };

        }

        public string CreateAdFreeUrl(string videoId)
        {
            return string.Format("http://www.fleetube.com/watch?v={0}", videoId);
        }

        public string ParseVideoId(string url)
        {
            var regex = new Regex(@"www\.youtube\.com\/watch\?.*v=([\w-]{11})");
            var result = regex.Match(url);

            if (result.Groups.Count != 2)
                throw new ArgumentException("Only Youtube Urls are supported.");

            return result.Groups[1].Value;


        }

        private static YouTubeService CreateService(string apiKey, string applicationName = null)
        {
            var initializer = new BaseClientService.Initializer
                              {
                                  ApiKey = apiKey,
                                  ApplicationName = applicationName ?? "Default Name"
                              };

            return new YouTubeService(initializer);
        }


    }

}