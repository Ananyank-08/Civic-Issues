"""Hybrid Verification Engine — cross-validates NLP vs Image results."""

from constants import CATEGORY_DEPT_MAP


def hybrid_verify(nlp_category: str, image_category: str):
    """
    Cross-validates NLP text category against CNN image category.

    Returns:
        (final_category: str | None, mismatch: bool, department: str)
    """
    # Both agree → auto-accept
    if nlp_category == image_category:
        dept = CATEGORY_DEPT_MAP.get(nlp_category, "Others")
        return nlp_category, False, dept

    # Image inconclusive → trust NLP
    if image_category == "Unknown":
        dept = CATEGORY_DEPT_MAP.get(nlp_category, "Others")
        return nlp_category, False, dept

    # NLP uncertain → trust image
    if nlp_category == "Others":
        dept = CATEGORY_DEPT_MAP.get(image_category, "Others")
        return image_category, False, dept

    # Genuine mismatch → flag for admin
    return None, True, "Pending Review"


def resolve_mismatch(confirmed_category: str):
    """Resolve a flagged mismatch with admin-confirmed category."""
    dept = CATEGORY_DEPT_MAP.get(confirmed_category, "Others")
    return confirmed_category, dept
