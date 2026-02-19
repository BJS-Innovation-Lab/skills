from fpdf import FPDF
import os

class SpatialGuide(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 20)
        self.cell(0, 10, 'Spatial Survival Guide', align='C', new_x='LMARGIN', new_y='NEXT')
        self.set_font('Helvetica', 'I', 10)
        self.cell(0, 10, 'Harvard Museum Studies x Learning Design', align='C', new_x='LMARGIN', new_y='NEXT')
        self.ln(5)

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 14)
        self.set_fill_color(240, 240, 240)
        self.cell(0, 10, title, align='L', fill=True, new_x='LMARGIN', new_y='NEXT')
        self.ln(2)

    def body_text(self, text):
        self.set_font('Helvetica', '', 11)
        self.multi_cell(0, 6, text)
        self.ln(2)

pdf = SpatialGuide()
pdf.add_page()

# Movement Section
pdf.section_title('1. The Basics: Movement & Camera')
pdf.body_text('- Move: Use WASD keys.\n- Run: Hold Shift while moving.\n- Jump: Spacebar.\n- Zoom: Use trackpad or Up/Down arrows.\n- Camera Options: Look for Auto Rotate, Drag to Rotate, and Pointer Lock in settings.')
# Placeholder for movement screenshot (file_2)
if os.path.exists('/Users/sybil/.openclaw/media/inbound/file_2---8333a2e2-5881-4d4d-97b7-db1288a0c9c8.jpg'):
    pdf.image('/Users/sybil/.openclaw/media/inbound/file_2---8333a2e2-5881-4d4d-97b7-db1288a0c9c8.jpg', x=15, w=180)
pdf.ln(5)

# Imports Section
pdf.section_title('2. Expanding Your World: Importing Assets')
pdf.body_text('You can bring in your own content or use external libraries:\n- Google Drive: Import your personal images, videos, and documents.\n- Sketchfab: Browse and insert millions of 3D models directly.')
# Placeholder for content screenshot (file_1)
if os.path.exists('/Users/sybil/.openclaw/media/inbound/file_1---b555c554-0156-42a8-9035-a6683ccf36cd.jpg'):
    pdf.image('/Users/sybil/.openclaw/media/inbound/file_1---b555c554-0156-42a8-9035-a6683ccf36cd.jpg', x=40, w=130)
pdf.ln(5)

# Building Section
pdf.section_title('3. Placing & Editing Objects')
pdf.body_text('- Inserting: Items (like Empty Frames) move relative to your camera angle.\n- Options: Click an object to Lock, Duplicate, or Delete.\n- Orientation: Use the gizmos to rotate and scale your items.')
pdf.ln(5)

# Pro Tips Section
pdf.section_title('4. Pro Tips for Efficiency')
pdf.body_text('- Layers Panel: Use this to find and select objects that are hidden or far away.\n- Emotes: Press "T" for the emote menu or use number keys (1-9) for quick shortcuts.\n- Avatar: Click your profile to customize your look anytime!')
# Placeholder for emote screenshot (file_0)
if os.path.exists('/Users/sybil/.openclaw/media/inbound/file_0---4fd8e209-75f5-44a7-b937-367ffe5a3f0b.jpg'):
    pdf.image('/Users/sybil/.openclaw/media/inbound/file_0---4fd8e209-75f5-44a7-b937-367ffe5a3f0b.jpg', x=50, w=110)

pdf.output('harvard-museum-class/Spatial_Survival_Guide.pdf')