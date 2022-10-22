const webpack = require('webpack');

const { 
  override, overrideDevServer, addWebpackAlias, watchAll
} = require('customize-cra');
const path = require('path');

const overridePath = (webpackConfig) => {
  const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
  if (oneOfRule) {
    const tsxRule = oneOfRule.oneOf.find(
      (rule) => rule.test && rule.test.toString().includes('tsx')
    );

    const newIncludePaths = [
      // relative path to my yarn workspace library
      path.resolve(__dirname, '../../frontend/react-app/src/components'),
      path.resolve(__dirname, '../../frontend/react-app/src/hooks'),
      path.resolve(__dirname, '../../frontend/react-app/src/services'),
      path.resolve(__dirname, '../../frontend/react-app/src/pages'),
      path.resolve(__dirname, '../../../lib/supply-chain'),
      path.resolve(__dirname, '../../../lib/oil-and-gas-data')
    ];
    if (tsxRule) {
      if (Array.isArray(tsxRule.include)) {
        tsxRule.include = [...tsxRule.include, ...newIncludePaths];
      } else {
        tsxRule.include = [tsxRule.include, ...newIncludePaths];
      }
    }
  }
  const fallback = webpackConfig.resolve.fallback || {};
  Object.assign(fallback, {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify"),
  })
  webpackConfig.ignoreWarnings = [/Failed to parse source map/];
  webpackConfig.resolve.fallback = fallback;
  webpackConfig.module.rules.push({
      test: /\.m?js/,
      resolve: {
          fullySpecified: false
      }
  })
  webpackConfig.plugins = (webpackConfig.plugins || []).concat([
      new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
      })
  ]);
  webpackConfig.output.publicPath = '/';
  return webpackConfig;
};

module.exports = {
  webpack: override(
    addWebpackAlias({
      components: path.resolve(__dirname, 'src/components'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      services: path.resolve(__dirname, 'src/services'),
      pages: path.resolve(__dirname, 'src/pages'),
      'supply-chain': path.resolve(__dirname, 'lib/supply-chain'),
      'oil-and-gas-data': path.resolve(__dirname, 'lib/oil-and-gas-data'),
    }),
    overridePath,
  )
};