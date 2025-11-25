#recipe_usage_service.py
from datetime import date, datetime, timedelta
from app.models import InventoryItem
from app.extensions import db
from app.utils.ingredient_utils import classify_ingredient, AVERAGE_WEIGHT
from app.utils.unit_normalizer import UNIT_MAP

def normalize(name: str, qty: float, unit: str) -> tuple[float, str]:
    name = name.lower()
    unit = unit.lower().strip()
    
    ingredient_type = classify_ingredient(name)

    # המרה לפי טבלת יחידות
    target_unit, factor = UNIT_MAP.get(unit, (unit, 1))
    qty *= factor

    # אם מדובר ברכיב "ספור" כמו ביצה – נתרגם ל־grams אם יש משקל ממוצע
    if ingredient_type == "countable" and target_unit == "pieces":
        avg_weight = AVERAGE_WEIGHT.get(name)
        if avg_weight:
            return qty * avg_weight, "grams"

    return qty, target_unit


def update_inventory_after_recipe(user_id: int, ingredients: list) -> dict:
    if not user_id or not ingredients:
        return {"error": "Missing user_id or ingredients"}

    updated_items, skipped_items, removed_items = [], [], []

    for ing in ingredients:
        name = ing.get("name")
        used_qty = float(ing.get("quantity", 0))
        used_unit = ing.get("unit")
        if not name or used_qty <= 0 or not used_unit:
            continue

        # --- נרמול כמות מהמתכון ---
        used_qty_norm, used_unit_norm = normalize(name, used_qty, used_unit)

        # --- שליפת *כל* הרשומות של אותו רכיב ---
        items = (
            InventoryItem.query
            .filter_by(user_id=user_id, name=name)
            .all()
        )
        if not items:
            skipped_items.append(name)
            continue

        # --- ממיינים לפי expiry_date (ללא תאריך → "אינסוף") ---
        items.sort(key=lambda item: item.expiration_date or date.max)

        # --- צריכה הדרגתית מהפריט הקרוב לפוגה והלאה ---
        remaining_to_use = used_qty_norm
        for item in items:
            # יחידות במלאי → נרמול
            inv_qty_norm, inv_unit_norm = normalize(name, item.quantity, item.unit)

            # דילוג אם היחידות לא תואמות
            if inv_unit_norm != used_unit_norm:
                skipped_items.append(name)
                continue

            if remaining_to_use <= 0:
                break  # סיימנו עם המצרך הזה

            if inv_qty_norm > remaining_to_use:
                # מספיק בפריט הזה → עדכון כמות
                item.quantity = inv_qty_norm - remaining_to_use
                item.unit = inv_unit_norm          # ⭐️ הוספה – מעדכן גם את היחידה!
                updated_items.append({
                    "name":   name,
                    "unit":   inv_unit_norm,
                    "from":   round(inv_qty_norm, 2),
                    "to":     round(item.quantity, 2),
                    "expiry": item.expiration_date.isoformat() if item.expiration_date else None
                })
                remaining_to_use = 0
            else:
                # צורכים הכול → מחיקה
                remaining_to_use -= inv_qty_norm
                removed_items.append({
                    "name": name,
                    "unit": inv_unit_norm,
                    "removed_qty": round(inv_qty_norm, 2),
                    "expiry": item.expiration_date.isoformat() if item.expiration_date else None
                })
                db.session.delete(item)

        # אם כמות המתכון עדיין לא כוסתה – מוסיפים ל-skipped (לא היה מלאי מספיק)
        if remaining_to_use > 0:
            skipped_items.append(f"{name} (missing {round(remaining_to_use,2)} {used_unit_norm})")

    db.session.commit()

    return {
        "message": "Inventory updated after using recipe",
        "updated_items": updated_items,
        "removed": removed_items,
        "skipped": skipped_items
    }