const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function createAndWriteDoc(title, content, impersonateEmail) {
    const keyPath = path.join(process.env.HOME, '.config/gog/vulkn-service-account.json');
    const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    const auth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: [
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/drive'
        ]
        // Note: Not using subject/impersonation - doc will be owned by service account
    });

    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    try {
        // Create a new document
        console.log('Creating document:', title);
        const createRes = await docs.documents.create({
            requestBody: {
                title: title
            }
        });
        
        const docId = createRes.data.documentId;
        console.log('Created document ID:', docId);

        // Insert content
        console.log('Writing content...');
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            location: { index: 1 },
                            text: content
                        }
                    }
                ]
            }
        });

        // Share with the specified email
        if (impersonateEmail) {
            console.log('Sharing with:', impersonateEmail);
            await drive.permissions.create({
                fileId: docId,
                requestBody: {
                    type: 'user',
                    role: 'writer',
                    emailAddress: impersonateEmail
                },
                sendNotificationEmail: false
            });
        }

        const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
        console.log('Document URL:', docUrl);
        return { docId, url: docUrl };
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response:', err.response.data);
        }
        throw err;
    }
}

if (require.main === module) {
    const [,, title, contentFile, email] = process.argv;
    if (!title || !contentFile || !email) {
        console.log('Usage: node create-and-write.js "<title>" <contentFile.md> <email>');
        process.exit(1);
    }
    
    const content = fs.readFileSync(contentFile, 'utf8');
    createAndWriteDoc(title, content, email)
        .then(result => {
            console.log('\nSuccess!');
            console.log('Document ID:', result.docId);
            console.log('URL:', result.url);
        })
        .catch(err => {
            console.error('Failed:', err.message);
            process.exit(1);
        });
}

module.exports = { createAndWriteDoc };
