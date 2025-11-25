from PIL import Image
from pyzbar.pyzbar import decode
import io
import base64

def decode_barcode_from_base64(base64_str):
    try:
        image_data = base64.b64decode(base64_str.split(",")[-1])
        image = Image.open(io.BytesIO(image_data))
        decoded_objects = decode(image)
        if decoded_objects:
            return decoded_objects[0].data.decode("utf-8")  # מחזיר את הברקוד הראשון שנמצא
        return None
    except Exception as e:
        print("Barcode decoding error:", e)
        return None
