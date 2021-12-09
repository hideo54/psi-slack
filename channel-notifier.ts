import { SlackClients, channelIds } from './lib/slack';

const main = ({ webClient, slackEvents }: SlackClients) => {
    slackEvents.on('channel_created', event => {
        const { id, creator } = event.channel;
        webClient.chat.postMessage({
            channel: channelIds.random,
            icon_emoji: ':mega:',
            username: 'チャンネルお知らせ',
            text: `<@${creator}>が新しいチャンネル <#${id}> を作成しました :+1:`,
        });
    });
    slackEvents.on('channel_unarchive', event => {
        const { channel, user } = event;
        webClient.chat.postMessage({
            channel: channelIds.random,
            icon_emoji: ':mega:',
            username: 'チャンネルお知らせ',
            text: `<@${user}>が新しいチャンネル <#${channel}> を作成しました :+1:`,
        });
    });
};

export default main;
