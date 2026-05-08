import urllib.request
import urllib.error
import json

BASE = "http://127.0.0.1:5000"
PASS = []
FAIL = []

def get(path):
    try:
        res = urllib.request.urlopen(BASE + path)
        raw = res.read()
        try:
            return res.status, json.loads(raw)
        except Exception:
            return res.status, raw.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return 0, str(e)

def post(path, payload, cookie=None):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(BASE + path, data=data,
                                 headers={"Content-Type": "application/json"})
    if cookie:
        req.add_header("Cookie", cookie)
    try:
        res = urllib.request.urlopen(req)
        headers = dict(res.headers)
        set_cookie = headers.get("Set-Cookie", "")
        return res.status, json.loads(res.read()), set_cookie
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read()), ""
    except Exception as e:
        return 0, str(e), ""

def check(label, condition, detail=""):
    if condition:
        PASS.append(label)
        print("  PASS  " + label)
    else:
        FAIL.append(label)
        print("  FAIL  " + label + "  ->  " + str(detail))

print("")
print("========= SHOP EASE BACKEND TESTS =========")
print("")

# 1. Home route
status, body = get("/")
check("GET / (home)", status == 200, body)

# 2. All products
status, body = get("/api/products")
count = len(body) if isinstance(body, list) else 0
check("GET /api/products (10 products)", status == 200 and count == 10, "got " + str(count))

# 3. Category filter
status, body = get("/api/products?category=casual")
check("GET /api/products?category=casual", status == 200 and isinstance(body, list) and len(body) > 0, body)

# 4. Category filter - gym
status, body = get("/api/products?category=gym")
check("GET /api/products?category=gym", status == 200 and isinstance(body, list) and len(body) > 0, body)

# 5. Search
status, body = get("/api/products/search?q=shirt")
check("GET /api/products/search?q=shirt", status == 200 and isinstance(body, list) and len(body) > 0, body)

print("")
print("=========  RESULTS  =========")
print("  Passed: " + str(len(PASS)) + "/" + str(len(PASS) + len(FAIL)))
if FAIL:
    print("  Failed tests:")
    for f in FAIL:
        print("    - " + f)
print("==============================")
print("")
