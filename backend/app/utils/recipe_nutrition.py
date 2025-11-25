# app/utils/recipe_nutrition.py
from collections import defaultdict
from app.models import InventoryItem
from app.utils.unit_utils import normalize_single_unit

def calc_recipe_nutrition(ingredients: list[dict]) -> dict:
    """
    Sum kcal / protein / carbs / fat for the whole recipe.
    Uses values already stored on inventory_items (any user).
    """
    total = defaultdict(float)

    for ing in ingredients:
        name = (ing.get("name") or "").strip().lower()
        quantity  = float(ing.get("quantity") or 0)          # ← quantity
        unit = ing.get("unit", "")
        if not name or quantity <= 0 or not unit:
            continue

        norm_qty, _ = normalize_single_unit(quantity, unit)

        row = (
            InventoryItem.query
            .filter_by(name=name)
            .filter(InventoryItem.calories.isnot(None))
            .first()
        )
        if not row:
            continue          # אין נתונים במלאי – דולג

        factor = norm_qty / 100.0
        total["calories"] += (row.calories or 0) * factor
        total["protein"]  += (row.protein  or 0) * factor
        total["carbs"]    += (row.carbs    or 0) * factor
        total["fat"]      += (row.fat      or 0) * factor

    return {k: round(v, 2) for k, v in total.items()}
