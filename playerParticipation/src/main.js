import { Client, Databases, Query ,ID} from 'node-appwrite';

const DATABASE_ID = process.env.DATABASE_ID;
const QUIZ_COLLECTION_ID = process.env.QUIZ_COLLECTION_ID;
const SESSION_COLLECTION_ID = process.env.SESSION_COLLECTION_ID;

export default async ({ req, res, log, error }) => {
    try {
        const { quizId, playerId } = JSON.parse(req.body);

        // Initialize Appwrite Client
        const client = new Client()
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(process.env.PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const database = new Databases(client);

        // Check if the player has already participated in this quiz
        const query = [
            Query.equal("playerId", playerId),
            Query.equal("quiz", quizId)
        ];

        const existingSessions = await database.listDocuments(
            DATABASE_ID,
            SESSION_COLLECTION_ID,
            query,
            1 // Limit to 1 result
        );

        if (existingSessions.documents.length > 0) {
            // Player has already participated in this quiz
            return res.json({
                success: false,
                message: "Player has already participated in the quiz.",
            });
        } else {
            // Retrieve the quiz document
            const quizDocument = await database.getDocument(
                DATABASE_ID,
                QUIZ_COLLECTION_ID,
                quizId
            );

            // Create a new session for the player with initial attributes
            const sessionData = {
                quiz: quizId,
                playerId: playerId,
                Score: 0, // Initial score
                isWinner: false, // Initial winner status
                playTime: null, // Initial play time (can be updated later)
                completionStatus: "Incomplete", // Initial completion status
                status: "Active", // Initial session status
                createdAt: new Date().toISOString(),
            };

            const sessionDocument = await database.createDocument(
                DATABASE_ID,
                SESSION_COLLECTION_ID,
                ID.unique(),
                sessionData
            );

            log(`Session created: ${sessionDocument}`);

            // Player is allowed to participate
            return res.json({
                success: true,
                message: "Player is allowed to participate in the quiz.",
            });
        }
    } catch (e) {
        log(e);
        return res.json({
            success: false,
            message: "An error occurred while checking participation status or creating session.",
            error: e.message // Optionally include the error message for debugging
        });
    }
};
