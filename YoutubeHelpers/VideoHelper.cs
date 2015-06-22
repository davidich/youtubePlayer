using System.Collections.Generic;
using System.Collections.Specialized;
using System.Security.Policy;
using System.Web;

namespace YoutubeHelpers
{
    using System;
    using System.Linq;
    using System.Text;
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

        public List<VideoInfo> GetVideoInfos(string url)
        {
            var parseResult = UrlParser.Parse(url);

            if (parseResult.Type == UrlParser.UrlType.SingleVideo)
            {
                var videoInfo = GetVideoInfo(parseResult.Id);
                videoInfo.StartTime = parseResult.StartTime;
                return new List<VideoInfo> { videoInfo };
            }
            //else if (parseResult.Type == UrlParser.UrlType.Playlist)
            //{
            var videoIds = GetPlaylistVideoIds(parseResult.Id);
            return GetVideoInfos(videoIds);
            //}
        }

        private VideoInfo GetVideoInfo(string videoId)
        {
            var videoIds = new List<string> { videoId };
            return GetVideoInfos(videoIds).Single();
        }

        private List<VideoInfo> GetVideoInfos(IEnumerable<string> videoIds)
        {
            var videoInfos = new List<VideoInfo>();

            var idQueue = new Queue<string>(videoIds);
            while (idQueue.Count > 0)
            {
                // build Id param to contain all required Ids
                int batchSize = 50;
                var idRequestParam = new StringBuilder();
                while (batchSize>0 && idQueue.Count > 0)
                {
                    if (idRequestParam.Length > 0)
                        idRequestParam.Append(',');

                    idRequestParam.Append(idQueue.Dequeue());
                    batchSize--;
                }

                // prepare request
                var request = _service.Value.Videos.List("contentDetails,snippet");
                request.Id = idRequestParam.ToString();
                request.Fields = "items(id,contentDetails/duration,snippet(title, thumbnails/high/url))";
                
                // execute request
                var response = request.Execute();

                foreach (var video in response.Items)
                {
                    var videoInfo = new VideoInfo
                    {
                        Id = video.Id,
                        Title = video.Snippet.Title,
                        ImageUrl = video.Snippet.Thumbnails.High.Url,
                        TotalSeconds = (int)XmlConvert.ToTimeSpan(video.ContentDetails.Duration).TotalSeconds,
                    };

                    videoInfos.Add(videoInfo);
                }               
            }

            return videoInfos;
        }

        private IEnumerable<string> GetPlaylistVideoIds(string playlistId)
        {
            var videoIds = new List<string>();

            var nextPageToken = "";
            while (nextPageToken != null)
            {
                var request = _service.Value.PlaylistItems.List("snippet");
                request.PlaylistId = playlistId;
                request.MaxResults = 50;
                request.PageToken = nextPageToken;

                var response = request.Execute();

                foreach (var playlistItem in response.Items)
                {
                    var videoId = playlistItem.Snippet.ResourceId.VideoId;
                    videoIds.Add(videoId);
                }

                nextPageToken = response.NextPageToken;
            }

            return videoIds;
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


        public int ParseVideoStartTime(string url)
        {
            Uri uri = new Uri(url);

            var startTimeString = HttpUtility.ParseQueryString(uri.Query)["t"];

            int startTime;
            return string.IsNullOrWhiteSpace(startTimeString) || !int.TryParse(startTimeString, out startTime)
                ? 0
                : startTime;
        }
    }

}