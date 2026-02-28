const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function cleanPour(docId, impersonateEmail) {
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
        const doc = await docs.documents.get({ documentId: docId });
        const endOfDoc = doc.data.body.content[doc.data.body.content.length - 1].endIndex;

        // 1. Wipe it clean
        if (endOfDoc > 2) {
            await docs.documents.batchUpdate({
                documentId: docId,
                requestBody: { requests: [{ deleteContentRange: { range: { startIndex: 1, endIndex: endOfDoc - 1 } } }] }
            });
        }

        // 2. Pour simple text first to avoid index math errors
        const fullBodyText = `Museum Study: Digital Exhibition Resources\n\n🎨 Inspiration\n\nThe Met: Dendur Decoded\nHigh-fidelity digital preservation.\nLink: https://metmuseum.org/perspectives/articles/2025/dendur-decoded\n\nV21 Artspace\nPioneering virtual exhibition spaces.\nLink: https://v21artspace.com/exhibitions\n\n🗂️ Digital Assets\n\n`;
        
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests: [{ insertText: { location: { index: 1 }, text: fullBodyText } }] }
        });

        // 3. Add Table at the end
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests: [{ insertTable: { rows: 4, columns: 3, location: { index: fullBodyText.length } } }] }
        });

        // 4. Fill Table
        const tableRequests = [
            { insertText: { location: { index: fullBodyText.length + 2 }, text: "Resource" } },
            { insertText: { location: { index: fullBodyText.length + 4 }, text: "Type" } },
            { insertText: { location: { index: fullBodyText.length + 6 }, text: "Link" } },
            { insertText: { location: { index: fullBodyText.length + 9 }, text: "Sketchfab" } },
            { insertText: { location: { index: fullBodyText.length + 11 }, text: "3D" } },
            { insertText: { location: { index: fullBodyText.length + 13 }, text: "sketchfab.com" } }
        ];

        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests: tableRequests }
        });

        console.log('Document cleaned and native table inserted.');
    } catch (err) {
        console.error('Final attempt error:', err);
    }
}

cleanPour('1QS6DoMW2NgNkdrBTutDVf_QHs4KexvRYtlqXW5C_j2s', 'scarlett@vulkn-ai.com');
