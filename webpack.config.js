const path = require('path');
const config = require('dotenv').config();
const debug = Boolean(config.debug);
if(debug) {
  console.log("Debug mode");
} else {
  console.log("Non-Debug mode");
}
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

require('graceful-fs').gracefulify(require('fs'));

const indexFile = path.resolve(__dirname, 'src/app/index.js'); // the actual entry file
const buildDir = path.resolve(__dirname, 'dist'); // contains the built items
const nodeModulesDir  = path.resolve(__dirname, 'node_modules'); // the node_modules folder

const htmlWebPluginSettings={
    title: '3D INSIGHTORS',
    template: path.join(path.resolve(__dirname, 'asset/resource'),'template.html'),
    filename: path.join(__dirname, 'dist/index.html'),
    favicon:  path.join(path.resolve(__dirname, 'asset/resource'),'img/favicon.ico'),
    minify: {
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true,
      removeComments: true
    }
};

const resourceDir = path.resolve(__dirname, 'asset/resource');

module.exports = {
    context: __dirname,
    mode: 'production',
    devtool: debug ? 'inline-source-map' : 'source-map',
    entry: {
        app: debug ? ['webpack-hot-middleware/client', indexFile] : [indexFile]
    },
    output: debug ? {
        filename: 'app.js',
        path: buildDir,
        sourcePrefix: '',
        publicPath: '/'
    } : {
        filename: 'bundle.js',
        path: buildDir,
        publicPath: '/'
    },
    amd: {
        toUrlUndefined: true
    },
    resolve: {
        alias: {
            basemap: path.resolve(__dirname, 'src/basemap'),
            js: path.join(resourceDir,'js'),
            css: path.join(resourceDir,'css'),
            img: path.join(resourceDir,'img'),
            data: path.join(resourceDir,'data')
        },
        mainFiles: ['index']
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: debug ? [
                'style-loader','css-loader'
            ] : [
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
    plugins: debug ? [  
        new HtmlWebpackPlugin(htmlWebPluginSettings),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(), 
        new webpack.DefinePlugin({
            'process.env': {
              'NODE_ENV': JSON.stringify('production')
            }
        }),
        new MiniCssExtractPlugin()
    ] : [
        new webpack.optimize.ModuleConcatenationPlugin(),     
        new webpack.DefinePlugin({
            'process.env': {
              'NODE_ENV': JSON.stringify('production')
            }
        }),
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin(htmlWebPluginSettings)
    ]
};