from flask import Blueprint, request, jsonify
from app.services.auth_service import register_user, authenticate_user
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    if not data.get("username") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Missing fields"}), 400

    user = register_user(data)

    if not user:
        return jsonify({"error": "Username or email already taken"}), 409  # ⚠️ כאן

    return jsonify({"message": "User registered successfully!"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    user = authenticate_user(data)

    if not user:
        return jsonify({"error": "Incorrect username or password"}), 200

    token = create_access_token(identity=user.id)
    return jsonify({
        "access_token": token,
        "user_id": user.id,
        "username": user.username,
        "image_url": user.image_url or ""
    }), 200
