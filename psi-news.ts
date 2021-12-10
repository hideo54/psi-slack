import fs from 'fs/promises';
import axios from 'axios';
import cheerio from 'cheerio';
import slackify from 'slackify-html';
import type { WebAPICallResult } from '@slack/web-api';
import { SlackClients, channelIds } from './lib/slack';

const newsPageUrl = 'https://www.si.t.u-tokyo.ac.jp/student/news/';
const auth = {
    username: process.env.PSI_COMMON_USERNAME!,
    password: process.env.PSI_COMMON_PASSWORD!,
};

interface Notice {
    date: string;
    category: string;
    title: string;
    url: string;
    bodyForSlack: string;
}

const getNewsBodyForSlack = async (pageUrl: string) => {
    const res = await axios.get(pageUrl, { auth });
    const html = res.data;
    const $ = cheerio.load(html);
    const bodyForSlack = slackify($('div#newsbody').html()!).trim();
    return bodyForSlack;
};

export const getUnreadNews = async (readUrls: string[]) => {
    const res = await axios.get(newsPageUrl, { auth });
    const html = res.data;
    const $ = cheerio.load(html);
    type NoticeExcerpt = Omit<Notice, 'bodyForSlack'>;
    const noticeExcerpts = $('ul.student_newslist > li').map((_i, e) => ({
        date: $('dt > p', e).text(),
        category: $('dt > strong', e).text(),
        title: $('dd > a', e).text(),
        url: $('dd > a', e).attr('href'),
    })).toArray().map(e =>
        new Object(e) as NoticeExcerpt
    );
    const unreadNoticeExcerptsForPSI = noticeExcerpts.filter(excerpt =>
        ['共通', 'PSI', '未分類'].includes(excerpt.category) && !readUrls.includes(excerpt.url)
    );
    const unreadNotices: Notice[] = [];
    for (const excerpt of unreadNoticeExcerptsForPSI) {
        const bodyForSlack = await getNewsBodyForSlack(excerpt.url);
        unreadNotices.push({
            ...excerpt,
            bodyForSlack,
        });
    }
    return unreadNotices;
};

const main = async ({ webClient }: SlackClients) => {
    const readUrls = JSON.parse(
        await fs.readFile('cache/readUrls.json', 'utf-8')
    ) as string[];
    const news = await getUnreadNews(readUrls);
    news.reverse();
    for (const notice of news) {
        const headBlocks = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<${newsPageUrl}|学科からのお知らせ>が更新されました。(カテゴリ: ${notice.category})`,
                },
            },
            {
                type: 'context',
                elements: [{
                    type: 'mrkdwn',
                    text: ':key: パスワードは `' + `${auth.username}:${auth.password}` + '` です。',
                }],
            },
            { type: 'divider' },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*<${notice.url}|${notice.title}>*`,
                },
            },
        ];
        const bodyBlocks = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: notice.bodyForSlack,
                },
            },
        ];
        interface Result extends WebAPICallResult {
            ts: string;
        }
        const { ts } = await webClient.chat.postMessage({
            channel: channelIds.random,
            icon_emoji: ':mega:',
            username: '学科からのお知らせ',
            text: `新しい「学科からのお知らせ」: *${notice.title}*`,
            blocks: headBlocks,
        }) as Result;
        await webClient.chat.postMessage({
            channel: channelIds.random,
            icon_emoji: ':mega:',
            username: '学科からのお知らせ',
            text: `新しい「学科からのお知らせ」: *${notice.title}*`,
            blocks: bodyBlocks,
            thread_ts: ts,
        });
    }
    readUrls.push(...news.map(notice => notice.url));
    await fs.writeFile('cache/readUrls.json', JSON.stringify(readUrls));
};

export default main;
