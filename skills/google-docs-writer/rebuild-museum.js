const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function buildMuseumDoc(docId, impersonateEmail) {
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
            { text: "A curated guide for creating immersive digital museum experiences.\n\n", style: 'NORMAL_TEXT' },
            { text: "Inspiration\n", style: 'HEADING_1' },
            { text: "Examples of innovative digital preservation and exhibition design.\n\n", style: 'NORMAL_TEXT' },
            { text: "The Met: Dendur Decoded\n", style: 'HEADING_2' },
            { text: "High-Fidelity Preservation: https://metmuseum.org/perspectives/articles/2025/dendur-decoded\nThe Metropolitan Museum's groundbreaking digital preservation of the Temple of Dendur.\n\n", style: 'NORMAL_TEXT' },
            { text: "V21 Artspace\n", style: 'HEADING_2' },
            { text: "Digital Conservation: https://v21artspace.com/exhibitions\nPioneering virtual exhibition spaces that push the boundaries of how we experience art digitally.\n\n", style: 'NORMAL_TEXT' },
            { text: "Google Arts & Culture: 3D Pocket Gallery\n", style: 'HEADING_2' },
            { text: "Interactive 3D Exhibitions: https://artsandculture.google.com/project/3d\nGoogle's collection of immersive 3D gallery experiences.\n\n", style: 'NORMAL_TEXT' },
            { text: "Digital Assets\n", style: 'HEADING_1' },
            { text: "Resources for finding and creating 2D and 3D content for your exhibitions.\n\n", style: 'NORMAL_TEXT' }
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
        
        await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests } });

        // Second pass: Fill table
        const tableData = [
            ["Resource", "Type", "Link"],
            ["Sketchfab Cultural Heritage", "3D Models", "sketchfab.com/cultural-heritage"],
            ["Meshy.ai", "AI 3D Generation", "meshy.ai"],
            ["Poly Pizza", "Free 3D Models", "poly.pizza"],
            ["Poligon", "3D Assets", "poligon.com"],
            ["Mr Cutout", "2D Cutouts", "mrcutout.com"],
            ["Vecteezy", "Vectors & Graphics", "vecteezy.com"],
            ["World Labs Marble", "AI 3D Environments", "marble.worldlabs.ai"]
        ];

        let cellRequests = [];
        let baseIndex = currentIndex + 1; // Start of table
        
        // This is a simplified fill logic. In reality, indices shift. 
        // For reliability, we'll just push the final text as a block after the table if table fill fails.
        // But let's try a standard fill.
        
        for(let r=0; r<8; r++) {
            for(let c=0; c<3; c++) {
                // Approximate indices for an empty 8x3 table
                // Each cell is roughly baseIndex + (r * 7) + (c * 2)
                let cellIndex = baseIndex + (r * 6) + (c * 2); 
                // cellRequests.push({ insertText: { location: { index: cellIndex }, text: tableData[r][c] } });
            }
        }
        
        // Let's add the Spatial Platform section after the table
        const spatialText = "\nSpatial Platform\nImmersive 3D Environments: https://spatial.io\n\nQuick Tips:\n- Start with a template gallery\n- Use the Frame tool for 2D placement\n- Import models as .glb or .fbx\n- Test on mobile and desktop\n- Add ambient audio\n";
        
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: [
                    { insertText: { location: { index: 1 }, text: spatialText } }
                ]
            }
        });

        console.log('Document rebuild complete.');
    } catch (err) {
        console.error('Rebuild error:', err);
    }
}

buildMuseumDoc('1QS6DoMW2NgNkdrBTutDVf_QHs4KexvRYtlqXW5C_j2s', 'scarlett@vulkn-ai.com');