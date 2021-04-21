#! /usr/bin/env node
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

import "source-map-support/register";

import * as yargs from "yargs";

yargs
    .command(
        "source-maps",
        "Rewrite source maps",
        args =>
            args.options({
                cwd: { type: "string", description: "Directory", demandOption: false, default: process.cwd() },
            }),
        async argv => {
            return (await import("../lib/transform_source_map")).transformSourceMaps(argv.cwd);
        },
    )
    .command(
        "git-info",
        "Write Git information",
        args =>
            args.options({
                cwd: { type: "string", description: "Directory", demandOption: false, default: process.cwd() },
            }),
        async argv => {
            return (await import("../lib/git_info")).git_info(argv.cwd);
        },
    )
    .command(
        "clean-npm-tags",
        "Clean up npm dist tags",
        args =>
            args.options({
                cwd: { type: "string", description: "Directory", demandOption: false, default: process.cwd() },
                name: { type: "string", description: "npm Package name", demandOption: false },
                regexp: {
                    type: "string",
                    description: "Regular expression matching against dist-tag",
                    demandOption: false,
                    default: "branch-.*",
                },
            }),
        async argv => {
            return (await import("../lib/clean_npm_tags")).cleanNpmTags(argv.cwd, argv.name, argv.regexp);
        },
    )
    .strict()
    .help().argv;
