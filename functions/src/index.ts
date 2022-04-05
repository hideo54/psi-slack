import * as functions from 'firebase-functions';
import channelNotifier from './channelNotifier';

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
    .https.onRequest(channelNotifier);
