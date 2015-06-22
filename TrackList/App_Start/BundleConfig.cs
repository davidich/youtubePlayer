using System.Web.Optimization;

namespace TrackList
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                "~/Scripts/bootstrap.js",
                "~/Scripts/respond.js"));

            bundles.Add(new ScriptBundle("~/bundles/angular").Include(
                "~/Scripts/angular.js",
                "~/Scripts/angular-route.js",
                "~/Scripts/angular-animate.js",
                "~/plugins/angular-bootstrap-slider/bootstrap-slider.js",
                "~/plugins/angular-bootstrap-slider/angular-bootstrap-slider.js",
                "~/plugins/angular-toaster/toaster.js"));

            bundles.Add(new ScriptBundle("~/bundles/app").Include(
                "~/app/app.js",
                "~/app/directives/*.js",
                "~/app/services/*.js",
                "~/app/controllers/*.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                 "~/Content/bootstrap.css",
                 "~/Scripts/angular-csp.css",
                 "~/plugins/angular-bootstrap-slider/bootstrap-slider.css",
                 "~/plugins/angular-toaster/toaster.css"));
        }
    }
}
