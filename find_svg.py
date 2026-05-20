import os

file_path = r"c:\Users\Welcome\OneDrive\Documents\E commerce website\frontend\src\pages\admin\AdminDashboard.jsx"

if os.path.exists(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Find all occurrences of <svg
    idx = 0
    while True:
        pos = content.find("<svg", idx)
        if pos == -1:
            break
        # Print 200 characters before and 400 characters after
        start = max(0, pos - 150)
        end = min(len(content), pos + 300)
        print(f"--- MATCH AT POSITION {pos} ---")
        print(content[start:end])
        print("---------------------------------\n")
        idx = pos + 1
else:
    print("File does not exist")
