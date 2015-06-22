using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace YoutubeHelpers.Tests
{
    using Xunit;

    public class YoutubeHelperTests
    {
        [Theory]
        [InlineData("https://youtu.be/UPpR_hjQjzs", UrlParser.UrlType.SingleVideo, "UPpR_hjQjzs", 0)]
        [InlineData("https://youtu.be/UPpR_hjQjzs?t=1m25s", UrlParser.UrlType.SingleVideo, "UPpR_hjQjzs", 85)]
        [InlineData("https://www.youtube.com/watch?v=Gzn63tsaOMA", UrlParser.UrlType.SingleVideo, "Gzn63tsaOMA", 0)]
        [InlineData("https://www.youtube.com/watch?v=Gzn63tsaOMA&t=85", UrlParser.UrlType.SingleVideo, "Gzn63tsaOMA", 85)]
        [InlineData("https://www.youtube.com/watch?v=Gzn63tsaOMA&t=1m25s", UrlParser.UrlType.SingleVideo, "Gzn63tsaOMA", 85)]
        [InlineData("https://www.youtube.com/watch?v=Gzn63tsaOMA&list=RDUiInBOVHpO8", UrlParser.UrlType.Playlist, "RDUiInBOVHpO8", 0)]
        [InlineData("https://www.youtube.com/watch?v=Gzn63tsaOMA&list=RDUiInBOVHpO8&t=50", UrlParser.UrlType.Playlist, "RDUiInBOVHpO8", 0)]
        [InlineData("https://www.youtube.com/watch?v=Gzn63tsaOMA&list=RDUiInBOVHpO8&t=1m25s", UrlParser.UrlType.Playlist, "RDUiInBOVHpO8", 0)]
        
        public void CanParseUrl(string url, UrlParser.UrlType expectedType, string expectedId, int expectedStartTime)
        {
            var result = UrlParser.Parse(url);

            Assert.Equal(expectedType, result.Type);
            Assert.Equal(expectedId, result.Id);
            Assert.Equal(expectedStartTime, result.StartTime);
        }

        [Theory]
        [InlineData("https://www.youtube.com/watch")]
        [InlineData("https://www.youtube.com/watch?v=1234567890")]
        [InlineData("https://www.youtube.com/watch?v=123456789012")]
        [InlineData("https://www.youtube.com/watch?v=12345678901&list=123456789012")]        
        public void ShouldFailOnInvalidUrls(string url)
        {
            Assert.Throws<InvalidOperationException>(() => UrlParser.Parse(url));            
        }
    }
}
