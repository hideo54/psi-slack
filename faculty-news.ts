import fs from 'fs/promises';
import axios from 'axios';
import iconv from 'iconv-lite';
import { scrapeHTML } from 'scrape-it';
import cheerio from 'cheerio';
import slackify from 'slackify-html';
import type { WebAPICallResult } from '@slack/web-api';
import { SlackClients, channelIds } from './lib/slack';

const host = 'https://info.t.u-tokyo.ac.jp';

const getHtml = async (url: string) => {
    const proxy = {
        protocol: 'http',
        host: process.env.FACULTY_PROXY_HOST!,
        port: parseInt(process.env.FACULTY_PROXY_PORT!),
        auth: {
            username: process.env.FACULTY_PROXY_USERNAME!,
            password: process.env.FACULTY_PROXY_PASSWORD!,
        },
    };
    try {
        const res = await axios.get<Buffer>(url, {
            responseType: 'arraybuffer',
            proxy,
        });
        const html = iconv.decode(res.data, 'euc-jp');
        return html;
    } catch (e) {
        return '';
    }
};

interface TableData {
    color: string;
    url: string;
    title: string;
    category: string;
    date: string;
}

const retrieveNews = async () => {
    const html = await getHtml(host + '/portal_news.html');
    const tableData = {
        color: {
            selector: 'font',
            attr: 'color',
        },
        url: {
            selector: 'a',
            attr: 'href',
            convert: (s: string) => 'https://info.t.u-tokyo.ac.jp' + s,
        },
        title: 'a',
        category: 'td:nth-child(3)',
        date: 'td:nth-child(4)',
    };
    const newsWithHead = scrapeHTML<{[key: string]: TableData[]}>(html, {
        articles: {
            listItem: 'table:nth-of-type(1) tr',
            data: tableData,
        },
        deadlines: {
            listItem: 'table:nth-of-type(2) tr',
            data: tableData,
        },
        deaths: {
            listItem: 'table:nth-of-type(3) tr',
            data: tableData,
        },
    });
    const news = Object.fromEntries(
        Object.entries(newsWithHead).map((([key, arr]) => [key, arr.slice(1)]))
    );
    return news;
};

const main = async ({ webClient }: SlackClients) => {
    const readArticleUrls = JSON.parse(
        await fs.readFile('cache/readFacultyArticleUrls.json', 'utf-8')
    ) as string[];
    const news = await retrieveNews();
    const unreadArticles = news.articles.filter(data => !readArticleUrls.includes(data.url));
    unreadArticles.reverse();
    for (const article of unreadArticles) {
        const html = await getHtml(article.url);
        const htmlWithUrlReplaced = html.replace(/href="\/(.+)"/, `href="${host}/$1"`);
        const bodyForSlack = slackify(cheerio.load(htmlWithUrlReplaced)('pre').html()!).trim();
        const headBlocks = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<${host}|工学部ポータルサイト>の「新着情報」が更新されました。`,
                },
            },
            {
                type: 'context',
                elements: [{
                    type: 'mrkdwn',
                    text: '閲覧にはプロキシ設定が必要です。',
                }],
            },
            { type: 'divider' },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*<${article.url}|${article.title}>*`,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*登録元:* ${article.category}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*登録日:* ${article.date}`,
                    },
                ],
            },
        ];
        const bodyBlocks = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: bodyForSlack,
                },
            },
        ];
        interface Result extends WebAPICallResult {
            ts: string;
        }
        const { ts } = await webClient.chat.postMessage({
            channel: channelIds.random,
            icon_emoji: ':mega:',
            username: '工学部新着情報',
            text: '工学部ポータルサイトの「新着情報」が更新されました。',
            blocks: headBlocks,
        }) as Result;
        await webClient.chat.postMessage({
            channel: channelIds.random,
            icon_emoji: ':mega:',
            username: '工学部新着情報',
            text: '工学部ポータルサイトの「新着情報」が更新されました。',
            blocks: bodyBlocks,
            thread_ts: ts,
        });
    }
    readArticleUrls.push(...news.articles.map(article => article.url));
    await fs.writeFile('cache/readFacultyArticleUrls.json', JSON.stringify(readArticleUrls));
};

export default main;
