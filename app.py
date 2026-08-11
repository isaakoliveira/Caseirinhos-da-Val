import os
import re
import secrets
import sqlite3
from datetime import datetime, timezone

from flask import Flask, g, jsonify, request, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "usuarios.db")

app = Flask(__name__)

GOOGLE_CLIENT_IDS = [
    cid.strip()
    for cid in os.environ.get("GOOGLE_CLIENT_ID", "").split(",")
    if cid.strip()
]

JWT_IS_AVAILABLE = False
_jwks_client = None
try:
    import jwt
    from jwt import PyJWKClient

    GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs"
    _jwks_client = PyJWKClient(GOOGLE_JWKS, cache_keys=True)
    JWT_IS_AVAILABLE = True
except Exception:
    _jwks_client = None

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?[0-9]{10,13}$")
USERNAME_RE = re.compile(r"^[A-Za-z0-9\u00C0-\u00FF _.\-]{2,30}$")


def normalizar_phone(valor):
    return re.sub(r"[^0-9]", "", valor or "")


def get_db():
    db = getattr(g, "_db", None)
    if db is None:
        db = g._db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON")
    return db


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            password_hash TEXT,
            provider TEXT NOT NULL DEFAULT 'email',
            google_sub TEXT UNIQUE,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL
        );
        """
    )
    db.commit()
    db.close()


@app.teardown_appcontext
def fechar_db(_exc):
    db = getattr(g, "_db", None)
    if db is not None:
        db.close()


def serializar_usuario(row):
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "phone": row["phone"],
        "provider": row["provider"],
    }


def criar_sessao(db, user_id):
    token = secrets.token_hex(32)
    db.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, datetime.now(timezone.utc).isoformat()),
    )
    db.commit()
    return token


def usuario_do_token():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:].strip()
    db = get_db()
    return db.execute(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?",
        (token,),
    ).fetchone()


def verificar_google_token(credential):
    if not JWT_IS_AVAILABLE or not GOOGLE_CLIENT_IDS or _jwks_client is None:
        return None
    try:
        chave = _jwks_client.get_signing_key_from_jwt(credential)
        return jwt.decode(
            credential,
            chave.key,
            algorithms=["RS256"],
            audience=GOOGLE_CLIENT_IDS,
            options={"verify_exp": True},
        )
    except Exception:
        return None


# ===== PAGINAS =====
@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:caminho>")
def arquivos(caminho):
    if os.path.isfile(os.path.join(BASE_DIR, caminho)):
        return send_from_directory(BASE_DIR, caminho)
    return jsonify({"ok": False, "erro": "Arquivo nao encontrado"}), 404


# ===== AUTH =====
@app.get("/api/health")
def health():
    return jsonify({"ok": True, "servidor": "Caseirinhos da Val"})


@app.post("/api/register")
def registrar():
    dados = request.get_json(silent=True) or {}
    username = (dados.get("username") or "").strip()
    email = (dados.get("email") or "").strip().lower()
    phone = normalizar_phone(dados.get("phone"))
    senha = dados.get("password") or ""

    if not USERNAME_RE.match(username):
        return jsonify({"ok": False, "erro": "Nome de usuario invalido (2 a 30 caracteres)."}), 400
    if email and not EMAIL_RE.match(email):
        return jsonify({"ok": False, "erro": "E-mail invalido."}), 400
    if phone and not PHONE_RE.match(phone):
        return jsonify({"ok": False, "erro": "Telefone invalido."}), 400
    if len(senha) < 6:
        return jsonify({"ok": False, "erro": "A senha precisa de pelo menos 6 caracteres."}), 400
    if not email and not phone:
        return jsonify({"ok": False, "erro": "Informe e-mail ou telefone."}), 400

    db = get_db()
    try:
        cur = db.execute(
            "INSERT INTO users (username, email, phone, password_hash, provider, created_at) VALUES (?, ?, ?, ?, 'email', ?)",
            (
                username,
                email or None,
                phone or None,
                generate_password_hash(senha),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        db.commit()
        user = db.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    except sqlite3.IntegrityError:
        return jsonify({"ok": False, "erro": "E-mail ou telefone ja cadastrado."}), 409

    token = criar_sessao(db, user["id"])
    return jsonify({"ok": True, "token": token, "user": serializar_usuario(user)})


@app.post("/api/login")
def login_email():
    dados = request.get_json(silent=True) or {}
    identificador = (dados.get("identificador") or dados.get("email") or "").strip().lower()
    senha = dados.get("password") or ""

    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE lower(email) = ? OR phone = ?",
        (identificador, normalizar_phone(identificador)),
    ).fetchone()
    if not user or not user["password_hash"] or not check_password_hash(user["password_hash"], senha):
        return jsonify({"ok": False, "erro": "E-mail ou senha invalidos."}), 401

    token = criar_sessao(db, user["id"])
    return jsonify({"ok": True, "token": token, "user": serializar_usuario(user)})


@app.post("/api/login-phone")
def login_telefone():
    dados = request.get_json(silent=True) or {}
    phone = normalizar_phone(dados.get("phone"))
    senha = dados.get("password") or ""

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE phone = ?", (phone,)).fetchone()
    if not user or not user["password_hash"] or not check_password_hash(user["password_hash"], senha):
        return jsonify({"ok": False, "erro": "Telefone ou senha invalidos."}), 401

    token = criar_sessao(db, user["id"])
    return jsonify({"ok": True, "token": token, "user": serializar_usuario(user)})


@app.post("/api/google-login")
def login_google():
    dados = request.get_json(silent=True) or {}
    credential = dados.get("credential") or ""
    if not credential:
        return jsonify({"ok": False, "erro": "Credencial do Google ausente."}), 400

    info = verificar_google_token(credential)
    if not info:
        return jsonify({"ok": False, "erro": "Nao foi possivel validar o login com o Google."}), 401

    email = (info.get("email") or "").lower()
    google_sub = str(info.get("sub") or "")
    nome_google = (info.get("name") or "").strip() or (email.split("@")[0] if email else "Usuario")

    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE google_sub = ? OR (email IS NOT NULL AND email = ?)",
        (google_sub, email),
    ).fetchone()

    if user is None:
        if email:
            user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            if user:
                db.execute("UPDATE users SET google_sub = ? WHERE id = ?", (google_sub, user["id"]))
        if user is None:
            cur = db.execute(
                "INSERT INTO users (username, email, phone, password_hash, provider, google_sub, created_at) VALUES (?, ?, NULL, NULL, 'google', ?, ?)",
                (nome_google, email or None, google_sub, datetime.now(timezone.utc).isoformat()),
            )
            user = db.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
        db.commit()

    token = criar_sessao(db, user["id"])
    return jsonify({"ok": True, "token": token, "user": serializar_usuario(user)})


@app.get("/api/me")
def me():
    user = usuario_do_token()
    if not user:
        return jsonify({"ok": False, "erro": "Nao autenticado."}), 401
    return jsonify({"ok": True, "user": serializar_usuario(user)})


@app.post("/api/logout")
def logout():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        db = get_db()
        db.execute("DELETE FROM sessions WHERE token = ?", (auth[7:].strip(),))
        db.commit()
    return jsonify({"ok": True})


@app.post("/api/update-username")
def atualizar_username():
    user = usuario_do_token()
    if not user:
        return jsonify({"ok": False, "erro": "Nao autenticado."}), 401

    dados = request.get_json(silent=True) or {}
    novo = (dados.get("username") or "").strip()
    if not USERNAME_RE.match(novo):
        return jsonify({"ok": False, "erro": "Nome de usuario invalido (2 a 30 caracteres)."}), 400

    db = get_db()
    db.execute("UPDATE users SET username = ? WHERE id = ?", (novo, user["id"]))
    db.commit()
    return jsonify({"ok": True, "user": serializar_usuario(db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone())})


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)