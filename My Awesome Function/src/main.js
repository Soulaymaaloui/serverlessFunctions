import { Client, Databases, ID } from 'node-appwrite';

const DATABASE_ID = process.env.DATABASE_ID;
const QUESTION_COLLECTION_ID = process.env.QUESTION_COLLECTION_ID;
const SESSION_COLLECTION_ID = process.env.SESSION_COLLECTION_ID; 
const RESPONSE_COLLECTION_ID = process.env.RESPONSE_COLLECTION_ID;


export default async ({ req, res, log, error }) => {
    try {
        const { questionId, response, sessionId } = JSON.parse(req.body);
        log(req.body);

        // Initialize Appwrite Client
        const client = new Client()
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(process.env.PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const database = new Databases(client);

        // Fetch the session document
        const session = await database.getDocument(
            DATABASE_ID,
            SESSION_COLLECTION_ID,
            sessionId
        );

        if (!session) {
            return res.json({ success: false, message: 'Session not found' });
        }

        // Fetch the question document
        const question = await database.getDocument(
            DATABASE_ID,
            QUESTION_COLLECTION_ID,
            questionId
        );

        // Calculate score if response is correct
        const correctOptions = Array.isArray(question.Correct_Options)
            ? question.Correct_Options
            : [question.Correct_Options];

        const userResponses = response.split(',').map(item => item.trim());
        const isCorrect = userResponses.length === correctOptions.length &&
            userResponses.every(answer => correctOptions.includes(answer));
            log(`Correct options: ${correctOptions}`);
        log(`Is the response correct? ${isCorrect}`);

        let pointsEarned = 0;

       if (isCorrect) {
    pointsEarned = question.Points;
} else {
    
    log('Incorrect response received');
    pointsEarned = 0;
}


        // Update session score
        const updatedScore = (session.Score || 0) + pointsEarned;
        const session1=[]
    for(session in session1) {
        session1=sessionId;
    }

        const responseData = {
            timeResponse: new Date().toISOString(),
            questions: questionId, 
            session: [sessionId],
            response: response,
            // Correct: isCorrect,
            }
        const responseDocument = await database.createDocument(
            DATABASE_ID,
            RESPONSE_COLLECTION_ID,
            ID.unique(),
            responseData
        );
        return responseDocument;
        log(responseDocument);
        // Update session document with new score
        const updatedSession = await database.updateDocument(
            DATABASE_ID,
            SESSION_COLLECTION_ID,
            sessionId,
            {
                Score: updatedScore,
            }
        );

        log(`Session score updated successfully. New score: ${updatedScore}`);

        return res.json({ success: true, updatedScore });

    } catch (e) {
        log(e);
        return res.json({
            success: false,
            message: "Failed to update session score and store response",
            error: e.message
        });
    }
};
