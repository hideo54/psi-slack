import dotenv from 'dotenv';
dotenv.config();
import { getUnreadNews, auth } from './psi-news';

(async () => {
    const news = await getUnreadNews([]);
    console.log(news);
})();
