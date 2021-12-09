import { SlackClients, channelIds } from './lib/slack';

const main = ({ webClient, slackEvents }: SlackClients) => {
    const notify = (event: any) => {
        const { id, creator } = event.channel;
        webClient.chat.postMessage({
            channel: channelIds.random,
            as_user: false,
            icon_emoji: ':mega:',
            username: 'チャンネルお知らせ',
            text: `<@${creator}>が新しいチャンネル <#${id}> を作成しました :+1:`,
        });
    };
    slackEvents.on('channel_created', notify);
    slackEvents.on('channel_unarchive', notify);
};

export default main;
