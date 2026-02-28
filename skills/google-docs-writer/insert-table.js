const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function createTableInDoc(docId, impersonateEmail) {
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
        // We'll insert a real table with the digital assets
        const requests = [
            {
                insertTable: {
                    rows: 8,
                    columns: 3,
                    location: { index: 305 } // Target the assets section
                }
            },
            // Row 1: Header
            { insertText: { location: { index: 307 }, text: "Resource" } },
            { insertText: { location: { index: 309 }, text: "Type" } },
            { insertText: { location: { index: 311 }, text: "Link" } },
            
            // Fill data (simplified row insertion indices)
            { insertText: { location: { index: 313 }, text: "Sketchfab" } },
            { insertText: { location: { index: 315 }, text: "3D Models" } },
            { insertText: { location: { index: 317 }, text: "sketchfab.com" } },
            
            { insertText: { location: { index: 319 }, text: "Meshy.ai" } },
            { insertText: { location: { index: 321 }, text: "AI 3D Gen" } },
            { insertText: { location: { index: 323 }, text: "meshy.ai" } }
        ];

        // Instead of complex index math for the whole table in one go, 
        // let's do a cleaner 'overwrite' approach for the assets section
        // to ensure it looks professional.
        
        console.log('Inserting real table...');
        // Note: For a true high-fidelity table, we usually use batchUpdate 
        // with specific cell locations.
    } catch (err) {
        console.error('Error inserting table:', err);
    }
}
