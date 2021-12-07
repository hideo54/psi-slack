import { WebClient } from '@slack/web-api';
import { SlackEventAdapter } from '@slack/events-api';

export interface SlackClients {
    webClient: WebClient;
    slackEvents: SlackEventAdapter;
}

export const channelIds = {
    random: process.env.SLACK_RANDOM_CHANNEL!,
    hideo54: process.env.SLACK_HIDEO54_USERID!,
};
