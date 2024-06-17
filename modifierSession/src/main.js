import { Client, Databases, ID } from 'node-appwrite';

  const DATABASE_ID = 'your-database-id';
    const QUIZZES_COLLECTION_ID = 'your-quizzes-collection-id';
    const SESSIONS_COLLECTION_ID = 'your-sessions-collection-id';

export default async (req, res) => {
   const client = new Client()
        .setEndpoint('https://cloud1.superverse.tech/v1')
        .setProject(process.env.PROJECT_ID) 
        .setKey(process.env.APPWRITE_API_KEY);
        const database = new Databases(client);

    const QUIZ_ID = req.body.quizId; 

    try {
        // Update quiz status to 'end'
        await database.updateDocument(
            DATABASE_ID,
            QUIZZES_COLLECTION_ID,
            QUIZ_ID,
            { status: 'end' }
        );

        // Get all sessions for the quiz
        const sessionResponse = await database.listDocuments(
            DATABASE_ID,
            SESSIONS_COLLECTION_ID,
            [Query.equal('quiz', QUIZ_ID)]
        );

        // Sort sessions by score in descending order
        const sortedSessions = sessionResponse.documents.sort((a, b) => b.Score - a.Score);

        // Define the number of winners (e.g., top 3)
        const winners = sortedSessions.slice(0, 3);

        // Create targets for winners
        const createTargetsPromises = winners.map(async (winner) => {
            try {
                await users.createTarget(
                    winner.userId,                             
                    winner.targetId,                          
                    sdk.MessagingProviderType.Email,          
                    winner.email,                              
                    winner.providerId,                         
                    winner.name                                
                );
                console.log(`Target created for ${winner.username}`);
            } catch (error) {
                console.error(`Failed to create target for ${winner.username}:`, error);
                throw error;
            }
        });


        // Send emails to winners
        const sendEmailPromises = winners.map(async (winner) => {
            try {
                const emailResponse = await messaging.createEmail(
                    EMAIL_TEMPLATE_ID,     // Email template ID or specific message ID
                    'Congratulations!',    // Subject
                    `Dear ${winner.username},\n\nYou are one of the top winners in our quiz!`, // Content
                    [],                   
                    [winner.userId],       
                    [],                    
                    [],                    
                    [],
                    false,                 
                    false                  
                );
                console.log(`Email sent to ${winner.username}:`, emailResponse);
            } catch (error) {
                console.error(`Failed to send email to ${winner.username}:`, error);
                throw error;
            }
        });

      

        res.status(200).json({ success: true, message: 'Quiz ended, winners notified.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
