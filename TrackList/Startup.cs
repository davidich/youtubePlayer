using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(TrackList.Startup))]

namespace TrackList
{
    using Microsoft.AspNet.SignalR;

    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            var hubConfiguration = new HubConfiguration { EnableDetailedErrors = true };
            app.MapSignalR(hubConfiguration);
        }
    }
}
