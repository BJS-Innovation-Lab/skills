const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function wipeAndFormatDoc(docId, impersonateEmail) {
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
        // 1. Get current length to wipe
        const doc = await docs.documents.get({ documentId: docId });
        const endOfDoc = doc.data.body.content[doc.data.body.content.length - 1].endIndex;

        let requests = [];
        if (endOfDoc > 2) {
            requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: endOfDoc - 1 } } });
        }

        // 2. Build the structured content
        requests.push(
            { insertText: { location: { index: 1 }, text: "Museum Study: Digital Exhibition Resources\n" } },
            { updateParagraphStyle: { range: { startIndex: 1, endIndex: 43 }, paragraphStyle: { namedStyleType: 'TITLE', alignment: 'CENTER' }, fields: 'namedStyleType,alignment' } },
            
            { insertText: { location: { index: 44 }, text: "\n🎨 Inspiration\n" } },
            { updateParagraphStyle: { range: { startIndex: 45, endIndex: 60 }, paragraphStyle: { namedStyleType: 'HEADING_1' }, fields: 'namedStyleType' } },
            
            { insertText: { location: { index: 61 }, text: "The Met: Dendur Decoded\nHigh-fidelity digital preservation of the Temple of Dendur.\nLink: https://metmuseum.org/perspectives/articles/2025/dendur-decoded\n\n" } },
            { updateTextStyle: { range: { startIndex: 61, endIndex: 84 }, textStyle: { bold: true }, fields: 'bold' } },
            
            { insertText: { location: { index: 210 }, text: "V21 Artspace\nPioneering virtual exhibition spaces.\nLink: https://v21artspace.com/exhibitions\n\n" } },
            { updateTextStyle: { range: { startIndex: 210, endIndex: 222 }, textStyle: { bold: true }, fields: 'bold' } },

            { insertText: { location: { index: 320 }, text: "🗂️ Digital Assets\n" } },
            { updateParagraphStyle: { range: { startIndex: 320, endIndex: 338 }, paragraphStyle: { namedStyleType: 'HEADING_1' }, fields: 'namedStyleType' } },
            
            // Create Table
            { insertTable: { rows: 4, columns: 3, location: { index: 339 } } }
        );

        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests: requests }
        });

        // 3. Fill Table Cells (requires separate update to ensure table exists)
        const tableRequests = [
            { insertText: { location: { index: 341 }, text: "Resource" } },
            { insertText: { location: { index: 343 }, text: "Type" } },
            { insertText: { location: { index: 345 }, text: "Link" } },
            { insertText: { location: { index: 348 }, text: "Sketchfab" } },
            { insertText: { location: { index: 350 }, text: "3D Models" } },
            { insertText: { location: { index: 352 }, text: "sketchfab.com" } }
        ];

        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests: tableRequests }
        });

        console.log('Final Pro Formatting Complete');
    } catch (err) {
        console.error('Formatting error:', err);
    }
}

wipeAndFormatDoc('1QS6DoMW2NgNkdrBTutDVf_QHs4KexvRYtlqXW5C_j2s', 'scarlett@vulkn-ai.com');
