import type { NextConfig } from "next";

const isPagesBuild = process.env.GITHUB_PAGES === "true";
const applicationsApiUrl = process.env.NEXT_PUBLIC_APPLICATIONS_API_URL || "https://global-applications-api.g89831315904.workers.dev";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APPLICATIONS_API_URL: applicationsApiUrl },
  output: "export",
  trailingSlash: true,
  basePath: isPagesBuild ? "/GLOBAL" : "",
  assetPrefix: isPagesBuild ? "/GLOBAL/" : "",
};

export default nextConfig;
