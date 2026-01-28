import requests
import time
import os
import re

# Config
BASE_URL = "http://127.0.0.1:8000"
UI_DIR = "ui"

def print_pass(msg):
    print(f"[PASS]: {msg}")

def print_fail(msg):
    print(f"[FAIL]: {msg}")

def print_warn(msg):
    print(f"[WARN]: {msg}")

def check_api_health():
    print("\n--- 1. API Health & Latency ---")
    endpoints = [
        "/",
        "/api/pregnancy/status?user_id=1",
        "/api/names/?user_id=1",
        "/api/nutrition/?search=Sushi"
    ]
    
    for ep in endpoints:
        start = time.time()
        try:
            res = requests.get(f"{BASE_URL}{ep}")
            duration = (time.time() - start) * 1000
            if res.status_code == 200:
                if duration < 200:
                    print_pass(f"{ep} ({duration:.2f}ms)")
                else:
                    print_warn(f"{ep} is slow ({duration:.2f}ms)")
            else:
                print_fail(f"{ep} returned {res.status_code}")
        except:
            print_fail(f"Could not connect to {ep}. Is the server running?")

def check_broken_images():
    print("\n--- 2. Broken Image Check (Static) ---")
    # Scan index.html for src="..."
    try:
        with open(f"{UI_DIR}/index.html", "r", encoding="utf-8") as f:
            content = f.read()
            images = re.findall(r'src=["\'](.*?)["\']', content)
            
            for img in images:
                if img.startswith("http"):
                    continue # Skip external
                
                # Handling js assets or css assets too? simplified
                if img.endswith(".js") or img.endswith(".json"): continue

                path = os.path.join(UI_DIR, img)
                if os.path.exists(path):
                    print_pass(f"Found local asset: {img}")
                else:
                    # Some might be dynamic placeholders
                    print_warn(f"Missing local asset: {img} (If this is dynamic, ignore)")
    except Exception as e:
        print_fail(f"Could not read index.html: {e}")

def check_offline_readiness():
    print("\n--- 3. Offline Capability Check ---")
    required_files = ["sw.js", "manifest.json", "js/app.js", "css/style.css"]
    
    missing = []
    for f in required_files:
        if os.path.exists(os.path.join(UI_DIR, f)):
            print_pass(f"Found PWA core file: {f}")
        else:
            missing.append(f)
            
    if missing:
        print_fail(f"Missing PWA files: {', '.join(missing)}")
    else:
        print_pass("Basic PWA file structure is intact.")

if __name__ == "__main__":
    print("Running Koza Pre-flight Checklist...")
    check_api_health()
    check_broken_images()
    check_offline_readiness()
    print("\nDone.")
