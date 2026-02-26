const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function createWordDoc(markdownPath, impersonateEmail) {
    const keyPath = path.join(process.env.HOME, '.config/gog/vulkn-service-account.json');
    const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    const auth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive'],
        subject: impersonateEmail
    });

    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    try {
        const content = fs.readFileSync(markdownPath, 'utf8');
        
        // Create new doc
        const res = await docs.documents.create({
            requestBody: { title: "VULKN Business Plan - Full Draft" }
        });
        const docId = res.data.documentId;
        console.log('Created Doc ID:', docId);

        // Break content into chunks to avoid request size limits
        const chunks = content.match(/[\s\S]{1,7000}/g);
        let currentIndex = 1;

        for (const chunk of chunks) {
            await docs.documents.batchUpdate({
                documentId: docId,
                requestBody: {
                    requests: [{
                        insertText: {
                            location: { index: currentIndex },
                            text: chunk
                        }
                    }]
                }
            });
            currentIndex += chunk.length;
        }

        console.log('Full content pushed to Google Doc.');
        console.log('Doc URL: https://docs.google.com/document/d/' + docId + '/edit');
        
        // Give Bridget permission if needed (Service Account owns it)
        await drive.permissions.create({
            fileId: docId,
            requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: 'bridget4g@gmail.com'
            }
        });
        console.log('Permission granted to Bridget.');

    } catch (err) {
        console.error('Error:', err);
    }
}

createWordDoc('projects/vulkn-business-plan/VULKN_Business_Plan_Full.md', 'scarlett@vulkn-ai.com');
