import { App, ExpressReceiver } from '@slack/bolt';

const receiver = new ExpressReceiver({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    endpoints: '/events',
    processBeforeResponse: true,
});

const app = new App({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    token: process.env.SLACK_TOKEN!,
    receiver,
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const randomChannel = process.env.SLACK_RANDOM_CHANNEL!;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const botChannel = process.env.SLACK_BOT_CHANNEL!;

app.event('channel_created', async ({ event, client }) => {
    const { id, creator } = event.channel;
    client.chat.postMessage({
        channel: botChannel,
        icon_emoji: ':mega:',
        username: 'チャンネルお知らせ',
        text: `<@${creator}>が新しいチャンネル <#${id}> を作成しました :+1:`,
    });
});

app.event('channel_unarchive', async ({ event, client }) => {
    const { channel, user } = event;
    client.chat.postMessage({
        channel: botChannel,
        icon_emoji: ':mega:',
        username: 'チャンネルお知らせ',
        text: `<@${user}>がチャンネル <#${channel}> を復元しました :+1:`,
    });
});

export default receiver.app;

