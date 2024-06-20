import { Client, Databases, ID, Query, Messaging } from 'node-appwrite';

const DATABASE_ID = process.env.DATABASE_ID;
const QUIZ_COLLECTION_ID = process.env.QUIZZES_COLLECTION_ID;
const SESSION_COLLECTION_ID = process.env.SESSION_COLLECTION_ID;

export default async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint('https://cloud.appwrite.io/v1')
        .setProject(process.env.PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const database = new Databases(client);
    const messaging = new Messaging(client);

    const { quizId } = JSON.parse(req.body);
    log(req.body);

    try {
        // Step 1: Update quiz status to 'end'
        await database.updateDocument(
            DATABASE_ID,
            QUIZ_COLLECTION_ID,
            quizId,
            { status: 'end' }
        );

        // Step 2: Get all sessions for the quiz and sort by score ascending
        const sessionResponse = await database.listDocuments(
            DATABASE_ID,
            SESSION_COLLECTION_ID,
            [
                Query.equal('quiz', quizId),
                Query.orderAsc('Score')
            ]
        );
        log('Session list:', sessionResponse);

        const sessions = sessionResponse.documents;

        // Step 3: Determine the number of winners to notify
        const winnersCount = 3; // This value can be adjusted based on your requirement

        // Step 4: Select top winners based on sorted scores
        const topWinners = sessions.slice(0, winnersCount);

        // Step 5: Send emails to winners
        const sendEmailPromises = topWinners.map(async (winner) => {
            try {
                const emailResponse = await messaging.createEmail(
                    ID.unique(),
                    'Congratulations!',
                    `Dear ${winner.username},\n\nYou are one of the top winners in our quiz!`,
                    [],
                    [winner.playerId], // Assuming playerId is the email recipient
                    [], // CC
                    [], // BCC
                    [], // Attachments
                    false, // Use HTML
                    false // Use SMTP
                );
                log(`Email sent to ${winner.username}:`, emailResponse);
            } catch (err) {
                error(`Failed to send email to ${winner.username}:`, err);
                throw err; // Propagate error to handle it globally
            }
        });

        // Step 6: Wait for all email promises to complete
        await Promise.all(sendEmailPromises);

        // Step 7: Respond with success message
        return res.json({ success: true, message: 'Quiz ended, winners notified.' });
    } catch (err) {
        error('Error occurred:', err);
        return res.json({ success: false, message: 'Failed to process quiz end and notify winners.' });
    }
};
