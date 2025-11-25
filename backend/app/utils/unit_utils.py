from app.utils.unit_constants import AVERAGE_WEIGHT, UNIT_MAP, MIN_QTY, MAX_QTY


def normalize_single_unit(quantity, unit):
    unit = unit.lower().strip()
    target_unit, factor = UNIT_MAP.get(unit, (unit, 1))
    normalized_quantity = round(quantity * factor, 2)

    if target_unit == "grams" and normalized_quantity >= 1000:
        return round(normalized_quantity / 1000, 2), "kg"
    if target_unit == "ml" and normalized_quantity >= 1000:
        return round(normalized_quantity / 1000, 2), "l"

    return normalized_quantity, target_unit
