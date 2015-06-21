using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(TrackList.Startup))]

namespace TrackList
{
    using System;

    using Microsoft.AspNet.SignalR;

    using Newtonsoft.Json;

    using TrackList.SignalR;

    using YoutubeHelpers;

    public class Startup
    {
        private static readonly Lazy<JsonSerializer> JsonSerializerFactory = new Lazy<JsonSerializer>(GetJsonSerializer);

        private static JsonSerializer GetJsonSerializer()
        {
            return new JsonSerializer
                   {
                       ContractResolver = new CamelCaseContractResolver
                                          {
                                              // 1) Register all types in specified assemblies:
                                              AssembliesToInclude =
                                              {
                                                  typeof(Startup).Assembly,
                                                  typeof(VideoInfo).Assembly
                                              },

                                              // 2) Register individual types:
                                              //TypesToInclude =
                                              //                {
                                              //                    typeof(Hubs.Message),
                                              //                }
                                          }
                   };
        }

        public void Configuration(IAppBuilder app)
        {
            var hubConfiguration = new HubConfiguration { EnableDetailedErrors = true };
            app.MapSignalR(hubConfiguration);

            GlobalHost.DependencyResolver.Register(typeof(JsonSerializer), () => JsonSerializerFactory.Value);
        }
    }
}