import { SlackClients, channelIds } from './lib/slack';

const main = ({ webClient, slackEvents }: SlackClients) => {
    slackEvents.on('channel_created', event => {
        const { id, creator } = event.channel;
        webClient.chat.postMessage({
            channel: channelIds.random,
            as_user: false,
            icon_emoji: ':mega:',
            username: '学科からのお知らせ',
            text: `<@${creator}>が新しいチャンネル <#${id}> を作成しました :+1:`,
        });
    });
};

export default main;
