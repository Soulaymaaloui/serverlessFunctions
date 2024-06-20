import { Client, Databases, Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.DATABASE_ID;
const QUIZ_COLLECTION_ID = process.env.QUIZ_COLLECTION_ID;
const SESSION_COLLECTION_ID = process.env.SESSION_COLLECTION_ID;

export default async ({ req, res, log, error }) => {
    try {
        const { quizId, playerId } = JSON.parse(req.body);
        log(`Received data: quizId=${quizId}, playerId=${playerId}`);

        const client = new Client()
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(process.env.PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const database = new Databases(client);

        // Check if the player has already participated in this quiz
        const query = [
            Query.equal("quiz", quizId),
            Query.equal("playerId", playerId)
        ];

        const existingSessions = await database.listDocuments(
            DATABASE_ID,
            SESSION_COLLECTION_ID,
            query,
            1
        );

        if (existingSessions.documents.length > 0) {
            log("Player has already participated in the quiz.");

            return res.json({
                success: false,
                message: "Player has already participated in the quiz."
            });
        } else {
            log("Player has not participated in this quiz yet.");

            // Create a new session for the player
            const sessionData = {
                quiz: quizId,
                playerId: playerId,
                Score: 0, // Initial score
                isWinner: false,
                playTime: new Date().toISOString(),
                completionStatus: "Incomplete",
                status: "Active"
            };

            try {
                const sessionDocument = await database.createDocument(
                    DATABASE_ID,
                    SESSION_COLLECTION_ID,
                    ID.unique(),
                    sessionData
                );

                log(`Session created: ${sessionDocument.$id}`);

                return res.json({
                    success: true,
                    message: "Player is allowed to participate in the quiz.",
                    sessionId: sessionDocument.$id
                });
            } catch (error) {
                log(`Error creating session: ${error.message}`);

                return res.json({
                    success: false,
                    message: "Error creating session.",
                    error: error.message
                });
            }
        }

    } catch (e) {
        log(`Error: ${e.message}`);

        return res.json({
            success: false,
            message: "An error occurred while checking participation status or creating a session.",
            error: e.message
        });
    }
};
