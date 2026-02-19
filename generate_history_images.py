from PIL import Image, ImageDraw, ImageFont
import os
import random

BASE_DIR = "/Users/sybil/.openclaw/workspace/graphics/history/"
os.makedirs(BASE_DIR, exist_ok=True)

def create_image(name, draw_fn):
    img = Image.new('RGB', (1024, 1024), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw_fn(img, draw)
    path = os.path.join(BASE_DIR, name)
    img.save(path)
    print(f"Saved {path}")

# ERA 1: Vintage Newspaper
def era1_reading(img, draw):
    # Background: Aged paper
    draw.rectangle([0, 0, 1024, 1024], fill=(244, 241, 234))
    # Texture
    for _ in range(10000):
        x, y = random.randint(0, 1023), random.randint(0, 1023)
        draw.point((x, y), fill=(0, 0, 0, random.randint(0, 10)))
    
    # Text
    draw.text((512, 100), "THE DAILY GAZETTE", fill=(26, 26, 26), anchor="mt", font=None) # Would need a font file for better look
    draw.line([100, 150, 924, 150], fill=(26, 26, 26), width=3)
    
    text = "ELECTRONIC BRAIN:\n30 Seconds to Solve\nWhat Takes 40 Hours\nby Hand"
    draw.multiline_text((512, 400), text, fill=(26, 26, 26), anchor="mm", align="center", spacing=20)
    draw.text((512, 800), "ENIAC DEBUTS AT UNIVERSITY OF PENNSYLVANIA", fill=(26, 26, 26), anchor="mt")

def era1_cloud(img, draw):
    draw.rectangle([0, 0, 1024, 1024], fill=(230, 225, 210))
    # Swirling snippets
    for _ in range(50):
        x, y = random.randint(0, 1024), random.randint(0, 1024)
        w, h = random.randint(100, 300), random.randint(50, 150)
        draw.rectangle([x, y, x+w, y+h], outline=(100, 100, 100), fill=(240, 240, 235))
        for i in range(5):
            draw.line([x+10, y+20+(i*20), x+w-10, y+20+(i*20)], fill=(80, 80, 80), width=2)

# ERA 2: Retro Tech
def era2_reading(img, draw):
    draw.rectangle([0, 0, 1024, 1024], fill=(20, 20, 25))
    draw.text((512, 200), "Apple Introduces Macintosh:", fill=(255, 255, 255), anchor="mm")
    draw.text((512, 512), "Why 1984 Won't Be Like 1984", fill=(0, 255, 0), anchor="mm")
    # Simple Macintosh icon
    draw.rectangle([412, 650, 612, 850], outline=(200, 200, 200), width=5)
    draw.rectangle([432, 670, 592, 780], fill=(50, 50, 60))

def era2_cloud(img, draw):
    draw.rectangle([0, 0, 1024, 1024], fill=(40, 40, 40))
    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255), (0, 255, 255)]
    for _ in range(200):
        x, y = random.randint(0, 1024), random.randint(0, 1024)
        size = random.randint(20, 100)
        draw.rectangle([x, y, x+size, y+size], fill=random.choice(colors))

# ERA 3: Web 1.0
def era3_reading(img, draw):
    draw.rectangle([0, 0, 1024, 1024], fill=(192, 192, 192)) # Classic grey
    draw.rectangle([50, 50, 974, 974], outline=(255, 255, 255), width=2)
    draw.rectangle([52, 52, 976, 976], outline=(128, 128, 128), width=2)
    
    draw.rectangle([50, 50, 974, 100], fill=(0, 0, 128)) # Title bar
    draw.text((60, 60), "Netscape - [The World Wide Web Goes Commercial]", fill=(255, 255, 255))
    
    draw.text((512, 400), "The World Wide Web\nGoes Commercial", fill=(0, 0, 255), anchor="mm", align="center")
    draw.text((512, 600), "Under Construction", fill=(255, 0, 0), anchor="mm")

def era3_cloud(img, draw):
    draw.rectangle([0, 0, 1024, 1024], fill=(255, 255, 255))
    symbols = ["@", "http://", "<a>", "<html>", "WWW", "CLICK HERE"]
    for _ in range(100):
        x, y = random.randint(0, 1024), random.randint(0, 1024)
        draw.text((x, y), random.choice(symbols), fill=(random.randint(0, 255), random.randint(0, 255), 255))

# ERA 4: Future/Binary
def era4_reading(img, draw):
    draw.rectangle([0, 0, 1024, 1024], fill=(0, 0, 0))
    # Neural net nodes/lines
    for _ in range(30):
        x1, y1 = random.randint(0, 1024), random.randint(0, 1024)
        x2, y2 = random.randint(0, 1024), random.randint(0, 1024)
        draw.line([x1, y1, x2, y2], fill=(0, 100, 255), width=1)
    
    draw.text((512, 512), "The Machines Begin to Talk Back", fill=(0, 255, 255), anchor="mm")

def era4_cloud(img, draw):
    draw.rectangle([0, 0, 1024, 1024], fill=(0, 5, 10))
    for _ in range(1000):
        x, y = random.randint(0, 1024), random.randint(0, 1024)
        val = random.choice(["0", "1"])
        draw.text((x, y), val, fill=(0, random.randint(50, 200), 0))

create_image("era1_reading.png", era1_reading)
create_image("era1_cloud.png", era1_cloud)
create_image("era2_reading.png", era2_reading)
create_image("era2_cloud.png", era2_cloud)
create_image("era3_reading.png", era3_reading)
create_image("era3_cloud.png", era3_cloud)
create_image("era4_reading.png", era4_reading)
create_image("era4_cloud.png", era4_cloud)
