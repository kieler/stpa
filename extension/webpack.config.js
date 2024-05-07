//@ts-check
'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const commonConfig = {
    target: 'node',
    mode: "none", // Leave source code as close as possible. Only set to production during distribution.
    devtool: 'nosources-source-map',
    externals: {
        vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: ['ts-loader']
            },
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
            }
        ]
    },
    ignoreWarnings: [/Failed to parse source map/]
}

/**@type {import('webpack').Configuration}*/
const vscodeConfig = {
    ...commonConfig,
    entry: path.resolve(__dirname, 'src/extension.ts'),
    output: { 
        path: path.resolve(__dirname, 'pack'),
        filename: 'extension.js',
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    }
}

/**@type {import('webpack').Configuration}*/
const lsConfig = {
    ...commonConfig,
    entry: path.resolve(__dirname, 'src-language-server/main.ts'),
    output: {
		filename: 'language-server.js',
        path: path.resolve(__dirname, 'pack'),
    },
};


/**@type {import('webpack').Configuration}*/
const commonWebConfig = {
    target: 'web',
    mode: "none", // Leave source code as close as possible. Only set to production during distribution.
    devtool: 'eval-source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['ts-loader']
            },
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre'
            },
            {
                test: /\.css$/,
                exclude: /\.useable\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(ttf)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: '',
                    publicPath: '..',
                    postTransformPublicPath: (p) => `__webpack_public_path__ + ${p}`,
                }
            },
        ]
    },
    ignoreWarnings: [/Failed to parse source map/]
};

/**@type {import('webpack').Configuration}*/
const diagramWebviewConfig = {
    ...commonWebConfig,
    entry: path.resolve(__dirname, 'src-webview/main.ts'),
    output: {
		filename: 'webview.js',
        path: path.resolve(__dirname, 'pack'),
    }
}

/**@type {import('webpack').Configuration}*/
const webviewConfig = {
    ...commonWebConfig,
    entry: path.resolve(__dirname, 'src-webview/main.ts'),
    output: {
		filename: 'webview.js',
        path: path.resolve(__dirname, 'pack'),
    }
};

/**@type {import('webpack').Configuration}*/
const contextTableConfig = {
    ...commonWebConfig,
    entry: path.resolve(__dirname, 'src-context-table/main.ts'),
    output: {
		filename: 'context-table-panel.js',
        path: path.resolve(__dirname, 'pack')
    },

    externals: {vscode: "commonjs vscode"}
};

/**@type {import('webpack').Configuration}*/
const snippetConfig = {
    ...commonWebConfig,
    entry: path.resolve(__dirname, 'src-diagram-snippets/main.ts'),
    output: {
		filename: 'snippetWebview.js',
        path: path.resolve(__dirname, 'pack'),
    }
};

module.exports = [vscodeConfig, lsConfig, webviewConfig, contextTableConfig, snippetConfig];
