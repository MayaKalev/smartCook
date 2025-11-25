from flask import Blueprint, request, jsonify
from pyzbar.pyzbar import decode
from PIL import Image
import base64
import io

scan_bp = Blueprint('scan', __name__)


@scan_bp.route("/api/scan/base64", methods=["POST"])
def scan_image_file():
    """
    סריקה מתמונה שהועלתה כקובץ (multipart/form-data)
    """
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    try:
        image = Image.open(file.stream)
        decoded = decode(image)

        if not decoded:
            return jsonify({"message": "No barcode detected"}), 404

        barcodes = [obj.data.decode("utf-8") for obj in decoded]
        return jsonify({"barcodes": barcodes})


    except Exception as e:
        return jsonify({"error": str(e)}), 500


@scan_bp.route('/scan/base64', methods=['POST'])
def scan_base64_image():
    """
    סריקה מתמונה שהועלתה כ־Base64 (בפורמט JSON)
    """
    data = request.get_json() or {}
    image_base64 = data.get("image")

    if not image_base64:
        return jsonify({"error": "Missing image data"}), 400

    try:
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes))
        decoded = decode(image)

        if not decoded:
            return jsonify({"message": "No barcode detected"}), 404

        barcodes = []
        for barcode in decoded:
            barcodes.append({
                "type": barcode.type,
                "data": barcode.data.decode("utf-8")
            })

        return jsonify({"barcodes": barcodes}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
