const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function pushFinalHarvardDoc(docId, impersonateEmail) {
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

        let requests = [];
        if (endOfDoc > 2) {
            requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: endOfDoc - 1 } } });
        }

        const sections = [
            { text: "Museum Study: Digital Exhibition Resources\n", style: 'TITLE' },
            { text: "A curated guide for creating immersive digital museum experiences.\n", style: 'NORMAL_TEXT' },
            { text: "__________________________________________________________________________\n\n", style: 'NORMAL_TEXT' },
            
            { text: "🎨 Inspiration\n", style: 'HEADING_1' },
            { text: "Examples of innovative digital preservation and exhibition design.\n\n", style: 'NORMAL_TEXT' },
            
            { text: "The Met: Dendur Decoded\n", style: 'HEADING_2' },
            { text: "High-fidelity digital preservation of the Temple of Dendur.\nLink: https://metmuseum.org/perspectives/articles/2025/dendur-decoded\n\n", style: 'NORMAL_TEXT' },
            
            { text: "V21 Artspace\n", style: 'HEADING_2' },
            { text: "Pioneering virtual exhibition spaces and digital conservation.\nLink: https://v21artspace.com/exhibitions\n\n", style: 'NORMAL_TEXT' },
            
            { text: "Google Arts & Culture: 3D Pocket Gallery\n", style: 'HEADING_2' },
            { text: "Immersive 3D gallery experiences and spatial storytelling.\nLink: https://artsandculture.google.com/project/3d\n\n", style: 'NORMAL_TEXT' },

            { text: "🗂️ Digital Assets\n", style: 'HEADING_1' },
            { text: "Resources for finding and creating 2D and 3D content.\n\n", style: 'NORMAL_TEXT' }
        ];

        let currentIndex = 1;
        for (const section of sections) {
            requests.push({ insertText: { location: { index: currentIndex }, text: section.text } });
            requests.push({
                updateParagraphStyle: {
                    range: { startIndex: currentIndex, endIndex: currentIndex + section.text.length },
                    paragraphStyle: { namedStyleType: section.style },
                    fields: 'namedStyleType'
                }
            });
            currentIndex += section.text.length;
        }

        // Table insertion
        requests.push({ insertTable: { rows: 8, columns: 3, location: { index: currentIndex } } });
        
        // Post-table content
        const postTableText = "\n\n🌐 Spatial Platform\nTools for building and hosting your virtual exhibition.\n\nArtsteps\nAccessible creation for virtual exhibitions—no coding required.\nLink: https://artsteps.com\n\nSpatial.io\nPrimary platform for immersive, interactive exhibition spaces.\nLink: https://spatial.io\n\nQuick Tips for Spatial:\n• Start with a template gallery, then customize.\n• Use the \"Frame\" tool for 2D artwork placement.\n• Import 3D models as .glb or .fbx files.\n• Test on both desktop and mobile before sharing.\n• Add ambient audio to enhance the atmosphere.\n\n__________________________________________________________________________\nCompiled for Harvard Museum Study — Spring 2025";
        
        // Push first batch
        await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests } });

        // Table and Footer
        const tableData = [
            ["Resource", "Type", "Link"],
            ["Sketchfab Cultural Heritage", "Museum Quality 3D", "sketchfab.com/cultural-heritage"],
            ["Meshy.ai", "AI 3D Generation", "meshy.ai"],
            ["Poly Pizza", "Free 3D Models", "poly.pizza"],
            ["Poligon", "3D Assets", "poligon.com"],
            ["Mr Cutout", "2D Cutouts & People", "mrcutout.com"],
            ["Vecteezy", "Vectors & Graphics", "vecteezy.com"],
            ["World Labs Marble", "AI 3D Environments", "marble.worldlabs.ai"]
        ];

        let cellRequests = [];
        // Each cell in an empty 8x3 table starts at index currentIndex + 2, + 4, etc.
        // It's safer to just push the footer and then fill the table.
        cellRequests.push({ insertText: { location: { index: currentIndex + 50 }, text: postTableText } });

        await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests: cellRequests } });

        console.log('Document finalized with native table.');
    } catch (err) {
        console.error('Finalize error:', err);
    }
}

pushFinalHarvardDoc('1QS6DoMW2NgNkdrBTutDVf_QHs4KexvRYtlqXW5C_j2s', 'scarlett@vulkn-ai.com');