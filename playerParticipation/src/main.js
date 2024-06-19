import { Client, Databases, Query } from 'node-appwrite';

const DATABASE_ID = process.env.DATABASE_ID; 
const QUIZ_COLLECTION_ID = process.env.QUIZ_COLLECTION_ID ;
const SESSION_COLLECTION_ID = process.env.SESSION_COLLECTION_ID 


export default async ({ req, res, log, error }) => {
  const client = new Client()
        .setEndpoint('https://cloud1.superverse.tech/v1')
        .setProject(process.env.PROJECT_ID) 
        .setKey(process.env.APPWRITE_API_KEY);

      const database = new Databases(client);


  try {
      const { quizId, playerId }  = JSON.parse(req.body);

    // Retrieve the quiz document
    const quizDocument = await database.getDocument(
      DATABASE_ID , // Database ID
      QUIZ_COLLECTION_ID , // Collection ID for quizzes
      quizId
    );

    if (!quizDocument) {
      return res.json({
        success: false,
        message: "Quiz not found.",
      });
    }
    // Build query to check if the player has already participated
    const query = [
      Query.equal("userId", [playerId]),
      Query.equal("quiz", [quizId])
    ];

    // Check for existing participation
    const existingSession = await database.listDocuments(
       DATABASE_ID,
      SESSION_COLLECTION_ID, 
      query,
      1 
    );

    if (existingSession.documents && existingSession.documents.length > 0) {
      return res.json({
        success: false,
        message: "Player has already participated in this quiz.",
      });
    }
    return res.json({
      success: true,
      message: "Player is allowed to participate in the quiz.",
    });
  } catch (e) {
      log(`Error checking participation status:" ${e.message}`);
    return res.json({
      success: false,
      message: "An error occurred while checking participation status.",
    });
  }
};
