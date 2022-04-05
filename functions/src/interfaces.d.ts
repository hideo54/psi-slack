import type { App } from '@slack/bolt';
import type { Firestore } from 'firebase-admin/firestore';

export interface HourlyJobFunction {
    slackApp: App;
    firestoreDb: Firestore;
    channel: string;
}

export interface Cache {
    psiNews: string[];
    facultyNews: string[];
}
