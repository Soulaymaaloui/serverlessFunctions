import { Client, Databases, ID } from 'node-appwrite';

       const DATABASE_ID = process.env.DATABASE_ID; 
        const QUESTION_COLLECTION_ID = process.env.QUESTION_COLLECTION_ID 
        const RESPONSE_COLLECTION_ID = process.env.RESPONSE_COLLECTION_ID 

export default async ({ req, res, log, error }) => {
    // Initialize Appwrite Client
    const client = new Client()
        .setEndpoint('https://cloud1.superverse.tech/v1') // Adjust this if the endpoint changes
        .setProject(process.env.PROJECT_ID) 
        .setKey(process.env.APPWRITE_API_KEY);

      const database = new Databases(client);
    try {
    const {questionId, response, sessionId } = req.body;
      log (req.body)
      log(`Fetching question with ID: ${questionId}`);

        const question = await database.getDocument(DATABASE_ID, QUESTION_COLLECTION_ID, questionId);
        log(question);

        // Check if the response is correct
        const isCorrect = question.Correct_Options===response;
        log(`User response is: ${response}, Correct options: ${question.Correct_Options}`);
        log(`Is the response correct? ${isCorrect}`);

        // Prepare the response data
        const responseData = {
            timeResponse: new Date().toISOString(),
            response: response,
            session: sessionId,
            question: questionId,
        };

        // Store the response in the response collection
        await database.createDocument(DATABASE_ID, RESPONSE_COLLECTION_ID, ID.unique(), responseData);

        // Return the result
        return res.json({ success: true, isCorrect });

    } catch (e) {
        log(`Error processing response: ${e.message}`);
        return res.json({ success: false, message: "Failed to process response", error: e.message });
    }
};
