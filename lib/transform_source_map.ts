/*
 * Copyright © 2020 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as path from "path";
import * as fs from "fs-extra";

export async function transformSourceMaps(cwd: string): Promise<void> {
    const files = await (await import("fast-glob"))(["**/!(*.d).ts{,x}"], {
        cwd,
        onlyFiles: true,
        dot: true,
        ignore: [".git", "node_modules"],
    });

    if (files.length > 0) {
        // Make sure the src path exists and we can move files into
        await fs.ensureDir(path.join(cwd, "src"));

        for (const file of files) {
            // Get both map files
            const basePath = file;
            const base = file.slice(0, -path.extname(basePath).length);
            const tsMap = `${base}.d.ts.map`;
            const jsMap = `${base}.js.map`;

            // Move the ts file out of the way
            await fs.move(path.join(cwd, file), path.join(cwd, "src", file));

            await updateSourceMap(tsMap, cwd, basePath);
            await updateSourceMap(jsMap, cwd, basePath);
        }
    }
}

async function updateSourceMap(mapPath: string, cwd: string, basePath: string): Promise<void> {
    const segments = `..${path.sep}`.repeat(basePath.split(path.sep).length - 1);
    const mapFile = path.join(cwd, mapPath);
    if (await fs.pathExists(mapFile)) {
        const sourceMap = await fs.readJson(mapFile);
        sourceMap.sources = [`${segments}src${path.sep}${basePath}`];
        await fs.writeJson(mapFile, sourceMap);
    }
}
