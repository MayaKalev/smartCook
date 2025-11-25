from flask import Blueprint, request, jsonify
from app.services.rating_service import rate_recipe
from app.models import RecipeRating


rating_bp = Blueprint("rating_bp", __name__)

# app/routes/rating_routes.py

@rating_bp.route("/debug/ratings/<int:user_id>")
def debug_ratings(user_id):
    from app.models import RecipeRating
    data = [
        {"title": r.title, "rating": r.rating}
        for r in RecipeRating.query.filter_by(user_id=user_id).all()
    ]
    return jsonify(data)

@rating_bp.route("/recipes/rating/<recipe_hash>", methods=["GET"])
def get_average_rating(recipe_hash):
    from app.models import RecipeRating
    from sqlalchemy import func

    ratings = RecipeRating.query.with_entities(
        func.avg(RecipeRating.rating), func.count()
    ).filter_by(recipe_hash=recipe_hash).first()

    avg = round(ratings[0] or 0, 2)
    count = ratings[1]

    return jsonify({
        "recipe_hash": recipe_hash,
        "average_rating": avg,
        "num_ratings": count
    })


@rating_bp.route("/recipes/rate", methods=["POST"])
def rate_recipe_api():
    """
    מקבל דירוג מ־Frontend עבור מתכון מוצע.
    גוף הבקשה חייב לכלול:
    {
        "user_id": int,
        "rating": int (1–5),
        "recipe": {title, ingredients, instructions, ...}
    }
    """
    data = request.get_json()

    user_id = data.get("user_id")
    rating = data.get("rating")
    recipe = data.get("recipe")

    if not user_id or not recipe or not isinstance(rating, int):
        return jsonify({"error": "Missing user_id, rating, or recipe"}), 400
    if not (1 <= rating <= 5):
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    recipe_hash = rate_recipe(user_id=user_id, recipe=recipe, rating=rating)

    return jsonify({"message": "Rating saved", "recipe_hash": recipe_hash})
