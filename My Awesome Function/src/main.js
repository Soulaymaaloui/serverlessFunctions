import { Client, Databases, ID } from 'node-appwrite';

const DATABASE_ID = process.env.DATABASE_ID;
const QUESTION_COLLECTION_ID = process.env.QUESTION_COLLECTION_ID;
const SESSION_COLLECTION_ID = process.env.SESSION_COLLECTION_ID; 
const RESPONSE_COLLECTION_ID = process.env.RESPONSE_COLLECTION_ID;

export default async ({ req, res, log, error }) => {
    try {
        const { questionId, response, sessionId } = JSON.parse(req.body);
        log(req.body);

        const client = new Client()
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(process.env.PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const database = new Databases(client);

        const session = await database.getDocument(DATABASE_ID, SESSION_COLLECTION_ID, sessionId);
        log(`Fetched session: ${JSON.stringify(session)}`);

        if (!session) {
            return res.json({ success: false, message: 'Session not found' });
        }

        const question = await database.getDocument(DATABASE_ID, QUESTION_COLLECTION_ID, questionId);
        log(`Fetched question: ${JSON.stringify(question)}`);

        const correctOptions = Array.isArray(question.Correct_Options) ? question.Correct_Options : [question.Correct_Options];
        const userResponses = response.split(',').map(item => item.trim());
        const isCorrect = userResponses.length === correctOptions.length && userResponses.every(answer => correctOptions.includes(answer));
        
        log(`Correct options: ${correctOptions}`);
        log(`Is the response correct? ${isCorrect}`);

        let pointsEarned = 0;
        if (isCorrect) {
            pointsEarned = question.Points;
        } else {
            log('Incorrect response received');
        }

        const updatedScore = (session.Score || 0) + pointsEarned;
        const session1 = [];
      for(session in session1) {
    session1 = sessionId;
        }

        const responseData = {
            timeResponse: new Date().toISOString(),
            questions: questionId,
             session: [sessionId],
            response: response,
        };

        const responseDocument = await database.createDocument(DATABASE_ID, RESPONSE_COLLECTION_ID, ID.unique(), responseData);
        log(`Response created: ${JSON.stringify(responseDocument)}`);

         // Mettre à jour le document de session avec le nouveau score
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
        log(e);
        return res.json({
            success: false,
            message: "Failed to update session score and store response",
            error: e.message
        });
    }
};