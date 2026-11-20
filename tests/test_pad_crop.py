from PIL import Image
from backend.app.services.pad_service import pad_service, PADService
from backend.app.core.config import settings


def test_crop_uses_face_box_with_margin():
    im = Image.new("RGB", (640, 480), (10, 20, 30))
    out = PADService.crop_to_face(im, [220, 140, 100, 120], 1.4)
    side = 120 * 1.4
    assert abs(out.size[0] - side) <= 2 and abs(out.size[1] - side) <= 2


def test_crop_is_clamped_to_image():
    im = Image.new("RGB", (200, 200))
    out = PADService.crop_to_face(im, [150, 150, 100, 100], 1.4)
    assert out.size[0] <= 200 and out.size[1] <= 200 and out.size[0] >= 8


def test_no_box_or_zero_margin_returns_full_image():
    im = Image.new("RGB", (320, 240))
    assert PADService.crop_to_face(im, None, 1.4) is im
    assert PADService.crop_to_face(im, [10, 10, 50, 50], 0) is im
    assert PADService.crop_to_face(im, [10, 10, 1, 1], 1.4) is im


def test_predict_reports_face_crop_flag():
    im = Image.new("RGB", (640, 480), (127, 127, 127))
    with_box = pad_service.predict(im, face_box=[200, 120, 160, 200])
    without = pad_service.predict(im)
    assert with_box["face_cropped"] is (settings.PAD_CROP_MARGIN > 0)
    assert without["face_cropped"] is False
    assert 0.0 <= with_box["attack_score"] <= 1.0
