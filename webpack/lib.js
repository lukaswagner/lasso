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
        output: { clean: true, path: path.join(__dirname, '..', 'lib') },
        resolve: { extensions: ['.ts', '...'] },
        module: {
            rules: [ { test: /\.ts$/, use: { loader: 'ts-loader' } } ],
        },
    }
}
