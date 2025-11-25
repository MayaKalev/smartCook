# app/routes/inventory_routes.py
# ------------------------------------------------------------
#  ניהול מלאי – CRUD  (Blueprint)
# ------------------------------------------------------------
from flask import Blueprint, request, jsonify
from datetime import datetime

from app.extensions import db
from app.models import InventoryItem
from app.services import inventory_service


inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


# --------------------------------------------------------------------------- #
#                               Helper – formatter                            #
# --------------------------------------------------------------------------- #
def _item_to_dict(item: InventoryItem) -> dict:
    """המרת אובייקט InventoryItem ל־dict JSON-י מלא, כולל ערכים תזונתיים."""
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "quantity": item.quantity,
        "unit": item.unit,
        "expiration_date": item.expiration_date.isoformat() if item.expiration_date else None,
        "nutrition": {
            "calories": item.calories,
            "protein": item.protein,
            "carbs": item.carbs,
            "fat": item.fat,
        },
    }


# --------------------------------------------------------------------------- #
#                               🔹 שליפה – GET                                #
# --------------------------------------------------------------------------- #
@inventory_bp.route("/<int:user_id>", methods=["GET"])
def get_inventory(user_id: int):
    items = inventory_service.get_user_inventory(user_id)
    return jsonify({"inventory": [_item_to_dict(i) for i in items]})



# --------------------------------------------------------------------------- #
#                               🔹 הוספה – POST                               #
# --------------------------------------------------------------------------- #
@inventory_bp.route("/<int:user_id>", methods=["POST"])
def add_item(user_id: int):
    data = request.get_json(force=True)
    item = inventory_service.add_inventory_item(user_id, data)
    return jsonify(_item_to_dict(item)), 201


# --------------------------------------------------------------------------- #
#                              🔹 עדכון – PUT                                 #
# --------------------------------------------------------------------------- #
@inventory_bp.route("/<int:user_id>/<int:item_id>", methods=["PUT"])
def update_item(user_id: int, item_id: int):
    data = request.get_json(force=True)
    item = inventory_service.update_inventory_item(user_id, item_id, data)
    if not item:
        return jsonify(message="Item not found"), 404
    return jsonify(_item_to_dict(item)), 200


# --------------------------------------------------------------------------- #
#                             🔹 מחיקה – DELETE                               #
# --------------------------------------------------------------------------- #
@inventory_bp.route("/<int:user_id>/<int:item_id>", methods=["DELETE"])
def delete_item(user_id: int, item_id: int):
    item = inventory_service.delete_inventory_item(user_id, item_id)
    if not item:
        return jsonify(message="Item not found"), 404
    return jsonify(message="Item deleted successfully"), 200



