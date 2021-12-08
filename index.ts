import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import schedule from 'node-schedule';
import type { SlackClients } from './lib/slack';
import dotenv from 'dotenv';
dotenv.config();

import psiNews from './psi-news';
import facultyNews from './faculty-news';
import channelNotifier from './channel-notifier';

const slackToken = process.env.SLACK_TOKEN!;
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET!;

const webClient = new WebClient(slackToken);
const slackEvents = createEventAdapter(slackSigningSecret);

slackEvents.start(parseInt(process.env.SLACK_PORT!));

const clients: SlackClients = { webClient, slackEvents };

schedule.scheduleJob('0 * * * *', () => {
    psiNews(clients);
    facultyNews(clients);
});

channelNotifier(clients);
