const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function pourToDoc(docId, markdownText, impersonateEmail) {
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
        // First, clear the doc if it's not empty (optional, but good for "pouring")
        // For now, let's just append everything.
        
        const requests = [
            {
                insertText: {
                    location: { index: 1 },
                    text: markdownText
                }
            }
        ];

        const res = await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: requests
            }
        });
        console.log('Successfully poured content to doc:', res.data.documentId);
        return res.data;
    } catch (err) {
        console.error('Error pouring to doc:', err);
        throw err;
    }
}

if (require.main === module) {
    const [,, docId, filePath, email] = process.argv;
    if (!docId || !filePath || !email) {
        console.log('Usage: node pour-doc.js <docId> <markdownFilePath> <email>');
        process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    pourToDoc(docId, content, email);
}
