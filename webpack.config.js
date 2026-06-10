const path = require('path');

/**@type {import('webpack').Configuration}*/
const extensionConfig = {
    target: 'node',
    mode: 'none',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.json'
                        }
                    }
                ]
            }
        ]
    },
    devtool: 'nosources-source-map',
    infrastructureLogging: {
        level: "log",
    },
};

/**@type {import('webpack').Configuration}*/
const workerConfig = {
    target: 'node',
    mode: 'none',
    entry: './src/worker/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'worker.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        '@temporalio/activity': 'commonjs @temporalio/activity',
        '@temporalio/common': 'commonjs @temporalio/common',
        '@temporalio/worker': 'commonjs @temporalio/worker',
        '@cursor/sdk': 'commonjs @cursor/sdk',
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.json'
                        }
                    }
                ]
            }
        ]
    },
    devtool: 'nosources-source-map',
    infrastructureLogging: {
        level: "log",
    },
};

module.exports = [extensionConfig, workerConfig];
