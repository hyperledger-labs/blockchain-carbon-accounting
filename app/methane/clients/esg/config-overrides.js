const webpack = require('webpack');

module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
    })
    config.ignoreWarnings = [/Failed to parse source map/];
    config.resolve.fallback = fallback;
    config.module.rules.push({
        test: /\.m?js/,
        resolve: {
            fullySpecified: false
        }
    })
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ]);
    config.output.publicPath = '/';
    return config;
}
