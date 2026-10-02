import type { NextConfig } from "next";

const isPagesBuild = process.env.GITHUB_PAGES === "true";
const basePath = isPagesBuild ? "/site-GLOBAL" : "";
const applicationsApiUrl = process.env.NEXT_PUBLIC_APPLICATIONS_API_URL || "https://global-applications-api.g89831315904.workers.dev";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APPLICATIONS_API_URL: applicationsApiUrl,
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: isPagesBuild ? `${basePath}/` : "",
};

export default nextConfig;
