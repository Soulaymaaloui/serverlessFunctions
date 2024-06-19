import { Client, Databases, ID } from 'node-appwrite';

const DATABASE_ID = process.env.DATABASE_ID; 
const QUESTION_COLLECTION_ID = process.env.QUESTION_COLLECTION_ID;
const RESPONSE_COLLECTION_ID = process.env.RESPONSE_COLLECTION_ID;

export default async ({ req, res, log, error }) => {
    // Initialize Appwrite Client
    const client = new Client()
        .setEndpoint('https://cloud1.superverse.tech/v1') // Adjust this if the endpoint changes
        .setProject(process.env.PROJECT_ID) 
        .setKey(process.env.APPWRITE_API_KEY);

    const database = new Databases(client);

    try {
        const { questionId, response, sessionId } = JSON.parse(req.body);
        log(req.body);

        const question = await database.getDocument(
            DATABASE_ID,
            QUESTION_COLLECTION_ID,
            questionId
        );
        log(question);

        const correctOptions = Array.isArray(question.Correct_Options)
            ? question.Correct_Options
            : [question.Correct_Options];
        
        const userResponses = response.split(',').map(item => item.trim());
        log(`User responses: ${userResponses}`);

        // Check if the response is correct
        const isCorrect = userResponses.length === correctOptions.length && 
            userResponses.every(answer => correctOptions.includes(answer));
        
        log(`Correct options: ${correctOptions}`);
        log(`Is the response correct? ${isCorrect}`);

        // Prepare the response data
        const responseData = {
            timeResponse: new Date().toISOString(),
            response: response,
            session: sessionId,
            question: questionId,
        };

        // Store the response in the response collection
        const responsePLayer = await database.createDocument(
            DATABASE_ID,
            RESPONSE_COLLECTION_ID,
            ID.unique(),
            responseData
        );
        log(`Response stored successfully: ${JSON.stringify(responsePLayer)}`);

        // // Return the result
        // return res.json({ success: true, isCorrect });

    } catch (e) {
        log(e)
        return res.json({
            success: false,
            message: "Failed to process response",
        });
    }
};

