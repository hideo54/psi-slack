import * as functions from 'firebase-functions';
import admin from 'firebase-admin'; // Default import required
import { getFirestore } from 'firebase-admin/firestore';
import { App } from '@slack/bolt';
import dotenv from 'dotenv';
dotenv.config();
import psiNews from './psiNews';
import facultyNews from './facultyNews';
import channelNotifier from './channelNotifier';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const randomChannel = process.env.SLACK_RANDOM_CHANNEL!;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const facultyNewsChannel = process.env.SLACK_FACULTY_NEWS_CHANNEL!;

export const psiSlackHourlyJob = functions
    .region('asia-northeast1')
    .pubsub.schedule('0 * * * *')
    .timeZone('Asia/Tokyo')
    .onRun(async () => {
        const slackApp = new App({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            token: process.env.SLACK_TOKEN!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            signingSecret: process.env.SLACK_SIGNING_SECRET!,
        });
        admin.initializeApp();
        const firestoreDb = getFirestore();
        await psiNews({ slackApp, firestoreDb, channel: randomChannel });
        await facultyNews({ slackApp, firestoreDb, channel: facultyNewsChannel });
    });

export const psiSlackEventsReceiver = functions
    .region('asia-northeast1')
    .https.onRequest(channelNotifier({ channel: randomChannel }));
