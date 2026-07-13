import sqlite3
import os
import hashlib
import secrets
import re
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_url_path="")
DB_PATH = os.path.join(os.path.dirname(__file__), "caseirinhos.db")
SECRET_KEY = secrets.token_hex(32)
TOKENS = {}

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            password_hash TEXT,
            auth_method TEXT NOT NULL DEFAULT 'email',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT,
            category TEXT NOT NULL DEFAULT 'doces',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_code TEXT NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        );
    """)
    conn.commit()

    cursor = conn.execute("SELECT COUNT(*) as c FROM products")
    if cursor.fetchone()["c"] == 0:
        seed_products(conn)

    conn.close()

def seed_products(conn):
    products = [
        ("doceLeiteCoco", "Doce de Leite com Coco (pote 350 ml)", 12.00, "doce-de-leite-com-coco-sem-risco-camera.jpeg", "doces"),
        ("doceLeiteGoiabada", "Doce de Leite com Goiabada (pote 350 ml)", 12.00, "doce-de-leite-com-goiabada-sem-risco-camera.jpeg", "doces"),
        ("doceLeite", "Doce de Leite Comum (pote 350 ml)", 12.00, "doce-de-leite-sem-risco-camera-inpaint-wide.jpeg", "doces"),
        ("pudim18", "Pudim Pequeno (500g)", 18.00, "pudim 18,00$.jpeg", "doces"),
        ("pudim35", "Pudim Grande (1kg)", 35.00, "pudim 35,00$.jpeg", "doces"),
        ("boloSimples", "Bolo de Leite", 12.00, "bolo de leite.jpeg", "bolos"),
        ("boloMilhoPalha", "Bolo de Milho Verde na Palha", 12.00, "Bolo de miho na palha.jpg", "bolos"),
        ("boloChocolate50", "Bolo de Chocolate 50%", 12.00, "bolo de chocolate 50%25.jpeg", "bolos"),
        ("boloLeiteCoco", "Bolo de Leite com Coco", 12.00, "bolo de leite com coco 2.0.jpeg", "bolos"),
        ("boloOvos", "Bolo de Ovos", 12.00, "bolo de ovos.jpeg", "bolos"),
        ("boloFormigueiro", "Bolo Formigueiro", 12.00, "bolo formigueiro.jpeg", "bolos"),
        ("boloMesclado", "Bolo Mesclado", 12.00, "bolo mesclado.jpeg", "bolos"),
    ]
    conn.executemany(
        "INSERT INTO products (code, name, price, image, category) VALUES (?, ?, ?, ?, ?)",
        products
    )
    conn.commit()

def hash_password(password):
    return hashlib.sha256((password + SECRET_KEY).encode()).hexdigest()

def generate_token(user_id):
    token = secrets.token_hex(32)
    TOKENS[token] = {"user_id": user_id, "expires": datetime.now() + timedelta(days=7)}
    return token

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "") if auth_header else request.cookies.get("token")

        if not token or token not in TOKENS:
            return jsonify({"error": "Autenticacao necessaria"}), 401

        session = TOKENS[token]
        if session["expires"] < datetime.now():
            del TOKENS[token]
            return jsonify({"error": "Sessao expirada"}), 401

        return f(session["user_id"], *args, **kwargs)
    return decorated

@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

@app.route("/")
def serve_index():
    return send_from_directory(os.path.dirname(__file__), "index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(os.path.dirname(__file__), path)

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "db": DB_PATH})

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""

    if not name or len(name) < 2:
        return jsonify({"error": "Nome deve ter pelo menos 2 caracteres"}), 400

    if not email and not phone:
        return jsonify({"error": "Informe email ou telefone"}), 400

    if email and not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Email invalido"}), 400

    if password and len(password) < 4:
        return jsonify({"error": "Senha deve ter pelo menos 4 caracteres"}), 400

    conn = get_db()
    try:
        if email:
            existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
            if existing:
                return jsonify({"error": "Este email ja esta cadastrado"}), 409

        if phone:
            existing = conn.execute("SELECT id FROM users WHERE phone = ?", (phone,)).fetchone()
            if existing:
                return jsonify({"error": "Este telefone ja esta cadastrado"}), 409

        hashed = hash_password(password) if password else ""
        method = "email" if email else "phone"

        cursor = conn.execute(
            "INSERT INTO users (name, email, phone, password_hash, auth_method) VALUES (?, ?, ?, ?, ?)",
            (name, email or None, phone or None, hashed, method)
        )
        conn.commit()
        user_id = cursor.lastrowid

        token = generate_token(user_id)
        return jsonify({
            "token": token,
            "user": {"id": user_id, "name": name, "email": email or None, "phone": phone or None, "method": method}
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Erro ao cadastrar: " + str(e)}), 500
    finally:
        conn.close()

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""

    if not email and not phone:
        return jsonify({"error": "Informe email ou telefone"}), 400

    conn = get_db()
    try:
        user = None
        if email:
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        elif phone:
            user = conn.execute("SELECT * FROM users WHERE phone = ?", (phone,)).fetchone()

        if not user:
            return jsonify({"error": "Conta nao encontrada"}), 404

        if user["password_hash"] and hash_password(password) != user["password_hash"]:
            return jsonify({"error": "Senha incorreta"}), 401

        if not user["password_hash"] and not password:
            pass

        token = generate_token(user["id"])
        return jsonify({
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "method": user["auth_method"]
            }
        })
    finally:
        conn.close()

@app.route("/api/auth/me", methods=["GET"])
@require_auth
def get_me(user_id):
    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify({"error": "Usuario nao encontrado"}), 404

        return jsonify({
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "method": user["auth_method"]
            }
        })
    finally:
        conn.close()

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header else request.cookies.get("token")

    if token and token in TOKENS:
        del TOKENS[token]

    return jsonify({"message": "Desconectado com sucesso"})

@app.route("/api/auth/phone/send-code", methods=["POST"])
def send_phone_code():
    data = request.get_json() or {}
    phone = (data.get("phone") or "").strip()

    if not phone or len(phone.replace(r"\D", "")) < 10:
        return jsonify({"error": "Telefone invalido"}), 400

    return jsonify({"message": "Codigo enviado", "code": "123456"})

@app.route("/api/products", methods=["GET"])
def list_products():
    category = request.args.get("category")
    conn = get_db()
    try:
        if category:
            products = conn.execute(
                "SELECT * FROM products WHERE category = ? ORDER BY id", (category,)
            ).fetchall()
        else:
            products = conn.execute("SELECT * FROM products ORDER BY category, id").fetchall()

        return jsonify({
            "products": [{
                "code": p["code"],
                "name": p["name"],
                "price": p["price"],
                "image": p["image"],
                "category": p["category"]
            } for p in products]
        })
    finally:
        conn.close()

@app.route("/api/orders", methods=["GET"])
@require_auth
def list_orders(user_id):
    conn = get_db()
    try:
        orders = conn.execute(
            "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
        ).fetchall()

        result = []
        for o in orders:
            items = conn.execute(
                "SELECT * FROM order_items WHERE order_id = ?", (o["id"],)
            ).fetchall()

            result.append({
                "id": o["id"],
                "total": o["total"],
                "status": o["status"],
                "created_at": o["created_at"],
                "items": [{
                    "product_code": i["product_code"],
                    "product_name": i["product_name"],
                    "quantity": i["quantity"],
                    "unit_price": i["unit_price"]
                } for i in items]
            })

        return jsonify({"orders": result})
    finally:
        conn.close()

@app.route("/api/orders", methods=["POST"])
@require_auth
def create_order(user_id):
    data = request.get_json() or {}
    items_data = data.get("items", [])

    if not items_data:
        return jsonify({"error": "Carrinho vazio"}), 400

    conn = get_db()
    try:
        total = 0
        items = []

        for item in items_data:
            code = item.get("code")
            quantity = int(item.get("quantity", 1))

            product = conn.execute("SELECT * FROM products WHERE code = ?", (code,)).fetchone()
            if not product:
                return jsonify({"error": f"Produto {code} nao encontrado"}), 404

            unit_price = product["price"]
            total += unit_price * quantity
            items.append({
                "product_code": code,
                "product_name": product["name"],
                "quantity": quantity,
                "unit_price": unit_price
            })

        cursor = conn.execute(
            "INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'pending')",
            (user_id, total)
        )
        order_id = cursor.lastrowid

        for item in items:
            conn.execute(
                "INSERT INTO order_items (order_id, product_code, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)",
                (order_id, item["product_code"], item["product_name"], item["quantity"], item["unit_price"])
            )

        conn.commit()
        return jsonify({"order_id": order_id, "total": total, "status": "pending"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Erro ao criar pedido: " + str(e)}), 500
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    print(f"Servidor rodando em http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
