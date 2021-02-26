import { WebClient } from '@slack/web-api';
import schedule from 'node-schedule';
import dotenv from 'dotenv';
dotenv.config();
import psiNews from './psi-news';

const slackToken = process.env.SLACK_TOKEN!;

const webClient = new WebClient(slackToken);

schedule.scheduleJob('0 * * * *', () => {
    psiNews({ webClient });
});
