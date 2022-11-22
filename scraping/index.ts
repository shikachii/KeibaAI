import puppeteer from 'puppeteer';
import fs from 'fs';
import { getRaceUrls } from './getRaceUrls';
import { sleep } from './utils';

const ep = 'https://db.netkeiba.com/?pid=race_search_detail'

const main = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // 詳細検索ページに移動
    await page.goto(ep);

    /** 競馬場と表示件数は先に指定しておく */
    // 中央競馬場
    const ids = Array.from(Array(10)).map((_, i) => ('00' + (i + 1)).slice(-2));
    for await (const id of ids) {
        await page.click(`#check_Jyo_${id}`);
        await sleep(100); // GTMの影響？で同時に押そうとすると反応しないことがある
    }
    // 表示件数100件
    await page.select('#db_search_detail_form > form > table > tbody > tr:nth-child(11) > td > select', '100');


    // // 去年までのURLを取得
    const years = Array.from(Array(10)).map((_, i) => 2021 - i); // 2021年から10年前まで
    const months = Array.from(Array(12)).map((_, i) => 1 + i); // 1~12月
    for await (const year of years) {
        for await (const month of months) {
            const filePath = `raceUrls/${year}_${month}.txt`;
            const exists = fs.existsSync(filePath);
            if (!exists) await getRaceUrls({ year, month }, page);
        }
    }

    // 今年分のURL(先月まで)
    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth(); // 0 ~ 11
    for (let month = 1; month <= nowMonth; ++month) {
        const filePath = `raceUrls/${nowYear}_${month}.txt`;
        const exists = fs.existsSync(filePath);
        if (!exists) await getRaceUrls({ year: nowYear, month }, page);
    }

    // 今月分は常に取得
    await getRaceUrls({ year: nowYear, month: nowMonth + 1}, page);

    await browser.close();
};

main();