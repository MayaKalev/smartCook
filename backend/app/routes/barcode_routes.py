from flask import Blueprint, request, jsonify
from app.models import InventoryItem
from app.extensions import db
import requests

barcode_bp = Blueprint('barcode', __name__)


@barcode_bp.route("/barcode/product/<barcode>", methods=["GET"])
def get_product_by_barcode(barcode):
    # דוגמה לחיפוש ב-OpenFoodFacts
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(url)
        data = response.json()

        if data.get("status") != 1:
            return jsonify({"error": "Product not found"}), 404

        product = data.get("product", {})
        result = {
            "barcode": barcode,
            "name": product.get("product_name", "Unknown"),
            "brand": product.get("brands", "Unknown"),
            "category": product.get("categories", "Unknown"),
            "quantity": product.get("quantity", ""),
            "image_url": product.get("image_url", "")
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@barcode_bp.route("/barcode/add", methods=["POST"])
def add_product_by_barcode():
    data = request.get_json() or {}
    barcode = data.get("barcode")
    user_id = data.get("user_id")
    quantity = data.get("quantity", 1)
    unit = data.get("unit", "")

    if not barcode or not user_id:
        return jsonify({"error": "Missing barcode or user_id"}), 400

    # חיפוש מידע בסיסי על המוצר לפי הברקוד
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(url)
        product_data = response.json()

        if product_data.get("status") != 1:
            return jsonify({"error": "Product not found in external DB"}), 404

        product = product_data.get("product", {})
        name = product.get("product_name", f"Product {barcode}")
        category = product.get("categories", "Other")

        new_item = InventoryItem(
            name=name,
            category=category,
            quantity=quantity,
            unit=unit,
            expiration_date=None,
            user_id=user_id
        )
        db.session.add(new_item)
        db.session.commit()

        return jsonify({"message": "Product added to inventory", "item": new_item.to_dict()}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
