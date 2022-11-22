import puppeteer from 'puppeteer';
import fs from 'fs';
import { sleep } from './utils';

type DateType = {
    year: number;
    month: number;
}
export const getRaceUrls = async ({ year, month }: DateType, page: puppeteer.Page) => {
    console.log(`${year}年${month}月 取得開始`);

    /** フォームを埋める */
    await page.select('#db_search_detail_form > form > table > tbody > tr:nth-child(3) > td > select:nth-child(1)', `${year}`);
    await page.select('#db_search_detail_form > form > table > tbody > tr:nth-child(3) > td > select:nth-child(2)', `${month}`);

    await page.select('#db_search_detail_form > form > table > tbody > tr:nth-child(3) > td > select:nth-child(3)', `${year}`);
    await page.select('#db_search_detail_form > form > table > tbody > tr:nth-child(3) > td > select:nth-child(4)', `${month}`);

    // 送信
    page.click('#db_search_detail_form > form > div > input:nth-child(1)')
    await page.waitForNavigation({ timeout: 30*1000, waitUntil: 'domcontentloaded' });

    const raceUrlFile = `raceUrls/${year}_${month}.txt`;

    let count = 0;
    while (true) {
        // 制限
        await sleep(5 * 1000);

        // 一覧ページ
        const raceUrls = await page.$$eval(
            '#contents_liquid > table > tbody > tr > td:nth-child(5) > a',
            (items) => items.map((item) => (item as HTMLAnchorElement).href)
        );

        const summary = await page.$eval('#contents_liquid > div.search_result_box > div.pager', (item) => {
            const content = item.textContent!;
            return content.split('目')[0].trim();
        });

        const data = raceUrls.join('\n') + '\n';
        const options = {
            flag: 'a'
        }
        fs.writeFile(raceUrlFile, data, options, (err) => {
            if (err) throw err;
            console.log(`${summary} 正常終了`);
        });

        // 次へボタンを押す
        const nextSelector = count === 0
            ? '#contents_liquid > div.search_result_box > div.pager > a'
            : '#contents_liquid > div.search_result_box > div.pager > a:nth-child(2)';
        count ++;
        const next = await page.$(nextSelector);
        
        if (next) next.click();
        else break;

        // 遷移待ち
        await page.waitForNavigation({ timeout: 30*1000, waitUntil: 'domcontentloaded' });
    }
    console.log(`${year}年${month}月 取得終了`);

    // 月ごとの取得が終わるごとに10秒休憩
    await sleep(10 * 1000);
}
