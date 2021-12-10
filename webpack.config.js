const path = require('path');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

require('graceful-fs').gracefulify(require('fs'));

const indexFile = path.resolve(__dirname, 'src/app/index.js');
const buildDir = path.resolve(__dirname, 'dist');
const nodeModulesDir  = path.resolve(__dirname, 'node_modules');
const resourceDir = path.resolve(__dirname, 'asset');

const htmlWebPluginSettings={
    title: '3D INSIGHTORS',
    template: path.join(resourceDir, 'template.html'),
    filename: path.join(path.resolve(__dirname, 'dist'), 'index.html'),
    favicon:  path.join(resourceDir,'img/favicon.ico'),
    minify: {
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true,
      removeComments: true
    }
};

module.exports = {
    context: __dirname,
    mode: 'production',
    devtool: 'source-map',
    entry: {
        app: indexFile
    },
    output: {
        filename: 'bundle.js',
        path: buildDir,
        publicPath: '/'
    },
    amd: {
        toUrlUndefined: true
    },
    resolve: {
        alias: {
            asset: resourceDir
        },
        mainFiles: ['index']
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: [
                MiniCssExtractPlugin.loader, 
                'css-loader'
            ]
        },
        {
            test: /\.(gif|png|jpe?g|svg|ico)$/i, 
            use: [
              'file-loader?name=[path][name][ext]',
              {
                loader: 'image-webpack-loader',
                options: { 
                  bypassOnDebug: true, // webpack@1.x
                  disable: true, // webpack@2.x and newer                           
                  optipng: {                
                    enabled: false
                  }
                }
              }
            ]
        },
        {
            test: /\.(gif|png|jpe?g|svg|ico|xml|json)$/,
            use: [ 'url-loader' ]
        }]
    },
    optimization: {
        concatenateModules: true,
        mangleExports: true,
        mangleWasmImports: true,
        minimize: false,
        innerGraph: false,
        minimizer: [
          new CssMinimizerPlugin(),
          new TerserPlugin({
            parallel: true,
            terserOptions: {
                compress: true,
                mangle: true
            },
            extractComments: false
          })
        ],
        emitOnErrors: false,
        nodeEnv: 'production',
        removeAvailableModules: false
    },
    plugins: [
        new webpack.optimize.ModuleConcatenationPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, resourceDir), to: 'asset' }
            ]
        }),    
        new webpack.DefinePlugin({
            'process.env': {
              'NODE_ENV': JSON.stringify('production')
            }
        }),
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin(htmlWebPluginSettings)
    ]
};