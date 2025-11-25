# app/routes/assistant_routes.py
from flask import Blueprint, request, jsonify
from app.services.recipe_service import get_recommended_recipes
from app.services.global_cache import CACHE

assistant_bp = Blueprint("assistant", __name__)

@assistant_bp.route("/assistant", methods=["POST"])
def handle_assistant():
    data         = request.get_json(force=True)
    user_id      = data.get("user_id")
    user_message = data.get("message", "What can I cook today?")
    user_prefs   = data.get("user_prefs", {})
    num_recipes  = int(data.get("num_recipes", 1))
    use_expiring = data.get("use_expiring_soon", False)
    prev_recipe   = data.get("prev_recipe")
    

    try:
        recipes = get_recommended_recipes(
            user_id      = user_id,
            user_message = user_message,
            user_prefs   = user_prefs,
            num_recipes  = num_recipes,
            save_to_db   = False,
            use_cache    = False,  
            use_expiring_soon= use_expiring,
            prev_recipe       = prev_recipe
        )
        if not recipes:
            return jsonify({"recipes": [{"message": "No recipes generated."}]}), 200
        print("recipes11",recipes)
        return jsonify({"user_id": user_id, "recipes": recipes}), 200
    except Exception as exc:
        print("❌ SERVER ERROR:", exc)
        return jsonify({"error": str(exc)}), 500


# --------------------------------------------------------------
#  POST /api/assistant/refresh/<user_id>   – dashboard refresh
# --------------------------------------------------------------
@assistant_bp.route("/assistant/refresh/<int:user_id>", methods=["POST"])
def refresh_recommendations(user_id):
    """
    Clears user-specific cache and returns a fresh batch (3 recipes)
    for the dashboard widget.
    """
    data         = request.get_json() or {}
    user_prefs   = data.get("user_prefs", {})
    user_message = data.get("user_message", "What can I cook today?")

    # purge cache so recipe_service must call the AI again
    if user_id in CACHE:
        del CACHE[user_id]

    new_recipes = get_recommended_recipes(
        user_id      = user_id,
        user_message = user_message,
        user_prefs   = user_prefs,
        num_recipes  = 3,
        save_to_db   = False,
    )

    return jsonify({"recipes": new_recipes}), 200
