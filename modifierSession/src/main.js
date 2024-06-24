import { Client, Databases, ID, Query, Messaging } from 'node-appwrite';

const DATABASE_ID = process.env.DATABASE_ID;
const QUIZ_COLLECTION_ID = process.env.QUIZ_COLLECTION_ID;
const SESSION_COLLECTION_ID = process.env.SESSION_COLLECTION_ID;

export default async ({ req, res, log, error }) => {
    try {
        const { quizId } = JSON.parse(req.body);
        log(`Received data: quizId=${quizId}`);

        const client = new Client()
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(process.env.PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const database = new Databases(client);
        const messaging = new Messaging(client);

        // Step 1: Update the quiz status
       
            await database.updateDocument(
                DATABASE_ID,
                QUIZ_COLLECTION_ID,
                quizId,
                { status: 'ended' }
            );
            log('Quiz status updated');

        // Step 2: Get all sessions for the quiz and sort by score ascending
        let sessions;
        try {
            const sessionResponse = await database.listDocuments(
                DATABASE_ID,
                SESSION_COLLECTION_ID,
                [
                    Query.equal("quiz", quizId),
                    Query.orderAsc("Score")
                ]
            );
              log(`Fetched session: ${JSON.stringify(sessionResponse)}`);
             sessions = sessionResponse.documents;
        } catch (e) {
            log(`Failed to fetch sessions for quiz ID ${quizId}: ${e.message}`);
            return res.json({ success: false, message: `Failed to fetch sessions for quiz ID: ${quizId}.` });
        }

        // Step 3: Determine the number of winners to notify
        const winnersCount = 3;
        log(`Number of winners to notify: ${winnersCount}`);

        // Step 4: Select top winners based on sorted scores
        const topWinners = sessions.slice(0, winnersCount);
        log(`Top winners selected: ${JSON.stringify(topWinners)}`);

        // Step 5: Send emails to winners
        const sendEmailPromises = topWinners.map(async (winner) => {
            try {
                await messaging.createEmail(
                    ID.unique(),
                    'Congratulations!',
                    `Dear ${winner.username},\n\nYou are one of the top winners in our quiz!`,
                    [],
                    [winner.email]
                );
                log(`Email sent to ${winner.username}`);
            } catch (e) {
                log(`Failed to send email to ${winner.username}: ${e.message}`);
            }
        });

        try {
            await Promise.all(sendEmailPromises);
            log('All winners have been notified.');
            return res.json({ success: true, message: 'Quiz ended, winners notified.' });
        } catch (e) {
            log(`Error occurred while sending emails: ${e.message}`);
            return res.json({ success: false, message: 'Failed to send one or more emails.' });
        }

    } catch (e) {
        log(`Error occurred: ${e.message}`);
        return res.json({ success: false, message: 'Failed to process quiz end and notify winners.' });
    }
};
