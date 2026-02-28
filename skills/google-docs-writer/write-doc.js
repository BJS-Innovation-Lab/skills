const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function writeToDoc(docId, text, impersonateEmail) {
    const keyPath = path.join(process.env.HOME, '.config/gog/vulkn-service-account.json');
    const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    const auth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive'],
        subject: impersonateEmail
    });

    const docs = google.docs({ version: 'v1', auth });

    try {
        const res = await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            location: { index: 1 },
                            text: text
                        }
                    }
                ]
            }
        });
        console.log('Successfully wrote to doc:', res.data.documentId);
        return res.data;
    } catch (err) {
        console.error('Error writing to doc:', err);
        throw err;
    }
}

if (require.main === module) {
    const [,, docId, text, email] = process.argv;
    if (!docId || !text || !email) {
        console.log('Usage: node write-doc.js <docId> <text> <email>');
        process.exit(1);
    }
    writeToDoc(docId, text, email);
}
