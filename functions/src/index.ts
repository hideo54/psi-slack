import * as functions from 'firebase-functions';

export const hourlyJob = functions.pubsub.schedule('0 * * * *')
    .timeZone('Asia/Tokyo')
    .onRun(() => {
        console.log('Hello, world!');
        return null;
    });
