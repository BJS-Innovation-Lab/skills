const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function pushFormattedBusinessPlan(docId, markdownPath, impersonateEmail) {
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
        const markdown = fs.readFileSync(markdownPath, 'utf8');
        const lines = markdown.split('\n');
        
        // 1. Wipe the doc first
        const doc = await docs.documents.get({ documentId: docId });
        const endOfDoc = doc.data.body.content[doc.data.body.content.length - 1].endIndex;
        if (endOfDoc > 2) {
            await docs.documents.batchUpdate({
                documentId: docId,
                requestBody: {
                    requests: [{ deleteContentRange: { range: { startIndex: 1, endIndex: endOfDoc - 1 } } }]
                }
            });
        }

        let requests = [];
        let currentIndex = 1;

        for (let line of lines) {
            let text = line + '\n';
            let style = 'NORMAL_TEXT';
            let cleanText = text;

            if (line.startsWith('# ')) {
                style = 'TITLE';
                cleanText = line.substring(2) + '\n';
            } else if (line.startsWith('## ')) {
                style = 'HEADING_1';
                cleanText = line.substring(3) + '\n';
            } else if (line.startsWith('### ')) {
                style = 'HEADING_2';
                cleanText = line.substring(4) + '\n';
            } else if (line.startsWith('**') && line.endsWith('**')) {
                // Bold paragraph
                cleanText = line.replace(/\*\*/g, '') + '\n';
            }

            requests.push({ insertText: { location: { index: currentIndex }, text: cleanText } });
            requests.push({
                updateParagraphStyle: {
                    range: { startIndex: currentIndex, endIndex: currentIndex + cleanText.length },
                    paragraphStyle: { namedStyleType: style },
                    fields: 'namedStyleType'
                }
            });

            currentIndex += cleanText.length;
        }

        // Apply formatting in batches of 50 to avoid API limits
        for (let i = 0; i < requests.length; i += 100) {
            await docs.documents.batchUpdate({
                documentId: docId,
                requestBody: { requests: requests.slice(i, i + 100) }
            });
        }

        console.log('✅ Formatted Business Plan pushed successfully.');
    } catch (err) {
        console.error('Formatting Error:', err);
    }
}

pushFormattedBusinessPlan('1g3zo8piXWHaJNmtY_yYcVIMVltBeSFSCbZrIVnN5FUo', 'projects/vulkn-business-plan/VULKN_Business_Plan_Full.md', 'scarlett@vulkn-ai.com');