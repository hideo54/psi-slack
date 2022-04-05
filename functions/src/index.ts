import * as functions from 'firebase-functions';
import dotenv from 'dotenv';
dotenv.config();
import psiNews from './psiNews';
import channelNotifier from './channelNotifier';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const botChannel = process.env.SLACK_BOT_CHANNEL!;

export const psiSlackHourlyJob = functions
    .region('asia-northeast1')
    .pubsub.schedule('0 * * * *')
    .timeZone('Asia/Tokyo')
    .onRun(async () => {
        await psiNews({ channel: botChannel });
    });

export const psiSlackEventsReceiver = functions
    .region('asia-northeast1')
    .https.onRequest(channelNotifier({ channel: botChannel }));
