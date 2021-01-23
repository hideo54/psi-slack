import axios from 'axios';
import cheerio from 'cheerio';
import slackify from 'slackify-html';
import dotenv from 'dotenv';
dotenv.config();

const auth = {
    username: process.env.USERNAME!,
    password: process.env.PASSWORD!,
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
    const bodyForSlack = slackify($('div#newsbody').html()!)
    return bodyForSlack;
};

const getUnreadNews = async (readUrls: string[]) => {
    const newsPageUrl = 'https://www.si.t.u-tokyo.ac.jp/student/news/';
    const res = await axios.get(newsPageUrl, { auth});
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
        ['共通', 'PSI'].includes(excerpt.category) && !readUrls.includes(excerpt.url)
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

(async () => {
    const news = await getUnreadNews([]);
    console.log(news);
})();
