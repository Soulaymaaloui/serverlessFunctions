import { Client, Databases, ID } from 'node-appwrite';

const DATABASE_ID = process.env.DATABASE_ID;
const QUESTION_COLLECTION_ID = process.env.QUESTION_COLLECTION_ID;
const SESSION_COLLECTION_ID = process.env.SESSION_COLLECTION_ID; 
const RESPONSE_COLLECTION_ID = process.env.RESPONSE_COLLECTION_ID;

export default async ({ req, res, log, error }) => {
    try {
        const { questionsResponses, sessionId } = JSON.parse(req.body);
        log(`Received data: ${JSON.stringify(questionsResponses)}`);

        const client = new Client()
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(process.env.PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const database = new Databases(client);

        // Fetch session
        const session = await database.getDocument(DATABASE_ID, SESSION_COLLECTION_ID, sessionId);
        log(`Fetched session: ${JSON.stringify(session)}`);

        if (!session) {
            return res.json({ success: false, message: 'Session not found' });
        }

        let totalPointsEarned = 0;

        for (const { questionId, response } of questionsResponses) {
            // Fetch question
            const question = await database.getDocument(DATABASE_ID, QUESTION_COLLECTION_ID, questionId);
            log(`Fetched question: ${JSON.stringify(question)}`);

            const correctOptions = Array.isArray(question.Correct_Options) ? question.Correct_Options : [question.Correct_Options];
            const userResponses = response.split(',').map(item => item.trim());
            const isCorrect = userResponses.length === correctOptions.length && userResponses.every(answer => correctOptions.includes(answer));
            
            log(`Correct options for question ${questionId}: ${correctOptions}`);
            log(`Is the response for question ${questionId} correct? ${isCorrect}`);

            if (isCorrect) {
                totalPointsEarned += question.Points;
            } else {
                log(`Incorrect response for question ${questionId}`);
            }

            const responseData = {
                timeResponse: new Date().toISOString(),
                questions: questionId,
                session: [sessionId], 
                response: response,
            };

            const responseDocument = await database.createDocument(DATABASE_ID, RESPONSE_COLLECTION_ID, ID.unique(), responseData);
            log(`Response created for question ${questionId}: ${JSON.stringify(responseDocument)}`);
        }

        const updatedScore = (session.Score || 0) + totalPointsEarned;

        // Update session with new score
        try {
            const updatedSession = await database.updateDocument(DATABASE_ID, SESSION_COLLECTION_ID, sessionId, { Score: updatedScore });
            log(`Session score updated successfully. New score: ${updatedScore}`);
            return res.json({ success: true, updatedScore });
        } catch (err) {
            log(`Error updating session: ${err.message}`);
            return res.json({
                success: false,
                message: 'Failed to update session score',
                error: err.message
            });
        }
    } catch (e) {
        log(`Error: ${e.message}`);
        return res.json({
            success: false,
            message: "Failed to update session score and store responses",
            error: e.message
        });
    }
};
