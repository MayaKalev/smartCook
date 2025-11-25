from flask import Blueprint, request, jsonify
from app.services import spice_service

spice_bp = Blueprint("spice", __name__)


@spice_bp.route("/toggle", methods=["POST"])
def toggle_spice():
    data = request.get_json()
    user_id = data.get("user_id")
    spice_name = data.get("spice_name")

    if not user_id or not spice_name:
        return jsonify({"error": "Missing user_id or spice_name"}), 400

    result = spice_service.toggle_spice_for_user(user_id, spice_name)
    return jsonify(result)


@spice_bp.route("/list", methods=["GET"])
def get_user_spices():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    spices = spice_service.get_spices_for_user(int(user_id))
    return jsonify(spices)
