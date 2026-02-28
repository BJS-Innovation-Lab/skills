const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function pushNoTableHarvardDoc(docId, impersonateEmail) {
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

        const content = `Museum Study: Digital Exhibition Resources
A curated guide for creating immersive digital museum experiences.
__________________________________________________________________________

🎨 Inspiration
Examples of innovative digital preservation and exhibition design.

The Met: Dendur Decoded
High-fidelity digital preservation of the Temple of Dendur.
Link: https://metmuseum.org/perspectives/articles/2025/dendur-decoded

V21 Artspace
Pioneering virtual exhibition spaces and digital conservation.
Link: https://v21artspace.com/exhibitions

Google Arts & Culture: 3D Pocket Gallery
Immersive 3D gallery experiences and spatial storytelling.
Link: https://artsandculture.google.com/project/3d

__________________________________________________________________________

🗂️ Digital Assets
Resources for finding and creating 2D and 3D content.

• Sketchfab Cultural Heritage: sketchfab.com/cultural-heritage (Museum Quality 3D Models)
• Meshy.ai: meshy.ai (AI 3D Generation)
• Poly Pizza: poly.pizza (Free 3D Models)
• Poligon: poligon.com (3D Assets)
• Mr Cutout: mrcutout.com (2D Cutouts & People)
• Vecteezy: vecteezy.com (Vectors & Graphics)
• World Labs Marble: marble.worldlabs.ai (AI 3D Environments)

__________________________________________________________________________

🌐 Spatial Platform
Tools for building and hosting your virtual exhibition.

Artsteps
Accessible creation for virtual exhibitions—no coding required.
Link: https://artsteps.com

Spatial.io
Primary platform for immersive, interactive exhibition spaces.
Link: https://spatial.io

Quick Tips for Spatial:
• Start with a template gallery, then customize.
• Use the "Frame" tool for 2D artwork placement.
• Import 3D models as .glb or .fbx files.
• Test on both desktop and mobile before sharing.
• Add ambient audio to enhance the atmosphere.

__________________________________________________________________________
Compiled for Harvard Museum Study — Spring 2025`;

        requests.push({ insertText: { location: { index: 1 }, text: content } });

        await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests } });
        console.log('Document updated: No table version.');
    } catch (err) {
        console.error('Update error:', err);
    }
}

pushNoTableHarvardDoc('1QS6DoMW2NgNkdrBTutDVf_QHs4KexvRYtlqXW5C_j2s', 'scarlett@vulkn-ai.com');