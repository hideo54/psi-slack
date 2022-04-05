import { App } from '@slack/bolt';
import admin from 'firebase-admin';
import axios from 'axios';
import cheerio from 'cheerio';
import slackify from 'slackify-html';

const app = new App({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    token: process.env.SLACK_TOKEN!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

admin.initializeApp();

const newsPageUrl = 'https://www.si.t.u-tokyo.ac.jp/student/news/';
const auth = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    username: process.env.PSI_COMMON_USERNAME!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
    const bodyForSlack = slackify($('div#newsbody').html() || '').trim();
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
        ['共通', 'PSI', '未分類'].includes(excerpt.category)
        && !readUrls.includes(excerpt.url)
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

const func = async ({ channel }: { channel: string; }) => {
    const db = admin.database();
    // TODO: read readUrls from cache
    const readUrls: string[] = [];
    const news = await getUnreadNews(readUrls);
    news.reverse();
    const notice = news[0];
    // for (const notice of news) {
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
    const bodyBlocks = textToSlackBlocks(notice.bodyForSlack);
    const { ts } = await app.client.chat.postMessage({
        channel,
        icon_emoji: ':mega:',
        username: '学科からのお知らせ',
        text: `新しい「学科からのお知らせ」: *${notice.title}*`,
        blocks: headBlocks,
    });
    await app.client.chat.postMessage(
        {
            channel,
            icon_emoji: ':mega:',
            username: '学科からのお知らせ',
            text: `新しい「学科からのお知らせ」: *${notice.title}*`,
            blocks: bodyBlocks,
            thread_ts: ts,
        }
    );
    // }
    readUrls.push(...news.map(notice => notice.url));
    // TODO: write readUrls to cache
    await db.ref('psi-slack').child('psi-news-read-urls').set(readUrls);
};

export default func;
