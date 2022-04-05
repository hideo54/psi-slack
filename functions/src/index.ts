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
const botChannel = process.env.SLACK_BOT_CHANNEL!;

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
        const channel = botChannel;
        await psiNews({ slackApp, firestoreDb, channel });
        await facultyNews({ slackApp, firestoreDb, channel });
    });

export const psiSlackEventsReceiver = functions
    .region('asia-northeast1')
    .https.onRequest(channelNotifier({ channel: botChannel }));
