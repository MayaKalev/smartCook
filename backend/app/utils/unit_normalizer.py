
from app.services.inventory_service import get_category_and_avg_weight
from app.utils.unit_constants import AVERAGE_WEIGHT, UNIT_MAP, MIN_QTY, MAX_QTY


def normalize_ingredient_units(recipes: list[dict], user_id: int) -> list[dict]:
    category_cache = {}

    def get_cached_info(name: str) -> tuple[str, float | None]:
        if name in category_cache:
            return category_cache[name]
        cat, avg_weight = get_category_and_avg_weight(name, user_id)
        category_cache[name] = (cat, avg_weight)
        return cat, avg_weight

    for recipe in recipes:
        for ing in recipe.get("ingredients", []):
            name = ing.get("name", "").lower()
            unit = ing.get("unit", "").lower()
            quantity = ing.get("quantity", 0)

            category, avg_weight = get_cached_info(name)
            avg_weight = avg_weight or AVERAGE_WEIGHT.get(name)  # fallback למילון

            if category == "fruit_And_Vegetable":
                if unit in ["grams", "g", "kg"] and avg_weight:
                    total_grams = quantity * 1000 if unit == "kg" else quantity
                    pieces = round(total_grams / avg_weight)
                    ing["unit"] = "pieces"
                    ing["quantity"] = max(1, pieces)
                else:
                    ing["unit"] = unit
                    ing["quantity"] = round(quantity)

            elif category == "countable":
                if unit in ["grams", "g", "kg"]:
                    if avg_weight:
                        total_grams = quantity * 1000 if unit == "kg" else quantity
                        pieces = round(total_grams / avg_weight)
                        ing["unit"] = "pieces"
                        ing["quantity"] = max(1, pieces)
                    else:
                        ing["unit"] = "pieces"
                        ing["quantity"] = 1
                else:
                    ing["unit"] = "pieces"

            elif category == "dairy":
                target_unit, factor = UNIT_MAP.get(unit, (unit.strip(), 1))
                ing["unit"] = target_unit
                ing["quantity"] = round(quantity * factor, 2)

            else:
                target_unit, factor = UNIT_MAP.get(unit, (unit.strip(), 1))
                ing["unit"] = target_unit
                ing["quantity"] = round(quantity * factor, 2)

                min_qty = MIN_QTY.get(category)
                max_qty = MAX_QTY.get(category)
                if min_qty and ing["quantity"] < min_qty:
                    ing["quantity"] = min_qty
                if max_qty and ing["quantity"] > max_qty:
                    ing["quantity"] = max_qty

    return recipes
