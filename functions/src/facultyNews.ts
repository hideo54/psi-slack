import axios from 'axios';
import iconv from 'iconv-lite';
import { scrapeHTML } from 'scrape-it';
import cheerio from 'cheerio';
import slackify from 'slackify-html';
import type { HourlyJobFunction, Cache } from './interfaces';

const host = 'https://info.t.u-tokyo.ac.jp';

const getHtml = async (url: string) => {
    const proxy = {
        protocol: 'http',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        host: process.env.FACULTY_PROXY_HOST!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        port: parseInt(process.env.FACULTY_PROXY_PORT!),
        auth: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            username: process.env.FACULTY_PROXY_USERNAME!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

const textToSlackBlocks = (text: string) => {
    const blocks = [];
    for (let i = 0; i < Math.ceil(text.length / 3000); i++) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: text.slice(3000 * i, 3000 * (i+1)),
            },
        });
    }
    return blocks;
};

const func = async ({ slackApp, firestoreDb, channel }: HourlyJobFunction) => {
    const cache = (
        await firestoreDb.collection('psi-slack').doc('cache').get()
    ).data() as Cache;
    const readArticleUrls = cache.facultyNews;
    const news = await retrieveNews();
    const unreadArticles = news.articles.filter(data => !readArticleUrls.includes(data.url));
    unreadArticles.reverse();
    for (const article of unreadArticles) {
        const html = await getHtml(article.url);
        const htmlWithUrlReplaced = html.replace(/href="\/(.+?)"/gi, `href="${host}/$1"`);
        const bodyForSlack = slackify(
            cheerio.load(htmlWithUrlReplaced)('pre').html() || ''
        ).trim();
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
                    text: '学外での閲覧にはプロキシ設定が必要です。',
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
        const bodyBlocks = textToSlackBlocks(bodyForSlack);
        const { ts } = await slackApp.client.chat.postMessage({
            channel,
            icon_emoji: ':mega:',
            username: '工学部新着情報',
            text: '工学部ポータルサイトの「新着情報」が更新されました。',
            blocks: headBlocks,
        });
        await slackApp.client.chat.postMessage({
            channel,
            icon_emoji: ':mega:',
            username: '工学部新着情報',
            text: '工学部ポータルサイトの「新着情報」が更新されました。',
            blocks: bodyBlocks,
            thread_ts: ts,
        });
    }
    const articleUrls = news.articles.map(article => article.url);
    const newCache: Cache = {
        psiNews: cache.psiNews,
        facultyNews: articleUrls,
    };
    await firestoreDb.collection('psi-slack').doc('cache').set(newCache);
    return;
};

export default func;
