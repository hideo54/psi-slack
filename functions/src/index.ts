import * as functions from 'firebase-functions';
import channelNotifier from './channelNotifier';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const randomChannel = process.env.SLACK_RANDOM_CHANNEL!;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const botChannel = process.env.SLACK_BOT_CHANNEL!;

export const psiSlackHourlyJob = functions
    .region('asia-northeast1')
    .pubsub.schedule('0 * * * *')
    .timeZone('Asia/Tokyo')
    .onRun(() => {
        console.log('Hello, world!');
        return null;
    });

export const psiSlackEventsReceiver = functions
    .region('asia-northeast1')
    .https.onRequest(channelNotifier({ channel: botChannel }));
