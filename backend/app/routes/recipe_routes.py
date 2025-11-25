from flask import Blueprint, jsonify, request

from app.services.recipe_service import get_recommended_recipes
from app.services.saved_recipe_service import (
    save_recipe,
    delete_saved_recipe,
    get_saved_recipes,
)

recipe_bp = Blueprint('recipe', __name__)

# 🔸 בקשת המלצות POST עם פרמטרים מותאמים אישית
@recipe_bp.route('/recommended', methods=['POST'])
def recommended_recipes():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    user_message = data.get("user_message", "Get me a recipe.")
    user_prefs = data.get("user_prefs", {})
    num_recipes = data.get("num_recipes", 3)

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    print(f"📥 POST /recommended by user {user_id} | num_recipes={num_recipes}")

    result = get_recommended_recipes(
        user_id=user_id,
        user_message=user_message,
        user_prefs=user_prefs,
        save_to_db=False,
        num_recipes=num_recipes
    )

    print("✅ Result:", result)
    return jsonify({"recipes": result}), 200  # 🔁 עטוף את הרשימה 


# 🔸 שליפת כל המתכונים השמורים של המשתמש
@recipe_bp.route('/saved/<int:user_id>', methods=['GET'])
def get_saved(user_id):
    saved = get_saved_recipes(user_id)
    return jsonify(saved), 200



# 🔸 שמירת מתכון שנבחר ע"י המשתמש
@recipe_bp.route('/saved/<int:user_id>', methods=['POST'])
def save(user_id):
    data = request.get_json() or {}
    save_recipe(user_id, data)
    return jsonify({"message": "Recipe saved."}), 201


# 🔸 מחיקת מתכון שנשמר ע"י המשתמש
@recipe_bp.route('/saved/<int:user_id>', methods=['DELETE'])
def unsave(user_id):
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"error": "Missing recipe title"}), 400
    delete_saved_recipe(user_id, title)
    return jsonify({"message": "Recipe removed."}), 200