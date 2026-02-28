const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function formatDoc(docId, impersonateEmail) {
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
        const requests = [
            // Title
            { insertText: { location: { index: 1 }, text: "Museum Study: Digital Exhibition Resources\n\n" } },
            { updateParagraphStyle: { range: { startIndex: 1, endIndex: 43 }, paragraphStyle: { namedStyleType: 'TITLE' }, fields: 'namedStyleType' } },
            
            // Inspiration Header
            { insertText: { location: { index: 44 }, text: "🎨 Inspiration\n" } },
            { updateParagraphStyle: { range: { startIndex: 44, endIndex: 59 }, paragraphStyle: { namedStyleType: 'HEADING_1' }, fields: 'namedStyleType' } },
            
            // Dendur Link
            { insertText: { location: { index: 60 }, text: "The Met: Dendur Decoded\nhttps://metmuseum.org/perspectives/articles/2025/dendur-decoded\n\n" } },
            { updateTextStyle: { range: { startIndex: 60, endIndex: 83 }, textStyle: { bold: true }, fields: 'bold' } },
            { updateTextStyle: { range: { startIndex: 84, endIndex: 147 }, textStyle: { link: { url: 'https://metmuseum.org/perspectives/articles/2025/dendur-decoded' } }, fields: 'link' } },

            // V21 Link
            { insertText: { location: { index: 149 }, text: "V21 Artspace\nhttps://v21artspace.com/exhibitions\n\n" } },
            { updateTextStyle: { range: { startIndex: 149, endIndex: 161 }, textStyle: { bold: true }, fields: 'bold' } },
            { updateTextStyle: { range: { startIndex: 162, endIndex: 197 }, textStyle: { link: { url: 'https://v21artspace.com/exhibitions' } }, fields: 'link' } },

            // Google Arts Link
            { insertText: { location: { index: 199 }, text: "Google Arts & Culture: 3D Pocket Gallery\nhttps://artsandculture.google.com/project/3d\n\n" } },
            { updateTextStyle: { range: { startIndex: 199, endIndex: 239 }, textStyle: { bold: true }, fields: 'bold' } },
            { updateTextStyle: { range: { startIndex: 240, endIndex: 284 }, textStyle: { link: { url: 'https://artsandculture.google.com/project/3d' } }, fields: 'link' } },

            // Assets Header
            { insertText: { location: { index: 286 }, text: "🗂️ Digital Assets\n" } },
            { updateParagraphStyle: { range: { startIndex: 286, endIndex: 304 }, paragraphStyle: { namedStyleType: 'HEADING_1' }, fields: 'namedStyleType' } },
            
            // Asset Links (Simplified for brevity in the first batch)
            { insertText: { location: { index: 305 }, text: "• Sketchfab: https://sketchfab.com/cultural-heritage\n• Meshy.ai: https://meshy.ai\n• World Labs: https://marble.worldlabs.ai\n\n" } },

            // Spatial Header
            { insertText: { location: { index: 400 }, text: "🌐 Spatial Platform\n" } },
            { updateParagraphStyle: { range: { startIndex: 400, endIndex: 419 }, paragraphStyle: { namedStyleType: 'HEADING_1' }, fields: 'namedStyleType' } },
            { insertText: { location: { index: 420 }, text: "Spatial.io: https://spatial.io\nArtsteps: https://artsteps.com\n" } }
        ];

        // Clear existing content first by making a new doc or clearing it
        // For speed, let's assume we want to write this to a clean start
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests: requests }
        });
        console.log('Formatted doc updated successfully');
    } catch (err) {
        console.error('Error formatting doc:', err);
    }
}

formatDoc('1QS6DoMW2NgNkdrBTutDVf_QHs4KexvRYtlqXW5C_j2s', 'scarlett@vulkn-ai.com');
