var path = require('path');

module.exports = {
    entry: './index.ts',
    devtool: 'inline-source-map',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                use: 'ts-loader',
                test: /\.ts?$/
            }
        ]
    }
}