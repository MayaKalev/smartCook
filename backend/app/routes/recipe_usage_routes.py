from flask import Blueprint, request, jsonify
from app.services.recipe_usage_service import update_inventory_after_recipe
from app.models import db, NutritionLog
from datetime import datetime

recipe_usage_bp = Blueprint("recipe_usage", __name__, url_prefix="/api/use-recipe")

@recipe_usage_bp.post("/")
def use_recipe():
    data = request.get_json()
    user_id = data.get("user_id")
    recipe_hash = data.get("recipe_hash")
    ingredients = data.get("ingredients", [])
    nutrition = data.get("nutrition")  # ← קבלת ערכים תזונתיים מהקליינט
  


    result = update_inventory_after_recipe(user_id, ingredients)

    if "error" in result:
        return jsonify(result), 400

    # ✨ רישום תזונתי – רק אם נשלח nutrition
    # ✨ רישום תזונתי – עם recipe_hash ישיר
    if nutrition and "per_serving" in nutrition and all(
        k in nutrition["per_serving"] for k in ["calories", "protein", "carbs", "fat"]
    ):
        log = NutritionLog(
            user_id=user_id,
            recipe_hash=recipe_hash,
            date=datetime.utcnow(),
            calories=nutrition["per_serving"]["calories"],
            protein=nutrition["per_serving"]["protein"],
            carbs=nutrition["per_serving"]["carbs"],
            fat=nutrition["per_serving"]["fat"]
        )
        try:
            db.session.add(log)
            db.session.commit()
            print("✅ Nutrition log saved:", log.to_dict())
        except Exception as e:
            print("❌ DB ERROR:", e)

        result["nutrition_log"] = log.to_dict()
    else:
        print("⚠️ Missing keys in nutrition or bad structure:", nutrition)


    return jsonify(result), 200
