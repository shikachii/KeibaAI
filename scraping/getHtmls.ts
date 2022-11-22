import fs from 'fs';
import readline from 'readline';
import axios from 'axios';
import iconv from 'iconv-lite';
// const iconv = require('iconv');

import { sleep } from './utils';

const readLines = (path: string, encoding?: BufferEncoding): Promise<string[]> => {
    const stream = fs.createReadStream(path, { encoding });
    const rl = readline.createInterface({ input: stream });

    return new Promise((resolve, reject) => {
        const list: string[] = [];
        rl
            .on('line', (line) => { list.push(line) })
            .on('close', () => resolve(list));
    });
}

const main = async () => {
    // 去年まで
    const years = Array.from(Array(10)).map((_, i) => 2021 - i);
    const months = Array.from(Array(12)).map((_, i) => i + 1);

    for await (const year of years) {
        for await (const month of months) {
            getRaceHtmls(year, month);
        }
    }

    // 今年

    // 今月
}

const getRaceHtmls = async (year: number, month: number) => {
    const urlPath = `raceUrls/${year}_${month}.txt`;
    const urls = await readLines(urlPath);

    let count = 0;
    for await (const url of urls) {
        const raceId = url.split('/')[4];
        const saveDir = `html/${year}/${month}/`;
        const saveFilePath = `${saveDir}${raceId}.html`;

        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });
        const payload = iconv.decode(Buffer.from(response.data), 'euc-jp');

        const exists = fs.existsSync(saveFilePath);
        if (!exists) {
            fs.mkdir(saveDir, { recursive: true }, (err) => {
                if (err) throw err;
            });
            fs.writeFile(saveFilePath, payload, (err) => {
                if (err) throw err;
                console.log(`${saveFilePath}, 完了`);
            });
        }

        // 待機
        await sleep(1 * 1000);
    }
}

main();