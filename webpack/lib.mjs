'use strict';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @returns {import("webpack").Configuration}
 */
export default function(env, args) {
    return {
        context: path.join(__dirname, '..', 'src'),
        entry: './lasso.ts',
        output: {
            filename: 'lasso.js',
            library: {
                name: 'lasso',
                type: 'amd'
            },
            path: path.join(__dirname, '..', 'lib'),
            clean: true,
        },
        resolve: { extensions: ['.ts', '...'] },
        module: {
            rules: [
                { test: /\.ts$/, use: { loader: 'ts-loader' } },
                { test: /\.json$/, type: 'asset/source' },
                {
                    test: /\.bin$/,
                    type: 'asset/inline',
                    generator: { dataUrl: (d) => d }
                }
            ],
        },
        devtool: 'source-map',
    }
}
