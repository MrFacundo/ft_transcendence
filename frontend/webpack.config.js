"use strict";
const path = require("path");
const autoprefixer = require("autoprefixer");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production' || env.production;

  return {
    mode: isProduction ? "production" : "development",
    entry: "./src/js/App.js",
    output: {
      filename: isProduction ? "[name].[contenthash].js" : "[name].js",
      chunkFilename: isProduction ? "[name].[contenthash].chunk.js" : "[name].chunk.js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "/",
      clean: true, // Clean the output directory before emit
    },
    // Only use source maps in development
    devtool: isProduction ? false : "source-map",
    devServer: {
      static: [
        {
          directory: path.resolve(__dirname, "src/static"),
          publicPath: "/static",
        },
      ],
      port: 8080,
      historyApiFallback: true,
      hot: !isProduction,
      compress: isProduction,
      webSocketServer: false,
      client: {
        logging: isProduction ? 'error' : 'info',
        overlay: true,
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        filename: "index.html",
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        } : false,
      }),
      new Dotenv({ systemvars: true }),
    ],
    module: {
      rules: [
        {
          test: /\.(png|jpe?g|gif|svg|webp)$/,
          type: "asset/resource",
          generator: {
            filename: "static/images/[name]" + (isProduction ? ".[contenthash]" : "") + "[ext]",
          },
        },
        {
          test: /\.(scss)$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                sourceMap: !isProduction,
              }
            },
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [autoprefixer],
                },
                sourceMap: !isProduction,
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: !isProduction,
                additionalData: `$static-path: "${isProduction ?  "https://localhost/static/" : "../static/"}";\n`
              }
            },
          ],
        },
        {
          test: /\.js$/,
          enforce: "pre",
          use: isProduction ? [] : ["source-map-loader"],
          exclude: /node_modules/,
        },
      ],
    },
    optimization: {
      minimize: isProduction,
      moduleIds: isProduction ? 'deterministic' : 'named',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // Get the name. E.g. node_modules/packageName/sub/path
              // or node_modules/packageName
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];

              // Create smaller bundles per package
              return `npm.${packageName.replace('@', '')}`;
            },
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
  };
};