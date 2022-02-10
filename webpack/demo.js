'use strict';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @returns {import("webpack").Configuration}
 */
export default function(env, args) {
    return {
        context: path.join(__dirname, '..', 'demo'),
        entry: {
            index: './index.ts',
            style: './style.css',
        },
        output: { clean: true },
        plugins: [
            new HtmlWebpackPlugin({ template: './index.pug' }),
            new MiniCssExtractPlugin(),
            new RemoveEmptyScriptsPlugin(),
        ],
        resolve: { extensions: ['.ts', '...'] },
        module: {
            rules: [
                {
                    test: /\.pug$/,
                    use: { loader: 'pug-loader' },
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        { loader: 'css-loader' },
                    ]
                },
                {
                    test: /\.ts$/,
                    use: { loader: 'ts-loader' },
                },
            ],
        },
        devServer: { hot: false }
    }
}
