/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The content layer reads JSON from /content and sources/manifest.json at runtime via fs.
  // On Vercel (serverless), files accessed by dynamic paths aren't traced automatically, so
  // we explicitly include them in every function bundle. Without this, the app would 404/500
  // in production because the data files wouldn't be present in the lambda.
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./content/**/*", "./sources/manifest.json"],
    },
  },
};

export default nextConfig;
