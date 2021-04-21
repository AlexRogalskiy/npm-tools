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

import * as fs from "fs-extra";
import * as path from "path";

export async function git_info(cwd: string): Promise<void> {
    const gitInfoName = "git-info.json";
    const gitInfoPath = path.join(cwd, gitInfoName);
    const gitInfo = await obtainGitInfo(cwd);
    await fs.writeJson(gitInfoPath, gitInfo, { spaces: 2, encoding: "utf8" });
}

/**
 * Return Git remote origin URL, branch, and sha for provided
 * directory.  If provided directory is not a Git repository, empty
 * strings will be returned for the repository, branch, and sha.
 *
 * @param directory path to local Git repository
 * @return Git URL, branch, and sha
 */
export async function obtainGitInfo(directory: string): Promise<GitInformation> {
    const gitInfo: GitInformation = {
        sha: "",
        branch: "",
        repository: "",
    };
    const gitPath = path.join(directory, ".git");
    const headPath = path.join(gitPath, "HEAD");
    const refsPath = path.join(gitPath, "refs", "heads");
    const configPath = path.join(gitPath, "config");
    const head = (await fs.readFile(headPath)).toString().trim();
    const refHead = "ref: refs/heads/";
    if (head.indexOf(refHead) === 0) {
        const branch = head.replace(refHead, "");
        if (!branch) {
            throw new Error(`failed to get branch from ${headPath}: ${head}`);
        }
        gitInfo.branch = branch;
        const branchPath = path.join(refsPath, branch);
        const sha = (await fs.readFile(branchPath)).toString().trim();
        if (!sha) {
            throw new Error(`failed to get SHA from ${branchPath}`);
        }
        gitInfo.sha = sha;
    } else {
        gitInfo.sha = head;
        gitInfo.branch = head;
    }
    const configLines = (await fs.readFile(configPath)).toString().split("\n");
    for (let i = 0; i < configLines.length; i++) {
        if (/^\[remote "origin"\]$/.test(configLines[i])) {
            for (let j = i + 1; i < configLines.length; j++) {
                if (/^\s+url\s*=/.test(configLines[j])) {
                    const url = configLines[j].replace(/.*?=\s*/, "");
                    if (!url) {
                        continue;
                    }
                    gitInfo.repository = cleanGitUrl(url);
                    i = configLines.length;
                    break;
                } else if (/^\S/.test(configLines[j])) {
                    i = j;
                    break;
                }
            }
        }
    }
    if (!gitInfo.repository) {
        throw new Error(`failed to get remote origin URL from ${configPath}`);
    }
    return gitInfo;
}

/*
 * Information about current Git commit and remote.
 */
export interface GitInformation {
    sha: string;
    branch: string;
    repository: string;
}

export function cleanGitUrl(url: string): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const gitUrlParse = require("git-url-parse");
    const gitUrl = gitUrlParse(url);
    gitUrl.user = undefined;
    gitUrl.git_suffix = true;
    return gitUrl.toString("ssh");
}
