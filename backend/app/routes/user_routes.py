# app/routes/user_routes.py
from flask import Blueprint, jsonify, request
from app.services.user_service import (
    get_preferences, set_preferences,
    get_profile, update_profile
)

user_bp = Blueprint('user', __name__)

# ---------------------
# Preferences Routes
# ---------------------

@user_bp.route('/preferences/<int:user_id>', methods=['GET'])
def get_preferences_route(user_id):
    prefs = get_preferences(user_id)
    return jsonify(prefs), 200


@user_bp.route('/preferences/<int:user_id>', methods=['PUT'])
def update_preferences_route(user_id):
    data = request.get_json() or {}
    success = set_preferences(user_id, data)
    if not success:
        return jsonify({"message": "User not found"}), 404
    return jsonify(data), 200


# ---------------------
# Profile Routes
# ---------------------

@user_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_profile_route(user_id):
    profile = get_profile(user_id)
    if not profile:
        return jsonify({"message": "User not found"}), 404
    return jsonify(profile), 200


@user_bp.route('/profile/<int:user_id>', methods=['PUT'])
def update_profile_route(user_id):
    data = request.get_json() or {}
    success = update_profile(user_id, data)
    if not success:
        return jsonify({"message": "User not found or update failed"}), 404
    return jsonify({"message": "Profile updated successfully"}), 200
