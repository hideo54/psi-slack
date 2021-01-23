import axios from 'axios';
import cheerio from 'cheerio';
import dotenv from 'dotenv';
dotenv.config();

const pageAuth = {
    username: process.env.USERNAME!,
    password: process.env.PASSWORD!,
};

interface Notice {
    date: string;
    category: string;
    title: string;
    link: string;
}

const getLatestNews = async () => {
    const res = await axios.get('https://www.si.t.u-tokyo.ac.jp/student/news/', {
        auth: pageAuth,
    });
    const html = res.data;
    const $ = cheerio.load(html);
    const notices = $('ul.student_newslist > li').map((_i, e) => ({
        date: $('dt > p', e).text(),
        category: $('dt > strong', e).text(),
        link: $('dd > a', e).attr('href'),
        title: $('dd > a', e).text(),
    })).toArray().map(e => new Object(e) as Notice);
    return notices;
};

(async () => {
    await getLatestNews();
})();
